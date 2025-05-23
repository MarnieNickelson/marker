import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    // Validate input
    if (!name) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }
    
    // Check for duplicate brand name
    const existingBrand = await prisma.brand.findUnique({
      where: { name },
    });
    
    if (existingBrand) {
      return NextResponse.json({ error: 'Brand with this name already exists' }, { status: 400 });
    }
    
    const brand = await prisma.brand.create({
      data: { name },
    });
    
    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
