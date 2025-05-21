import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Retrieve all grids
export async function GET(request: Request) {
  try {
    const grids = await prisma.grid.findMany({
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
      },
    });
    
    return NextResponse.json(newGrid, { status: 201 });
  } catch (error) {
    console.error('Error creating grid:', error);
    return NextResponse.json({ error: 'Failed to create grid' }, { status: 500 });
  }
}
