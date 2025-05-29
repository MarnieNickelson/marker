// Test script to create a grid and verify functionality
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Grid functionality...');
    
    // Delete any existing test grids
    await prisma.grid.deleteMany({
      where: {
        name: {
          contains: 'Test Grid'
        }
      }
    });
    
    // Create a test grid
    const testGrid = await prisma.grid.create({
      data: {
        name: `Test Grid ${Date.now()}`,
        columns: 15,
        rows: 12
      }
    });
    
    console.log('Test grid created:', testGrid);
    
    // Fetch all grids to verify
    const allGrids = await prisma.grid.findMany();
    console.log(`Found ${allGrids.length} total grids`);
    
    console.log('Grid functionality test completed successfully!');
  } catch (error) {
    console.error('Error testing grid functionality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
