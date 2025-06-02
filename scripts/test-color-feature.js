#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testColorFeature() {
  console.log('🎨 Testing Color Feature...\n');
  
  try {
    // Test 1: Check if Page and PageItem tables exist
    console.log('1. Checking database schema...');
    const pages = await prisma.page.findMany({ take: 1 });
    const pageItems = await prisma.pageItem.findMany({ take: 1 });
    console.log('✅ Page and PageItem tables exist and are accessible\n');
    
    // Test 2: Check if we have at least one user
    console.log('2. Checking for test users...');
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      console.log('❌ No users found. Please create a test user first.\n');
      return;
    }
    console.log(`✅ Found ${users.length} user(s)\n`);
    
    // Test 3: Check if we have markers for random selection
    console.log('3. Checking for markers...');
    const markers = await prisma.marker.findMany({ 
      take: 5,
      include: {
        brand: true,
        grid: true
      }
    });
    if (markers.length === 0) {
      console.log('❌ No markers found. Please add some markers to test the random color feature.\n');
      return;
    }
    console.log(`✅ Found ${markers.length} marker(s) for testing\n`);
    
    // Test 4: Simulate creating a color page
    console.log('4. Testing page creation...');
    const testUser = users[0];
    
    // Create a test page
    const testPage = await prisma.page.create({
      data: {
        title: 'Test Color Page',
        description: 'A test page created by the color feature test script',
        userId: testUser.id
      }
    });
    
    // Add some page items using the available markers
    const testItems = markers.slice(0, 3).map((marker, index) => ({
      markerNumber: marker.markerNumber,
      colorName: marker.colorName,
      colorHex: marker.colorHex,
      brandName: marker.brand?.name || null,
      gridName: marker.grid?.name || null,
      columnNumber: marker.columnNumber,
      rowNumber: marker.rowNumber,
      orderIndex: index,
      pageId: testPage.id,
      markerId: marker.id
    }));
    
    await prisma.pageItem.createMany({
      data: testItems
    });
    
    console.log(`✅ Created test page "${testPage.title}" with ${testItems.length} color items\n`);
    
    // Test 5: Verify the page can be retrieved with its items
    console.log('5. Testing page retrieval...');
    const retrievedPage = await prisma.page.findUnique({
      where: { id: testPage.id },
      include: {
        pageItems: {
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { pageItems: true }
        }
      }
    });
    
    if (retrievedPage && retrievedPage.pageItems.length === testItems.length) {
      console.log(`✅ Successfully retrieved page with ${retrievedPage.pageItems.length} items\n`);
    } else {
      console.log('❌ Failed to retrieve page with correct items\n');
      return;
    }
    
    // Test 6: Clean up the test data
    console.log('6. Cleaning up test data...');
    await prisma.pageItem.deleteMany({
      where: { pageId: testPage.id }
    });
    await prisma.page.delete({
      where: { id: testPage.id }
    });
    console.log('✅ Test data cleaned up\n');
    
    console.log('🎉 All Color feature tests passed!\n');
    console.log('The Color feature is ready to use:');
    console.log('• Visit http://localhost:3030/color for Color Collect');
    console.log('• Visit http://localhost:3030/color/pages for Color Pages');
    console.log('• Use the navigation dropdown to switch between tools');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testColorFeature();
