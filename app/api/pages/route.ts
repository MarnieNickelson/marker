import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Get all pages for the current user
export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get all pages for this user
    const pages = await prisma.page.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        _count: {
          select: { pageItems: true }
        },
        pageItems: {
          orderBy: {
            orderIndex: 'asc'
          },
          select: {
            colorHex: true,
            markerNumber: true
          }
        }
      }
    });
    
    return NextResponse.json(pages);
    
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

// POST - Create a new page
export async function POST(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const requestBody = await request.json();
    const { title, description, items } = requestBody;
    
    // Debug: Log what we received
    console.log('Received request to create page:', {
      title,
      description,
      items,
      itemsType: typeof items,
      itemsLength: Array.isArray(items) ? items.length : 'not array',
      fullBody: requestBody
    });
    
    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      console.log('Validation failed:', {
        hasTitle: !!title,
        hasItems: !!items,
        isArray: Array.isArray(items),
        itemsLength: Array.isArray(items) ? items.length : 'not array'
      });
      return NextResponse.json({ 
        error: 'Invalid request. Title and at least one color item are required.' 
      }, { status: 400 });
    }
    
    // Create the page and its items in a transaction
    const page = await prisma.$transaction(async (prisma) => {
      // Create the page
      const newPage = await prisma.page.create({
        data: {
          title,
          description,
          userId
        }
      });
      
      // Create the page items
      const pageItemsData = items.map((item: any, index: number) => ({
        markerNumber: item.markerNumber,
        colorName: item.colorName,
        colorHex: item.colorHex,
        brandName: item.brandName || null,
        gridName: item.gridName || null,
        columnNumber: item.columnNumber || null,
        rowNumber: item.rowNumber || null,
        orderIndex: index,
        isRandom: !!item.isRandom,  // Convert to boolean in case it's undefined
        pageId: newPage.id,
        markerId: item.id || null
      }));
      
      await prisma.pageItem.createMany({
        data: pageItemsData
      });
      
      return newPage;
    });
    
    return NextResponse.json(page, { status: 201 });
    
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}
