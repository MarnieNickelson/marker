import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Props = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  props: Props
) {
  try {
    const params = await props.params;
    const id = params.id;
    
    const grid = await prisma.grid.findUnique({
      where: { id },
      include: { markers: true } // Include all markers in this grid
    });
    
    if (!grid) {
      return NextResponse.json({ error: 'Grid not found' }, { status: 404 });
    }
    
    return NextResponse.json(grid);
  } catch (error) {
    console.error('Error fetching grid:', error);
    return NextResponse.json({ error: 'Failed to fetch grid' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: Props
) {
  try {
    const params = await props.params;
    const id = params.id;
    const body = await request.json();
    
    // Validate the input
    const { name, columns, rows } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Grid name is required' }, { status: 400 });
    }
    
    // Check if grid exists
    const existingGrid = await prisma.grid.findUnique({
      where: { id }
    });
    
    if (!existingGrid) {
      return NextResponse.json({ error: 'Grid not found' }, { status: 404 });
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
  props: Props
) {
  try {
    const params = await props.params;
    const id = params.id;
    
    // Check if grid exists
    const existingGrid = await prisma.grid.findUnique({
      where: { id },
      include: { markers: { select: { id: true } } }
    });
    
    if (!existingGrid) {
      return NextResponse.json({ error: 'Grid not found' }, { status: 404 });
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
