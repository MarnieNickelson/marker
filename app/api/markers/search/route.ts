import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Search for markers by markerNumber, colorName, or brand
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }
    
    const includeGrid = searchParams.get('includeGrid') === 'true';
    const gridId = searchParams.get('gridId');
    
    // Build the search criteria
    const criteria: any[] = [
      { markerNumber: { contains: query, mode: 'insensitive' } },
      { colorName: { contains: query, mode: 'insensitive' } },
      { brand: { contains: query, mode: 'insensitive' } }
    ];
    
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
        grid: includeGrid
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
