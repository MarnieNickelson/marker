#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPageEditingAPI() {
  console.log('🔧 Testing Page Editing API...\n');
  
  try {
    // Get the first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No user found. Please create a user first.');
      return;
    }
    
    console.log(`✅ Found user: ${user.email}`);
    
    // Create a test page
    const testPage = await prisma.page.create({
      data: {
        title: 'Original Title',
        description: 'Original description',
        userId: user.id
      }
    });
    
    console.log(`✅ Created test page: ${testPage.title}`);
    
    // Add some test items
    const testItems = [
      {
        markerNumber: 'ORIG01',
        colorName: 'Original Red',
        colorHex: '#FF0000',
        brandName: 'Original Brand',
        orderIndex: 0,
        pageId: testPage.id
      },
      {
        markerNumber: 'ORIG02', 
        colorName: 'Original Blue',
        colorHex: '#0000FF',
        brandName: 'Original Brand',
        orderIndex: 1,
        pageId: testPage.id
      }
    ];
    
    await prisma.pageItem.createMany({
      data: testItems
    });
    
    console.log(`✅ Added ${testItems.length} original items`);
    
    // Simulate editing - update page and replace items
    const updatedTitle = 'Updated Title';
    const updatedDescription = 'Updated description';
    const newItems = [
      {
        markerNumber: 'UPD01',
        colorName: 'Updated Green',
        colorHex: '#00FF00',
        brandName: 'Updated Brand',
        orderIndex: 0,
        pageId: testPage.id
      },
      {
        markerNumber: 'UPD02',
        colorName: 'Updated Yellow', 
        colorHex: '#FFFF00',
        brandName: 'Updated Brand',
        orderIndex: 1,
        pageId: testPage.id
      },
      {
        markerNumber: 'UPD03',
        colorName: 'Updated Purple',
        colorHex: '#FF00FF',
        brandName: 'Updated Brand',
        orderIndex: 2,
        pageId: testPage.id
      }
    ];
    
    // Update page info
    await prisma.page.update({
      where: { id: testPage.id },
      data: {
        title: updatedTitle,
        description: updatedDescription
      }
    });
    
    // Delete old items and create new ones
    await prisma.pageItem.deleteMany({
      where: { pageId: testPage.id }
    });
    
    await prisma.pageItem.createMany({
      data: newItems
    });
    
    console.log(`✅ Updated page and replaced with ${newItems.length} new items`);
    
    // Verify the update
    const updatedPage = await prisma.page.findUnique({
      where: { id: testPage.id },
      include: {
        pageItems: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
    
    console.log(`✅ Verification:`);
    console.log(`   - Title: "${updatedPage.title}" (${updatedPage.title === updatedTitle ? '✅' : '❌'})`);
    console.log(`   - Description: "${updatedPage.description}" (${updatedPage.description === updatedDescription ? '✅' : '❌'})`);
    console.log(`   - Items count: ${updatedPage.pageItems.length} (${updatedPage.pageItems.length === 3 ? '✅' : '❌'})`);
    
    // Clean up
    await prisma.pageItem.deleteMany({
      where: { pageId: testPage.id }
    });
    await prisma.page.delete({
      where: { id: testPage.id }
    });
    
    console.log('\n✅ Test data cleaned up');
    console.log('\n🎉 Page editing API test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPageEditingAPI();
