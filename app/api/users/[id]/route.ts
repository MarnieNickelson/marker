import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Retrieve a specific user (admin only, or the user themselves)
export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin role or is the user themselves
    if (!session || (session.user.role !== 'admin' && session.user.id !== userId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        // Only include counts for admin
        ...(session.user.role === 'admin' ? {
          _count: {
            select: {
              grids: true,
              brands: true,
            }
          }
        } : {})
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Update a specific user (admin only, or limited updates by the user themselves)
export async function PUT(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get current user data to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Determine what fields can be updated based on role
    let updateData: any = {};
    
    if (session.user.role === 'admin') {
      // Admins can update any field
      if (body.name !== undefined) updateData.name = body.name;
      if (body.role !== undefined) updateData.role = body.role;
      if (body.isApproved !== undefined) updateData.isApproved = body.isApproved;
      
      // Prevent removing the last admin
      if (body.role && body.role !== 'admin' && currentUser.role === 'admin') {
        // Check if this is the last admin
        const adminCount = await prisma.user.count({
          where: { role: 'admin' }
        });
        
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Cannot remove the last admin user' },
            { status: 400 }
          );
        }
      }
    } else if (session.user.id === userId) {
      // Users can only update their own name
      if (body.name !== undefined) updateData.name = body.name;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized to update this user' },
        { status: 403 }
      );
    }

    // If nothing to update, return the current user
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(currentUser);
    }
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user (admin only)
export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    // Don't allow deleting themselves
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prevent removing the last admin
    if (user.role === 'admin') {
      const adminCount = await prisma.user.count({
        where: { role: 'admin' }
      });
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }
    
    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
