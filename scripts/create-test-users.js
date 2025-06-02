// Script to create test users with different roles
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating test users...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    // Create a regular user
    const regularUser = await prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
        isApproved: true
      }
    });
    console.log(`Regular user created with ID: ${regularUser.id}`);
    
    // Create a manager user
    const managerUser = await prisma.user.create({
      data: {
        name: 'Manager User',
        email: 'manager@example.com',
        password: hashedPassword,
        role: 'manager',
        isApproved: true
      }
    });
    console.log(`Manager user created with ID: ${managerUser.id}`);
    
    // Create an unapproved user
    const pendingUser = await prisma.user.create({
      data: {
        name: 'Pending User',
        email: 'pending@example.com',
        password: hashedPassword,
        role: 'user',
        isApproved: false
      }
    });
    console.log(`Pending user created with ID: ${pendingUser.id}`);

    console.log('\nTest users created successfully!');
    console.log('Credentials for all test users:');
    console.log('  Password: Password123!');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
