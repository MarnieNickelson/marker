import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Retrieve all markers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gridId = searchParams.get('gridId');
    const includeGrid = searchParams.get('includeGrid') === 'true';
    
    const where = gridId ? { gridId } : {};
    
    const markers = await prisma.marker.findMany({
      where,
      include: {
        grid: includeGrid
      },
      orderBy: {
        markerNumber: 'asc'
      }
    });
    
    return NextResponse.json(markers);
  } catch (error) {
    console.error('Error fetching markers:', error);
    return NextResponse.json({ error: 'Failed to fetch markers' }, { status: 500 });
  }
}

// POST - Create a new marker
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the input
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
    
    if (!markerNumber || !colorName || !gridId || !columnNumber || !rowNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if grid exists
    const grid = await prisma.grid.findUnique({
      where: { id: gridId }
    });
    
    if (!grid) {
      return NextResponse.json({ error: 'Selected grid does not exist' }, { status: 404 });
    }
    
    // Validate column and row numbers against grid dimensions
    if (columnNumber < 1 || columnNumber > grid.columns || rowNumber < 1 || rowNumber > grid.rows) {
      return NextResponse.json(
        { error: `Position must be within grid dimensions: columns 1-${grid.columns}, rows 1-${grid.rows}` }, 
        { status: 400 }
      );
    }
    
    // Check if marker with this number already exists
    const existingMarker = await prisma.marker.findUnique({
      where: { markerNumber },
    });
    
    if (existingMarker) {
      return NextResponse.json(
        { error: 'A marker with this number already exists' }, 
        { status: 409 }
      );
    }
    
    // Create the marker
    const newMarker = await prisma.marker.create({
      data: {
        markerNumber,
        colorName,
        colorHex: colorHex || '#000000',
        brand: brand || '',
        quantity: quantity || 1,
        gridId,
        columnNumber: parseInt(columnNumber.toString()),
        rowNumber: parseInt(rowNumber.toString()),
      },
    });
    
    return NextResponse.json(newMarker, { status: 201 });
  } catch (error) {
    console.error('Error creating marker:', error);
    return NextResponse.json({ error: 'Failed to create marker' }, { status: 500 });
  }
}
