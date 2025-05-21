import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Marker API - Single Marker Operations
 * 
 * Endpoints:
 * - GET    - Fetch a single marker by ID
 * - PUT    - Update a marker's information
 * - DELETE - Remove a marker from the database
 * 
 * These endpoints support the ability to:
 * 1. View a single marker's details
 * 2. Update a marker's properties, including moving it to a different storage location
 * 3. Delete a marker from the system
 */

// GET a single marker by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const marker = await prisma.marker.findUnique({
      where: { id: params.id },
      include: { grid: true },
    });

    if (!marker) {
      return NextResponse.json(
        { error: 'Marker not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(marker);
  } catch (error) {
    console.error('Error fetching marker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marker' },
      { status: 500 }
    );
  }
}

// PUT/PATCH - Update a marker by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      markerNumber,
      colorName,
      colorHex,
      brand,
      quantity,
      gridId,
      columnNumber,
      rowNumber
    } = body;

    // Find the marker to verify it exists
    const existingMarker = await prisma.marker.findUnique({
      where: { id: params.id },
    });

    if (!existingMarker) {
      return NextResponse.json(
        { error: 'Marker not found' },
        { status: 404 }
      );
    }

    // Check if grid exists when changing grid
    if (gridId) {
      const grid = await prisma.grid.findUnique({
        where: { id: gridId }
      });
      
      if (!grid) {
        return NextResponse.json(
          { error: 'Selected grid does not exist' },
          { status: 404 }
        );
      }
      
      // Validate column and row numbers against grid dimensions
      if (columnNumber && rowNumber) {
        if (columnNumber < 1 || columnNumber > grid.columns || 
            rowNumber < 1 || rowNumber > grid.rows) {
          return NextResponse.json(
            { error: `Position must be within grid dimensions: columns 1-${grid.columns}, rows 1-${grid.rows}` },
            { status: 400 }
          );
        }
      }
    }

    // Check if marker number already exists if changing it
    if (markerNumber && markerNumber !== existingMarker.markerNumber) {
      const markerWithSameNumber = await prisma.marker.findUnique({
        where: { markerNumber },
      });
      
      if (markerWithSameNumber) {
        return NextResponse.json(
          { error: 'A marker with this number already exists' },
          { status: 409 }
        );
      }
    }

    // Update the marker
    const updatedMarker = await prisma.marker.update({
      where: { id: params.id },
      data: {
        ...(markerNumber && { markerNumber }),
        ...(colorName && { colorName }),
        ...(colorHex && { colorHex }),
        ...(brand !== undefined && { brand }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(gridId && { gridId }),
        ...(columnNumber && { columnNumber: Number(columnNumber) }),
        ...(rowNumber && { rowNumber: Number(rowNumber) }),
      },
      include: { grid: true },
    });
    
    return NextResponse.json(updatedMarker);
  } catch (error) {
    console.error('Error updating marker:', error);
    return NextResponse.json(
      { error: 'Failed to update marker' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a marker by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the marker exists
    const marker = await prisma.marker.findUnique({
      where: { id: params.id },
    });

    if (!marker) {
      return NextResponse.json(
        { error: 'Marker not found' },
        { status: 404 }
      );
    }

    // Delete the marker
    await prisma.marker.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Marker deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting marker:', error);
    return NextResponse.json(
      { error: 'Failed to delete marker' },
      { status: 500 }
    );
  }
}
