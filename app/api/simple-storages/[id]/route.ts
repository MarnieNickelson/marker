import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';

type Props = {
  params: Promise<{ id: string }>
}

// GET /api/simple-storages/[id] - Get a specific simple storage
export async function GET(
  request: NextRequest,
  props: Props
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const userId = session.user.id;
    const isAdmin = session.user.role === 'admin';

    // Use raw query to get simple storage
    let storageResults;
    if (isAdmin) {
      storageResults = await prisma.$queryRaw`
        SELECT id, name, description, userId, createdAt, updatedAt 
        FROM SimpleStorage 
        WHERE id = ${id} LIMIT 1
      `;
    } else {
      storageResults = await prisma.$queryRaw`
        SELECT id, name, description, userId, createdAt, updatedAt 
        FROM SimpleStorage 
        WHERE id = ${id} AND userId = ${userId} LIMIT 1
      `;
    }

    if (!storageResults || (Array.isArray(storageResults) && storageResults.length === 0)) {
      return NextResponse.json({ error: 'Simple storage not found' }, { status: 404 });
    }

    const storage = Array.isArray(storageResults) ? storageResults[0] : storageResults;
    return NextResponse.json(storage);
  } catch (error) {
    console.error('Error fetching simple storage:', error);
    return NextResponse.json({ error: 'Failed to fetch simple storage' }, { status: 500 });
  }
}

// PUT /api/simple-storages/[id] - Update a specific simple storage
export async function PUT(
  request: NextRequest,
  props: Props
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const userId = session.user.id;
    const isAdmin = session.user.role === 'admin';

    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if storage exists and user has access
    let existingStorageResults;
    if (isAdmin) {
      existingStorageResults = await prisma.$queryRaw`
        SELECT * FROM SimpleStorage WHERE id = ${id}
      `;
    } else {
      existingStorageResults = await prisma.$queryRaw`
        SELECT * FROM SimpleStorage WHERE id = ${id} AND userId = ${userId}
      `;
    }

    if (!existingStorageResults || (Array.isArray(existingStorageResults) && existingStorageResults.length === 0)) {
      return NextResponse.json({ error: 'Simple storage not found' }, { status: 404 });
    }

    // Check for duplicate names (excluding current storage)
    const duplicateResults = await prisma.$queryRaw`
      SELECT id FROM SimpleStorage 
      WHERE name = ${name.trim()} 
      AND userId = ${userId} 
      AND id != ${id}
    `;

    if (duplicateResults && Array.isArray(duplicateResults) && duplicateResults.length > 0) {
      return NextResponse.json({ error: 'A storage location with this name already exists' }, { status: 409 });
    }

    // Update the storage
    await prisma.$executeRaw`
      UPDATE SimpleStorage 
      SET name = ${name.trim()}, 
          description = ${description?.trim() || null},
          updatedAt = NOW()
      WHERE id = ${id}
    `;

    // Fetch and return updated storage
    const updatedResults = await prisma.$queryRaw`
      SELECT * FROM SimpleStorage WHERE id = ${id}
    `;

    const updatedStorage = Array.isArray(updatedResults) ? updatedResults[0] : updatedResults;
    return NextResponse.json(updatedStorage);
  } catch (error) {
    console.error('Error updating simple storage:', error);
    return NextResponse.json({ error: 'Failed to update simple storage' }, { status: 500 });
  }
}

// DELETE /api/simple-storages/[id] - Delete a specific simple storage
export async function DELETE(
  request: NextRequest,
  props: Props
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const userId = session.user.id;
    const isAdmin = session.user.role === 'admin';

    // Check if storage exists and user has access
    let existingStorageResults;
    if (isAdmin) {
      existingStorageResults = await prisma.$queryRaw`
        SELECT * FROM SimpleStorage WHERE id = ${id}
      `;
    } else {
      existingStorageResults = await prisma.$queryRaw`
        SELECT * FROM SimpleStorage WHERE id = ${id} AND userId = ${userId}
      `;
    }

    if (!existingStorageResults || (Array.isArray(existingStorageResults) && existingStorageResults.length === 0)) {
      return NextResponse.json({ error: 'Simple storage not found' }, { status: 404 });
    }

    // Check if any markers are using this storage
    const markersResults = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM Marker WHERE simpleStorageId = ${id}
    `;

    const count = Array.isArray(markersResults) && markersResults[0] ? (markersResults[0] as any).count : 0;
    
    if (count > 0) {
      return NextResponse.json({ 
        error: `Cannot delete storage location. ${count} marker(s) are currently stored here. Please move or remove the markers first.` 
      }, { status: 400 });
    }

    // Delete the storage
    await prisma.$executeRaw`
      DELETE FROM SimpleStorage WHERE id = ${id}
    `;

    return NextResponse.json({ message: 'Simple storage deleted successfully' });
  } catch (error) {
    console.error('Error deleting simple storage:', error);
    return NextResponse.json({ error: 'Failed to delete simple storage' }, { status: 500 });
  }
}
