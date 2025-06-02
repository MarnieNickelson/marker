#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestMarkers() {
  console.log('🖊️ Creating test markers...\n');
  
  try {
    // Get the first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No user found. Please create a user first.');
      return;
    }
    
    // Create a test brand
    const brand = await prisma.brand.create({
      data: {
        name: 'Test Markers',
        userId: user.id
      }
    });
    
    // Create a test grid
    const grid = await prisma.grid.create({
      data: {
        name: 'Test Grid',
        columns: 10,
        rows: 10,
        userId: user.id
      }
    });
    
    // Create some test markers with various colors
    const testMarkers = [
      { number: 'R01', name: 'Cherry Red', hex: '#DC143C', col: 1, row: 1 },
      { number: 'B01', name: 'Ocean Blue', hex: '#006994', col: 2, row: 1 },
      { number: 'G01', name: 'Forest Green', hex: '#228B22', col: 3, row: 1 },
      { number: 'Y01', name: 'Sunshine Yellow', hex: '#FFD700', col: 4, row: 1 },
      { number: 'P01', name: 'Royal Purple', hex: '#6A0DAD', col: 5, row: 1 },
      { number: 'O01', name: 'Tangerine Orange', hex: '#FF8C00', col: 6, row: 1 },
      { number: 'BR01', name: 'Chocolate Brown', hex: '#8B4513', col: 7, row: 1 },
      { number: 'PK01', name: 'Rose Pink', hex: '#FF69B4', col: 8, row: 1 },
      { number: 'BL01', name: 'Midnight Black', hex: '#000000', col: 9, row: 1 },
      { number: 'W01', name: 'Pure White', hex: '#FFFFFF', col: 10, row: 1 }
    ];
    
    for (const marker of testMarkers) {
      await prisma.marker.create({
        data: {
          markerNumber: marker.number,
          colorName: marker.name,
          colorHex: marker.hex,
          columnNumber: marker.col,
          rowNumber: marker.row,
          userId: user.id,
          brandId: brand.id,
          gridId: grid.id
        }
      });
    }
    
    console.log(`✅ Created ${testMarkers.length} test markers`);
    console.log(`✅ Created test brand: ${brand.name}`);
    console.log(`✅ Created test grid: ${grid.name}`);
    console.log('\\n🎨 Test markers are ready for the Color feature!');
    
  } catch (error) {
    console.error('❌ Failed to create test markers:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestMarkers();
