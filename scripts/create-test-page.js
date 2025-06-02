#!/usr/bin/env node

/**
 * Create a persistent test page for manual testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestPage() {
  console.log('🎨 Creating test page for manual testing...\n');

  try {
    // Find a test user
    const user = await prisma.user.findFirst({
      where: {
        email: 'marnie.nickelson@gmail.com'
      }
    });

    if (!user) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`✅ Found user: ${user.email}`);

    // Create a test page
    const page = await prisma.page.create({
      data: {
        title: 'Manual Test Page',
        description: 'This page can be used for manual editing tests',
        userId: user.id
      }
    });

    console.log(`✅ Created page: ${page.id}`);

    // Add some test items
    const testItems = [
      {
        markerNumber: 'R000',
        colorName: 'Colorless',
        colorHex: '#ffffff',
        brandName: 'Test Brand',
        gridName: 'Main Grid',
        columnNumber: 1,
        rowNumber: 1,
        orderIndex: 0,
        pageId: page.id,
        markerId: null
      },
      {
        markerNumber: 'R001',
        colorName: 'Red',
        colorHex: '#ff0000',
        brandName: 'Test Brand',
        gridName: 'Main Grid',
        columnNumber: 2,
        rowNumber: 1,
        orderIndex: 1,
        pageId: page.id,
        markerId: null
      },
      {
        markerNumber: 'B001',
        colorName: 'Blue',
        colorHex: '#0000ff',
        brandName: 'Test Brand',
        gridName: 'Main Grid',
        columnNumber: 3,
        rowNumber: 1,
        orderIndex: 2,
        pageId: page.id,
        markerId: null
      }
    ];

    await prisma.pageItem.createMany({
      data: testItems
    });

    console.log(`✅ Added ${testItems.length} test items`);
    console.log(`\n🌐 Test page created! You can edit it at:`);
    console.log(`http://localhost:3030/color/pages/${page.id}/edit`);
    console.log(`\nPage ID: ${page.id}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPage();
