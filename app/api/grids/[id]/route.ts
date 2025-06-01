import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

type Props = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  { params }: Props
) {
  try {
    const { id } = await params;
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    // Query parameters
    const { searchParams } = new URL(request.url);
    const includeMarkers = searchParams.get('includeMarkers') === 'true';
    
    const grid = await prisma.grid.findUnique({
      where: { id },
      include: { 
        markers: includeMarkers,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!grid) {
      return NextResponse.json({ error: 'Grid not found' }, { status: 404 });
    }
    
    // Check if user has access to this grid
    if (grid.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(grid);
  } catch (error) {
    console.error('Error fetching grid:', error);
    return NextResponse.json({ error: 'Failed to fetch grid' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: Props
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    // Validate the input
    const { name, columns, rows } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Grid name is required' }, { status: 400 });
    }
    
    // Check if grid exists and user has access
    const existingGrid = await prisma.grid.findUnique({
      where: { id }
    });
    
    if (!existingGrid) {
      return NextResponse.json({ error: 'Grid not found' }, { status: 404 });
    }
    
    // Check if user has access to this grid
    if (existingGrid.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Update grid
    const updatedGrid = await prisma.grid.update({
      where: { id },
      data: {
        name,
        columns: columns ? parseInt(columns.toString()) : existingGrid.columns,
        rows: rows ? parseInt(rows.toString()) : existingGrid.rows,
      }
    });
    
    return NextResponse.json(updatedGrid);
  } catch (error) {
    console.error('Error updating grid:', error);
    return NextResponse.json({ error: 'Failed to update grid' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: Props
) {
  try {
    const { id } = await params;
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    // Check if grid exists
    const existingGrid = await prisma.grid.findUnique({
      where: { id },
      include: { markers: { select: { id: true } } }
    });
    
    if (!existingGrid) {
      return NextResponse.json({ error: 'Grid not found' }, { status: 404 });
    }
    
    // Check if user has access to this grid
    if (existingGrid.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check if grid has markers
    if (existingGrid.markers.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete grid with markers. Please reassign or delete markers first.',
        markerCount: existingGrid.markers.length
      }, { status: 400 });
    }
    
    // Delete grid
    await prisma.grid.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting grid:', error);
    return NextResponse.json({ error: 'Failed to delete grid' }, { status: 500 });
  }
}
