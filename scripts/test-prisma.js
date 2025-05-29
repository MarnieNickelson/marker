// Script to test Prisma User model access
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Prisma User model access...');
    
    // Test if we can access the user model
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    
    // Test if we can create a user (will be rolled back)
    console.log('Testing user creation (will be rolled back)...');
    await prisma.$transaction(async (tx) => {
      const testUser = await tx.user.create({
        data: {
          name: 'Test User',
          email: 'test-' + Date.now() + '@example.com',
          password: 'TestPassword123'
        }
      });
      console.log('Successfully created test user:', testUser.id);
      
      // This will roll back the transaction
      throw new Error('Rolling back transaction');
    }).catch(e => {
      if (e.message === 'Rolling back transaction') {
        console.log('Transaction rolled back as expected');
      } else {
        throw e;
      }
    });
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error testing Prisma:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
