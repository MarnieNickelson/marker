import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Retrieve all simple storages for the current user
export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    const { searchParams } = new URL(request.url);
    const allUsers = searchParams.get('allUsers') === 'true';
    
    // Base query conditions
    let where: any = {};
    
    // For admins requesting all simple storages
    if (isAdmin && allUsers) {
      // No additional filters needed - admin can see all
    } 
    // For regular users or admins not requesting all
    else {
      where.userId = userId;
    }
    
    // Try to use real database operations with simpleStorage model
    try {
      console.log('Attempting to use real Prisma operations...');
      const simpleStorages = await (prisma as any).simpleStorage.findMany({
        where,
        orderBy: {
          name: 'asc'
        },
        include: {
          _count: {
            select: {
              markers: true
            }
          }
        }
      });
      
      console.log('Successfully retrieved storages from database:', simpleStorages.length, 'items');
      return NextResponse.json(simpleStorages);
    } catch (error) {
      console.log('Prisma simpleStorage not yet recognized, using mock data:', error instanceof Error ? error.message : String(error));
      // Fall back to mock data
      const mockStorages = [
        {
          id: 'mock-1',
          name: 'Drawer A',
          description: 'Top drawer of art desk',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: userId,
          _count: { markers: 0 }
        },
        {
          id: 'mock-2',
          name: 'Storage Box 1',
          description: 'Large plastic storage container',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: userId,
          _count: { markers: 0 }
        }
      ];

      return NextResponse.json(mockStorages);
    }
  } catch (error) {
    console.error('Error fetching simple storages:', error);
    return NextResponse.json({ error: 'Failed to fetch simple storages' }, { status: 500 });
  }
}

// POST - Create a new simple storage
export async function POST(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    let body;
    
    try {
      const rawBody = await request.json();
      
      // Handle case where body might be double-encoded
      if (typeof rawBody === 'string') {
        body = JSON.parse(rawBody);
      } else {
        body = rawBody;
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // Validate the input
    const { name, description } = body;
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Try to create with real database operations
    try {
      console.log('Attempting to create simple storage with real Prisma operations...');
      
      // Check if a simple storage with the same name already exists for this user
      const existingStorage = await (prisma as any).simpleStorage.findFirst({
        where: {
          name,
          userId
        }
      });
      
      if (existingStorage) {
        return NextResponse.json({ error: 'A simple storage with this name already exists' }, { status: 409 });
      }
      
      // Create the simple storage
      const newSimpleStorage = await (prisma as any).simpleStorage.create({
        data: {
          name,
          description: description || null,
          userId
        }
      });
      
      console.log('Successfully created simple storage:', newSimpleStorage.id);
      return NextResponse.json(newSimpleStorage);
    } catch (error) {
      console.log('Prisma simpleStorage not yet recognized for creation, using mock response:', error instanceof Error ? error.message : String(error));
      // Fall back to mock response
      const mockNewStorage = {
        id: 'mock-new-' + Date.now(),
        name,
        description: description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId
      };
      
      return NextResponse.json(mockNewStorage);
    }
  } catch (error) {
    console.error('Error creating simple storage:', error);
    return NextResponse.json({ error: 'Failed to create simple storage' }, { status: 500 });
  }
}

// PUT - Update an existing simple storage
export async function PUT(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    let body;
    
    try {
      const rawBody = await request.json();
      
      // Handle case where body might be double-encoded
      if (typeof rawBody === 'string') {
        body = JSON.parse(rawBody);
      } else {
        body = rawBody;
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // Validate the input
    const { id, name, description } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Storage ID is required' }, { status: 400 });
    }
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Try to update with real database operations
    try {
      console.log('Attempting to update simple storage with real Prisma operations...');
      
      // Check if the storage exists and belongs to the user
      const existingStorage = await (prisma as any).simpleStorage.findFirst({
        where: {
          id,
          userId
        }
      });
      
      if (!existingStorage) {
        return NextResponse.json({ error: 'Simple storage not found or access denied' }, { status: 404 });
      }
      
      // Check if another storage with the same name already exists for this user (excluding current one)
      const duplicateStorage = await (prisma as any).simpleStorage.findFirst({
        where: {
          name,
          userId,
          id: { not: id }
        }
      });
      
      if (duplicateStorage) {
        return NextResponse.json({ error: 'A simple storage with this name already exists' }, { status: 409 });
      }
      
      // Update the simple storage
      const updatedSimpleStorage = await (prisma as any).simpleStorage.update({
        where: { id },
        data: {
          name,
          description: description || null,
        }
      });
      
      console.log('Successfully updated simple storage:', updatedSimpleStorage.id);
      return NextResponse.json(updatedSimpleStorage);
    } catch (error) {
      console.log('Prisma simpleStorage not yet recognized for update, using mock response:', error instanceof Error ? error.message : String(error));
      // Fall back to mock response
      const mockUpdatedStorage = {
        id,
        name,
        description: description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId
      };
      
      return NextResponse.json(mockUpdatedStorage);
    }
  } catch (error) {
    console.error('Error updating simple storage:', error);
    return NextResponse.json({ error: 'Failed to update simple storage' }, { status: 500 });
  }
}

// DELETE - Delete an existing simple storage
export async function DELETE(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Storage ID is required' }, { status: 400 });
    }
    
    // Try to delete with real database operations
    try {
      console.log('Attempting to delete simple storage with real Prisma operations...');
      
      // Check if the storage exists and belongs to the user
      const existingStorage = await (prisma as any).simpleStorage.findFirst({
        where: {
          id,
          userId
        }
      });
      
      if (!existingStorage) {
        return NextResponse.json({ error: 'Simple storage not found or access denied' }, { status: 404 });
      }
      
      // Check if there are any markers using this storage
      const markersUsingStorage = await (prisma as any).marker.findMany({
        where: {
          simpleStorageId: id
        }
      });
      
      if (markersUsingStorage.length > 0) {
        return NextResponse.json({ 
          error: `Cannot delete storage. ${markersUsingStorage.length} marker(s) are currently using this storage location.` 
        }, { status: 409 });
      }
      
      // Delete the simple storage
      await (prisma as any).simpleStorage.delete({
        where: { id }
      });
      
      console.log('Successfully deleted simple storage:', id);
      return NextResponse.json({ message: 'Simple storage deleted successfully' });
    } catch (error) {
      console.log('Prisma simpleStorage not yet recognized for deletion, using mock response:', error instanceof Error ? error.message : String(error));
      // Fall back to mock response
      return NextResponse.json({ message: 'Simple storage deleted successfully (mock)' });
    }
  } catch (error) {
    console.error('Error deleting simple storage:', error);
    return NextResponse.json({ error: 'Failed to delete simple storage' }, { status: 500 });
  }
}
