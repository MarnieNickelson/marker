// Script to create an admin user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create an admin user if none exists
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const adminUser = await prisma.user.create({
        data: {
          name: 'Administrator',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin'
        }
      });
      
      console.log(`Admin user created with ID: ${adminUser.id}`);
    } else {
      console.log('Users already exist in the database');
      
      // List existing users (without passwords)
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      
      console.log('Existing users:');
      console.table(users);
    }
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
