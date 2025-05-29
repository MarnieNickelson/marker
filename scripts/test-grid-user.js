// Script to test the Grid userId foreign key
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Grid userId foreign key functionality...');
    
    // Get a user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('No users found in the database. Creating one...');
      
      // Create a test user if none exists
      const newUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password-hash', // In a real app, this would be hashed
          role: 'user',
        }
      });
      
      console.log(`Created test user with ID: ${newUser.id}`);
    }
    
    // Get user again (either existing or newly created)
    const testUser = await prisma.user.findFirst();
    console.log(`Using user with ID: ${testUser.id}`);
    
    // Create a test grid with this user
    const grid = await prisma.grid.create({
      data: {
        name: `Test User Grid ${Date.now()}`,
        columns: 15,
        rows: 12,
        userId: testUser.id
      }
    });
    
    console.log(`Created grid with ID: ${grid.id} linked to user: ${grid.userId}`);
    
    // Verify we can fetch grids with user relation
    const userWithGrids = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: { grids: true }
    });
    
    console.log(`User ${testUser.name} has ${userWithGrids.grids.length} grids`);
    console.log('Grid userId foreign key test completed successfully!');
  } catch (error) {
    console.error('Error testing grid userId foreign key:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
