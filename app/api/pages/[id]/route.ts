import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Get a specific page with its items
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const resolvedParams = await params;
    const pageId = resolvedParams.id;
    
    // Get the page and verify ownership
    const page = await prisma.page.findUnique({
      where: {
        id: pageId
      },
      include: {
        pageItems: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });
    
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    
    if (page.userId !== userId) {
      return NextResponse.json({ error: 'You do not have access to this page' }, { status: 403 });
    }
    
    return NextResponse.json(page);
    
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}

// PUT - Update a page
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const resolvedParams = await params;
    const pageId = resolvedParams.id;
    const { title, description, items } = await request.json();
    
    console.log('🔧 PUT /api/pages/[id] - Received data:');
    console.log('- title:', title);
    console.log('- description:', description);
    console.log('- items count:', items?.length);
    console.log('- first item:', items?.[0]);
    
    if (!title || !items || !Array.isArray(items)) {
      return NextResponse.json({ 
        error: 'Invalid request. Title and items array are required.' 
      }, { status: 400 });
    }
    
    // Check if the page exists and belongs to the user
    const pageExists = await prisma.page.findUnique({
      where: {
        id: pageId
      }
    });
    
    if (!pageExists) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    
    if (pageExists.userId !== userId) {
      return NextResponse.json({ error: 'You do not have permission to update this page' }, { status: 403 });
    }
    
    // Update the page and its items in a transaction
    const updatedPage = await prisma.$transaction(async (prisma) => {
      // Update the page
      const page = await prisma.page.update({
        where: {
          id: pageId
        },
        data: {
          title,
          description,
          updatedAt: new Date()
        }
      });
      
      // Delete existing items
      await prisma.pageItem.deleteMany({
        where: {
          pageId: pageId
        }
      });
      
      // Create new items
      const pageItemsData = await Promise.all(items.map(async (item: any, index: number) => {
        // Verify markerId exists if provided
        let validMarkerId = null;
        if (item.markerId) {
          const markerExists = await prisma.marker.findUnique({
            where: { id: item.markerId },
            select: { id: true }
          });
          if (markerExists) {
            validMarkerId = item.markerId;
          }
        }
        
        return {
          markerNumber: item.markerNumber,
          colorName: item.colorName,
          colorHex: item.colorHex,
          brandName: item.brandName || null,
          gridName: item.gridName || null,
          columnNumber: item.columnNumber || null,
          rowNumber: item.rowNumber || null,
          orderIndex: index,
          pageId: pageId,
          markerId: validMarkerId
        };
      }));
      
      await prisma.pageItem.createMany({
        data: pageItemsData
      });
      
      return page;
    });
    
    return NextResponse.json(updatedPage);
    
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

// DELETE - Delete a page
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const resolvedParams = await params;
    const pageId = resolvedParams.id;
    
    // Check if the page exists and belongs to the user
    const pageExists = await prisma.page.findUnique({
      where: {
        id: pageId
      }
    });
    
    if (!pageExists) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    
    if (pageExists.userId !== userId) {
      return NextResponse.json({ error: 'You do not have permission to delete this page' }, { status: 403 });
    }
    
    // Delete the page (and its items via cascade)
    await prisma.page.delete({
      where: {
        id: pageId
      }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}
