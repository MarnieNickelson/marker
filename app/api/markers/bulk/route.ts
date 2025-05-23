import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface BulkMarker {
  markerNumber: string;
  colorName: string;
  colorHex?: string;
  brand?: string;  // Can be brand name or brand ID
  brandId?: string; // Resolved brand ID
  quantity?: number;
  gridId?: string;
  gridName?: string;  // Allow grid name as an alternative to gridId
  columnNumber: number;
  rowNumber: number;
}

interface BulkImportRequest {
  markers: BulkMarker[];
}

// POST - Bulk import markers
export async function POST(request: Request) {
  try {
    const body = await request.json() as BulkImportRequest;
    
    if (!body.markers || !Array.isArray(body.markers) || body.markers.length === 0) {
      return NextResponse.json({ error: 'No markers provided' }, { status: 400 });
    }
    
    const { markers } = body;

    // First, process brands - find existing ones and create new ones if needed
    const brandMap = new Map<string, string>(); // brand name -> brand ID
    
    for (const marker of markers) {
      if (marker.brand && marker.brand.trim()) {
        const brandName = marker.brand.trim();
        
        // Check if it's already a valid brand ID (UUIDs are typically 25+ characters with specific format)
        if (brandName.length > 20 && brandName.includes('c')) {
          // Assume it's a brand ID, verify it exists
          const existingBrandById = await prisma.brand.findUnique({
            where: { id: brandName }
          });
          if (existingBrandById) {
            marker.brandId = brandName;
            brandMap.set(brandName, brandName);
            continue;
          }
        }
        
        // Treat as brand name - check if we've already processed this brand name
        if (!brandMap.has(brandName)) {
          // Look for existing brand by name
          let existingBrand = await prisma.brand.findUnique({
            where: { name: brandName }
          });
          
          if (!existingBrand) {
            // Create new brand
            existingBrand = await prisma.brand.create({
              data: { name: brandName }
            });
          }
          
          brandMap.set(brandName, existingBrand.id);
        }
        
        // Set the resolved brand ID
        marker.brandId = brandMap.get(brandName);
      }
    }      // Validate all markers first
    for (const marker of markers) {
      const { markerNumber, colorName, gridId, gridName, columnNumber, rowNumber } = marker;
      
      // Check required fields
      if (!markerNumber || !colorName || !columnNumber || !rowNumber) {
        return NextResponse.json({ 
          error: `Missing required fields in marker: ${JSON.stringify(marker)}` 
        }, { status: 400 });
      }
      
      // Either gridId or gridName must be provided
      if (!gridId && !gridName) {
        return NextResponse.json({ 
          error: `Either gridId or gridName must be provided for marker: ${JSON.stringify(marker)}` 
        }, { status: 400 });
      }
      
      // Validate that the grid exists - can be by ID or name
      let grid;
      
      if (gridId) {
        grid = await prisma.grid.findUnique({
          where: { id: gridId }
        });
        
        if (!grid) {
          return NextResponse.json({ 
            error: `Grid with ID "${gridId}" not found for marker: ${JSON.stringify(marker)}` 
          }, { status: 400 });
        }
      } else if (gridName) {
        grid = await prisma.grid.findFirst({
          where: { name: gridName }
        });
        
        if (!grid) {
          return NextResponse.json({ 
            error: `Grid with name "${gridName}" not found for marker: ${JSON.stringify(marker)}` 
          }, { status: 400 });
        }
        
        // Set the gridId using the found grid for consistent data handling
        marker.gridId = grid.id;
      }
      
      // At this point, grid should be defined
      if (!grid) {
        return NextResponse.json({
          error: `Unable to resolve grid for marker: ${JSON.stringify(marker)}`
        }, { status: 400 });
      }
      
      // Validate column and row numbers against grid dimensions
      if (columnNumber < 1 || columnNumber > grid.columns || rowNumber < 1 || rowNumber > grid.rows) {
        return NextResponse.json({
          error: `Column must be between 1-${grid.columns} and row must be between 1-${grid.rows} in marker: ${JSON.stringify(marker)}`
        }, { status: 400 });
      }
    }
    
    // Collect all existing marker numbers to check for duplicates
    const markerNumbers = markers.map((m: BulkMarker) => m.markerNumber);
    const existingMarkers = await prisma.marker.findMany({
      where: {
        markerNumber: {
          in: markerNumbers
        }
      },
      select: {
        markerNumber: true
      }
    });
    
    const existingNumbers = existingMarkers.map((m: { markerNumber: string }) => m.markerNumber);
    
    if (existingNumbers.length > 0) {
      return NextResponse.json({
        error: `The following marker numbers already exist: ${existingNumbers.join(', ')}`
      }, { status: 409 });
    }
    
    // Check for duplicate positions in the same grid
    const positionMap = new Map<string, BulkMarker>();
    for (const marker of markers) {
      const positionKey = `${marker.gridId}-${marker.columnNumber}-${marker.rowNumber}`;
      if (positionMap.has(positionKey)) {
        const existingMarker = positionMap.get(positionKey);
        return NextResponse.json({
          error: `Position conflict: Markers "${marker.markerNumber}" and "${existingMarker?.markerNumber}" both trying to use position (${marker.columnNumber}, ${marker.rowNumber}) in the same grid`
        }, { status: 400 });
      }
      positionMap.set(positionKey, marker);
    }
    
    // Check if positions are already occupied in the database
    const gridPositionChecks = await Promise.all(
      [...positionMap.keys()].map(async (key) => {
        const [gridId, colNum, rowNum] = key.split('-');
        const existingMarker = await prisma.marker.findFirst({
          where: {
            gridId,
            columnNumber: parseInt(colNum),
            rowNumber: parseInt(rowNum)
          },
          select: { markerNumber: true, columnNumber: true, rowNumber: true }
        });
        return { key, existingMarker };
      })
    );
    
    const conflicts = gridPositionChecks.filter(check => check.existingMarker !== null);
    if (conflicts.length > 0) {
      const conflictInfo = conflicts.map(conflict => {
        const [_, colNum, rowNum] = conflict.key.split('-');
        return `Position (${colNum}, ${rowNum}) is already occupied by marker "${conflict.existingMarker?.markerNumber}"`;
      }).join(', ');
      
      return NextResponse.json({
        error: `Position conflicts with existing markers: ${conflictInfo}`
      }, { status: 409 });
    }
    
    // All validations passed, create the markers in bulk
    const createdMarkers = await prisma.$transaction(
      markers.map((marker: BulkMarker) => {
        // At this point, gridId should always be set (either provided directly or resolved from gridName)
        if (!marker.gridId) {
          throw new Error(`Missing gridId for marker: ${JSON.stringify(marker)}`);
        }
        
        return prisma.marker.create({
          data: {
            markerNumber: marker.markerNumber,
            colorName: marker.colorName,
            colorHex: marker.colorHex || '#000000',
            brandId: marker.brandId || null,
            quantity: 1, // Always 1 since we count by instances
            gridId: marker.gridId,
            columnNumber: marker.columnNumber,
            rowNumber: marker.rowNumber,
          }
        });
      })
    );
    
    return NextResponse.json({ 
      success: true, 
      imported: createdMarkers.length,
      markers: createdMarkers
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error bulk importing markers:', error);
    return NextResponse.json({ error: 'Failed to import markers' }, { status: 500 });
  }
}
