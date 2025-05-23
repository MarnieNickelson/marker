import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Retrieve all locations for a marker by markerNumber, colorName, and brandId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const markerNumber = searchParams.get('markerNumber');
    const colorName = searchParams.get('colorName');
    const brandId = searchParams.get('brandId');
    
    if (!markerNumber) {
      return NextResponse.json({ error: 'Marker number is required' }, { status: 400 });
    }
    
    // Build the where clause based on provided parameters
    const whereClause: any = { markerNumber };
    
    if (colorName) {
      whereClause.colorName = colorName;
    }
    
    if (brandId) {
      whereClause.brandId = brandId;
    }
    
    // Find all markers with the given criteria
    const markers = await prisma.marker.findMany({
      where: whereClause,
      include: {
        grid: true,
        brand: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return NextResponse.json(markers);
  } catch (error) {
    console.error('Error fetching marker locations:', error);
    return NextResponse.json({ error: 'Failed to fetch marker locations' }, { status: 500 });
  }
}