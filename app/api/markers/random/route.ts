import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Get a random marker from the user's inventory
export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse the URL to get query parameters
    const url = new URL(request.url);
    const excludeParam = url.searchParams.get('exclude');
    
    // Create a base query
    const baseWhere: any = { userId: userId };
    
    // Add exclude filter if provided
    if (excludeParam) {
      const excludeIds = excludeParam.split(',').filter(id => id.trim() !== '');
      if (excludeIds.length > 0) {
        baseWhere.id = { notIn: excludeIds };
      }
    }
    
    // Count total markers for the user with exclusions
    const totalCount = await prisma.marker.count({
      where: baseWhere
    });
    
    if (totalCount === 0) {
      return NextResponse.json({ error: 'No markers found in your inventory (or all markers have been used)' }, { status: 404 });
    }
    
    // Generate a random skip value to get a random marker
    const randomSkip = Math.floor(Math.random() * totalCount);
    
    // Find a random marker
    const randomMarker = await prisma.marker.findFirst({
      where: baseWhere,
      skip: randomSkip,
      include: {
        brand: true,
        grid: true
      }
    });
    
    if (!randomMarker) {
      return NextResponse.json({ error: 'Failed to get random marker' }, { status: 404 });
    }
    
    return NextResponse.json(randomMarker);
    
  } catch (error) {
    console.error('Error getting random marker:', error);
    return NextResponse.json({ error: 'Failed to get random marker' }, { status: 500 });
  }
}
