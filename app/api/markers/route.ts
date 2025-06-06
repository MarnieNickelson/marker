import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hexToHSL, isColorInFamily } from '@/app/utils/colorUtils';

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
    const simpleStorageId = searchParams.get('simpleStorageId');
    const includeGrid = searchParams.get('includeGrid') === 'true';
    const includeSimpleStorage = searchParams.get('includeSimpleStorage') === 'true';
    const allUsers = searchParams.get('allUsers') === 'true';
    const colorFamily = searchParams.get('colorFamily');
    
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
    
    // Filter by simple storage if specified
    if (simpleStorageId) {
      where.simpleStorageId = simpleStorageId;
    }
    
    // For admins requesting all markers
    if (isAdmin && allUsers) {
      // No additional filters needed - admin can see all
    } 
    // For regular users or admins not requesting all
    else {
      where.userId = userId;
    }
    
    // Get all markers that match the basic criteria
    const includeOptions = {
      grid: includeGrid,
      brand: true, // Include the brand information
      simpleStorage: includeSimpleStorage,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    };

    console.log("API include options:", includeOptions);

    const markers = await prisma.marker.findMany({
      where,
      include: includeOptions,
      orderBy: {
        markerNumber: 'asc'
      }
    });

    // Log first marker for debugging
    if (markers.length > 0) {
      console.log("First marker sample:", {
        id: markers[0].id,
        hasGrid: markers[0].grid !== undefined,
        hasSimpleStorage: markers[0].simpleStorage !== undefined,
      });
    }

    // Apply color family filtering if specified
    let filteredMarkers = markers;
    if (colorFamily) {
      filteredMarkers = markers.filter(marker => {
        // Special handling for brown and black which need precedence
        if (colorFamily === 'brown') {
          return isColorInFamily(marker.colorHex, 'brown');
        } else if (colorFamily === 'black') {
          return isColorInFamily(marker.colorHex, 'black');
        } else {
          // For other color families, exclude browns if they would also match in orange/yellow ranges
          const isBrown = isColorInFamily(marker.colorHex, 'brown');
          if (isBrown && (colorFamily === 'orange' || colorFamily === 'yellow')) {
            return false;
          }
          return isColorInFamily(marker.colorHex, colorFamily);
        }
      });
    }

    return NextResponse.json(filteredMarkers);
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
    const { 
      markerNumber, 
      colorName, 
      colorHex, 
      brandId, // Now using brandId instead of brand
      quantity, 
      gridId, 
      columnNumber, 
      rowNumber,
      simpleStorageId // New field for simple storage
    } = body;
    
    if (!markerNumber || !colorName) {
      return NextResponse.json({ error: 'Marker number and color name are required' }, { status: 400 });
    }
    
    // Must have either grid storage or simple storage, but not both
    if ((!gridId && !simpleStorageId) || (gridId && simpleStorageId)) {
      return NextResponse.json({ error: 'Either grid storage or simple storage must be specified, but not both' }, { status: 400 });
    }
    
    // If grid storage is specified, validate grid and coordinates
    if (gridId) {
      if (!columnNumber || !rowNumber) {
        return NextResponse.json({ error: 'Column and row numbers are required for grid storage' }, { status: 400 });
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
    }
    
    // If simple storage is specified, validate it
    if (simpleStorageId) {
      try {
        const storageResult = await prisma.$queryRaw`
          SELECT id, userId FROM SimpleStorage WHERE id = ${simpleStorageId}
        `;
        const targetSimpleStorage = Array.isArray(storageResult) ? storageResult[0] : storageResult;
        
        if (!targetSimpleStorage) {
          return NextResponse.json({ error: 'Simple storage not found' }, { status: 404 });
        }
        
        // Check user owns the simple storage or is admin
        if (targetSimpleStorage.userId !== userId && !isAdmin) {
          return NextResponse.json({ error: 'Access denied to this simple storage' }, { status: 403 });
        }
      } catch (error) {
        console.error('Error validating simple storage:', error);
        return NextResponse.json({ error: 'Error validating simple storage' }, { status: 500 });
      }
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
    
    // Create the marker data object
    const markerData: any = {
      markerNumber,
      colorName,
      colorHex: colorHex || '#000000',
      brandId: brandId || null,
      quantity: 1,
      userId: userId,
    };

    // Add grid storage fields if specified
    if (gridId) {
      markerData.gridId = gridId;
      markerData.columnNumber = parseInt(columnNumber.toString());
      markerData.rowNumber = parseInt(rowNumber.toString());
    }

    // Add simple storage field if specified
    if (simpleStorageId) {
      markerData.simpleStorageId = simpleStorageId;
    }

    // Create the marker
    const newMarker = await prisma.marker.create({
      data: markerData,
      include: {
        brand: true, // Include brand in response
        grid: true, // Include grid in response
      }
    });
    
    return NextResponse.json(newMarker, { status: 201 });
  } catch (error) {
    console.error('Error creating marker:', error);
    return NextResponse.json({ error: 'Failed to create marker' }, { status: 500 });
  }
}
