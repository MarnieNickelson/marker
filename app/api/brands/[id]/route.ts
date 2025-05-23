import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Props = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  props: Props
) {
  try {
    const params = await props.params;
    const id = params.id;
    const brand = await prisma.brand.findUnique({
      where: { id },
    });
    
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    
    return NextResponse.json(brand);
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: Props
) {
  try {
    const params = await props.params;
    const id = params.id;
    const { name } = await request.json();
    
    // Validate input
    if (!name) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }
    
    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
    });
    
    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    
    // Check for duplicate brand name
    const duplicateBrand = await prisma.brand.findFirst({
      where: { 
        name,
        id: { not: id }
      },
    });
    
    if (duplicateBrand) {
      return NextResponse.json({ error: 'Brand with this name already exists' }, { status: 400 });
    }
    
    // Update brand
    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: { name },
    });
    
    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: Props
) {
  try {
    const params = await props.params;
    const id = params.id;
    
    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
    });
    
    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    
    // Check if brand is in use
    const markersUsingBrand = await prisma.marker.count({
      where: { brandId: id },
    });
    
    if (markersUsingBrand > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete brand that is in use by markers',
          markersCount: markersUsingBrand 
        }, 
        { status: 400 }
      );
    }
    
    // Delete brand
    await prisma.brand.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
