// Script to approve admin user or create one if none exists
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function approveAdmin() {
  console.log('🔑 Looking for existing users to approve as admin...');
  
  try {
    // Find any existing user
    const existingUser = await prisma.user.findFirst({
      orderBy: {
        createdAt: 'asc' // Get the oldest user first (likely the first admin)
      }
    });
    
    if (existingUser) {
      // Update the first user to be an approved admin
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'admin',
          isApproved: true
        }
      });
      
      console.log('✅ Successfully approved existing user as admin:');
      console.log(`Name: ${updatedUser.name}`);
      console.log(`Email: ${updatedUser.email}`);
      console.log(`Role: ${updatedUser.role}`);
      console.log(`Approved: ${updatedUser.isApproved}`);
      
    } else {
      // If no user exists, create a new admin user
      console.log('No existing users found. Creating a new admin user...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Administrator',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin',
          isApproved: true
        }
      });
      
      console.log('✅ Successfully created new admin account:');
      console.log(`Name: ${newAdmin.name}`);
      console.log(`Email: ${newAdmin.email}`);
      console.log(`Password: admin123 (CHANGE THIS IMMEDIATELY!)`);
      console.log(`Role: ${newAdmin.role}`);
      console.log(`Approved: ${newAdmin.isApproved}`);
    }
  } catch (error) {
    console.error('❌ Error approving admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

approveAdmin();
