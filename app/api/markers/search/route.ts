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
    const gridId = searchParams.get('gridId');
    
    // Build the search criteria
    let criteria: any[] = [];
    
    if (isHexCode) {
      // For hex code search, normalize the hex code (remove # if present and convert to lowercase)
      const normalizedHex = query.replace('#', '').toLowerCase();
      
      // The database might store it with or without the # prefix, so search for both
      criteria = [
        { colorHex: { equals: normalizedHex, mode: 'insensitive' } },
        { colorHex: { equals: `#${normalizedHex}`, mode: 'insensitive' } }
      ];
    } else {
      // Regular search criteria
      criteria = [
        { markerNumber: { contains: query, mode: 'insensitive' } },
        { colorName: { contains: query, mode: 'insensitive' } },
        { brand: { name: { contains: query, mode: 'insensitive' } } }
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
        brand: true
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
