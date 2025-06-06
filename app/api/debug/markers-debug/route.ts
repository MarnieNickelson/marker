import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Show debug info for marker data
export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get one marker with all relations
    const marker = await prisma.marker.findFirst({
      where: {
        userId,
      },
      include: {
        grid: true,
        brand: true,
        simpleStorage: true,
      }
    });
    
    if (!marker) {
      return NextResponse.json({ message: 'No markers found for user' });
    }
    
    // Return the debug information
    return NextResponse.json({
      marker,
      hasGridId: marker.gridId !== null,
      gridPresent: marker.grid !== null && marker.grid !== undefined,
      gridInfo: marker.grid ? { id: marker.grid.id, name: marker.grid.name } : null,
      hasSimpleStorageId: marker.simpleStorageId !== null,
      simpleStoragePresent: marker.simpleStorage !== null && marker.simpleStorage !== undefined,
      simpleStorageInfo: marker.simpleStorage ? { id: marker.simpleStorage.id, name: marker.simpleStorage.name } : null,
    });
    
  } catch (error) {
    console.error('Error in debug route:', error);
    return NextResponse.json({ error: 'Debug route failed' }, { status: 500 });
  }
}