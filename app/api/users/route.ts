import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Retrieve all users (admin only)
export async function GET(request: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    // Fetch all users with sensitive information excluded
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            grids: true,
            brands: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
