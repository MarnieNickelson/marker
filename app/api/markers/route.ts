import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Retrieve all markers for the current user
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
    const gridId = searchParams.get('gridId');
    const includeGrid = searchParams.get('includeGrid') === 'true';
    const allUsers = searchParams.get('allUsers') === 'true';
    
    // Base query conditions
    let where: any = {};
    
    // Filter by grid if specified
    if (gridId) {
      where.gridId = gridId;
      
      // Verify user has access to this grid
      if (!isAdmin || !allUsers) {
        const grid = await prisma.grid.findUnique({
          where: { id: gridId },
          select: { userId: true }
        });
        
        if (!grid || (grid.userId !== userId && !isAdmin)) {
          return NextResponse.json({ error: 'Access denied to this grid' }, { status: 403 });
        }
      }
    }
    
    // For admins requesting all markers
    if (isAdmin && allUsers) {
      // No additional filters needed - admin can see all
    } 
    // For regular users or admins not requesting all
    else {
      where.userId = userId;
    }
    
    const markers = await prisma.marker.findMany({
      where,
      include: {
        grid: includeGrid,
        brand: true, // Include the brand information
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
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
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    const body = await request.json();
    
    // Validate the input
    const { 
      markerNumber, 
      colorName, 
      colorHex, 
      brandId, // Now using brandId instead of brand
      quantity, 
      gridId, 
      columnNumber, 
      rowNumber 
    } = body;
    
    if (!markerNumber || !colorName || !gridId || !columnNumber || !rowNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify user has access to this grid
    const targetGrid = await prisma.grid.findUnique({
      where: { id: gridId }
    });
    
    if (!targetGrid) {
      return NextResponse.json({ error: 'Grid not found' }, { status: 404 });
    }
    
    // Check user owns the grid or is admin
    if (targetGrid.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Access denied to this grid' }, { status: 403 });
    }
    
    // If brand is specified, verify it exists
    if (brandId) {
      const brandExists = await prisma.brand.findUnique({
        where: { id: brandId }
      });
      
      if (!brandExists) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
      }
    }
    
    // Validate column and row numbers against grid dimensions
    if (columnNumber < 1 || columnNumber > targetGrid.columns || rowNumber < 1 || rowNumber > targetGrid.rows) {
      return NextResponse.json(
        { error: `Position must be within grid dimensions: columns 1-${targetGrid.columns}, rows 1-${targetGrid.rows}` }, 
        { status: 400 }
      );
    }
    
    // Check if position is already occupied in the grid
    const occupiedPosition = await prisma.marker.findFirst({
      where: { 
        gridId,
        columnNumber: parseInt(columnNumber.toString()),
        rowNumber: parseInt(rowNumber.toString()),
      }
    });
    
    if (occupiedPosition) {
      return NextResponse.json(
        { error: 'This position is already occupied by another marker' }, 
        { status: 409 }
      );
    }
    
    // Create the marker (no need to check for duplicate markerNumber)
    const newMarker = await prisma.marker.create({
      data: {
        markerNumber,
        colorName,
        colorHex: colorHex || '#000000',
        brandId: brandId || null, // Use brandId instead of brand
        quantity: 1, // Default to 1, quantity will be computed based on instances
        gridId,
        columnNumber: parseInt(columnNumber.toString()),
        rowNumber: parseInt(rowNumber.toString()),
        userId: userId, // Associate with current user
      },
      include: {
        brand: true, // Include brand in response
      }
    });
    
    return NextResponse.json(newMarker, { status: 201 });
  } catch (error) {
    console.error('Error creating marker:', error);
    return NextResponse.json({ error: 'Failed to create marker' }, { status: 500 });
  }
}
