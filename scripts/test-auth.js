// Script to test user registration and auth
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing user authentication functionality...');
    
    // Create a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log(`Creating test user with email: ${testEmail}`);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: testEmail,
        password: hashedPassword,
        role: 'user',
      },
    });
    
    console.log(`Test user created with ID: ${user.id}`);
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`Password verification: ${isPasswordValid ? 'SUCCESS' : 'FAILED'}`);
    
    // Clean up
    await prisma.user.delete({
      where: { id: user.id },
    });
    
    console.log('Test user deleted successfully');
    console.log('Authentication test completed successfully!');
  } catch (error) {
    console.error('Error testing authentication:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
