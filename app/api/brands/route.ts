import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    // Query parameters
    const { searchParams } = new URL(request.url);
    const allUsers = searchParams.get('allUsers') === 'true';
    
    // If admin is requesting all brands
    if (allUsers && isAdmin) {
      const brands = await prisma.brand.findMany({
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
          name: 'asc',
        },
      });
      return NextResponse.json(brands);
    }
    
    // Regular users or admins when not requesting all
    const brands = await prisma.brand.findMany({
      where: {
        OR: [
          { userId: userId },  // User's own brands
          { userId: null }     // Global brands (no owner)
        ]
      },
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
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { name } = await request.json();
    
    // Validate input
    if (!name) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }
    
    // Check for duplicate brand name for this user
    const existingBrand = await prisma.brand.findFirst({
      where: { 
        name,
        userId: userId
      },
    });
    
    if (existingBrand) {
      return NextResponse.json({ error: 'You already have a brand with this name' }, { status: 400 });
    }
    
    const brand = await prisma.brand.create({
      data: { 
        name,
        userId: userId // Associate with current user
      },
    });
    
    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
