#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPageCreation() {
  console.log('🧪 Testing Page API directly...\n');
  
  try {
    // Get the first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No user found. Please create a user first.');
      return;
    }
    
    console.log(`✅ Found user: ${user.email}`);
    
    // Test creating a page directly with Prisma
    const testData = {
      title: 'Direct API Test Page',
      description: 'Testing page creation directly',
      userId: user.id
    };
    
    console.log('Creating page with data:', testData);
    
    const page = await prisma.page.create({
      data: testData
    });
    
    console.log(`✅ Page created successfully with ID: ${page.id}`);
    
    // Create some test items
    const testItems = [
      {
        markerNumber: 'TEST01',
        colorName: 'Test Red',
        colorHex: '#FF0000',
        brandName: 'Test Brand',
        gridName: 'Test Grid',
        columnNumber: 1,
        rowNumber: 1,
        orderIndex: 0,
        pageId: page.id,
        markerId: null
      },
      {
        markerNumber: 'TEST02',
        colorName: 'Test Blue',
        colorHex: '#0000FF',
        brandName: 'Test Brand',
        gridName: 'Test Grid',
        columnNumber: 2,
        rowNumber: 1,
        orderIndex: 1,
        pageId: page.id,
        markerId: null
      }
    ];
    
    await prisma.pageItem.createMany({
      data: testItems
    });
    
    console.log(`✅ Created ${testItems.length} page items`);
    
    // Retrieve the page with items
    const pageWithItems = await prisma.page.findUnique({
      where: { id: page.id },
      include: {
        pageItems: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
    
    console.log(`✅ Retrieved page with ${pageWithItems.pageItems.length} items`);
    
    // Clean up
    await prisma.pageItem.deleteMany({
      where: { pageId: page.id }
    });
    await prisma.page.delete({
      where: { id: page.id }
    });
    
    console.log('✅ Test data cleaned up');
    console.log('\n🎉 Direct Prisma API test passed! The database models are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPageCreation();
