// Script to create a specific user account
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating user account...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    // Create user with admin role for full access
    const user = await prisma.user.create({
      data: {
        name: 'Marnie Nickelson',
        email: 'marnie.nickelson@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isApproved: true
      }
    });
    console.log(`User created with ID: ${user.id}`);
    console.log('\nUser account created successfully!');
    console.log('You can now log in with:');
    console.log('  Email: marnie.nickelson@gmail.com');
    console.log('  Password: Password123!');
    
  } catch (error) {
    console.error('Error creating user account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
