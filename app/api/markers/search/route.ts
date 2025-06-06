import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Search for markers by markerNumber, colorName, hex code, or brand
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }
    
    // Check if query is a hex color code
    const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const isHexCode = hexRegex.test(query);
    
    const includeGrid = searchParams.get('includeGrid') === 'true';
    const includeSimpleStorage = searchParams.get('includeSimpleStorage') === 'true';
    const gridId = searchParams.get('gridId');
    
    // Build the search criteria
    let criteria: any[] = [];
    
    if (isHexCode) {
      // For hex code search, normalize the hex code (remove # if present and convert to lowercase)
      const normalizedHex = query.replace('#', '').toLowerCase();
      const hexWithHash = `#${normalizedHex}`;
      
      // MySQL is case-insensitive by default, so we don't need mode: 'insensitive'
      criteria = [
        { colorHex: { equals: normalizedHex } },
        { colorHex: { equals: hexWithHash } }
      ];
    } else {
      // Regular search criteria - MySQL is case-insensitive by default for LIKE operations
      const lowerQuery = query.toLowerCase();
      criteria = [
        { markerNumber: { contains: lowerQuery } },
        { colorName: { contains: lowerQuery } },
        { brand: { name: { contains: lowerQuery } } }
      ];
    }
    
    const whereClause: any = {
      AND: [
        { OR: criteria }
      ]
    };
    
    // Add grid filter if specified
    if (gridId) {
      whereClause.AND.push({ gridId });
    }
    
    const markers = await prisma.marker.findMany({
      where: whereClause,
      include: {
        grid: includeGrid,
        brand: true,
        simpleStorage: includeSimpleStorage
      },
      orderBy: {
        markerNumber: 'asc'
      }
    });
    
    return NextResponse.json(markers);
  } catch (error) {
    console.error('Error searching markers:', error);
    return NextResponse.json({ error: 'Failed to search markers' }, { status: 500 });
  }
}
