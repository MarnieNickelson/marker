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
    
    // Count total markers for the user
    const totalCount = await prisma.marker.count({
      where: {
        userId: userId
      }
    });
    
    if (totalCount === 0) {
      return NextResponse.json({ error: 'No markers found in your inventory' }, { status: 404 });
    }
    
    // Generate a random skip value to get a random marker
    const randomSkip = Math.floor(Math.random() * totalCount);
    
    // Find a random marker
    const randomMarker = await prisma.marker.findFirst({
      where: {
        userId: userId
      },
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
