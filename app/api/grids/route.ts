import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Retrieve all grids for the current user
export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Query parameters
    const { searchParams } = new URL(request.url);
    const allUsers = searchParams.get('allUsers') === 'true';
    
    // Check if admin is requesting all grids
    if (allUsers && session.user.role === 'admin') {
      const grids = await prisma.grid.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
      return NextResponse.json(grids);
    }
    
    // Regular users or admins when not requesting all
    const grids = await prisma.grid.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(grids);
  } catch (error) {
    console.error('Error fetching grids:', error);
    return NextResponse.json({ error: 'Failed to fetch grids' }, { status: 500 });
  }
}

// POST - Create a new grid
export async function POST(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    
    // Validate the input
    const { name, columns, rows } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Grid name is required' }, { status: 400 });
    }
    
    // Create with defaults if columns/rows not provided
    const newGrid = await prisma.grid.create({
      data: {
        name,
        columns: columns ? parseInt(columns.toString()) : 15,
        rows: rows ? parseInt(rows.toString()) : 12,
        userId: userId // Associate with current user
      },
    });
    
    return NextResponse.json(newGrid, { status: 201 });
  } catch (error) {
    console.error('Error creating grid:', error);
    return NextResponse.json({ error: 'Failed to create grid' }, { status: 500 });
  }
}
