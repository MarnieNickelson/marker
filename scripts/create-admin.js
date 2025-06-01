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
          role: 'admin',
          isApproved: true // Ensure the admin is approved
        }
      });
      
      console.log(`Admin user created with ID: ${adminUser.id}`);
      console.log('Credentials:');
      console.log('  Email: admin@example.com');
      console.log('  Password: Admin123!');
      console.log('IMPORTANT: Change this password after first login!');
    } else {
      console.log('Users already exist in the database');
      
      // List existing users (without passwords)
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isApproved: true
        }
      });
      
      console.log('Existing users:');
      console.table(users);
      
      // Option to approve all existing users as a backup
      const unapprovedUsers = users.filter(user => !user.isApproved);
      if (unapprovedUsers.length > 0) {
        console.log(`Found ${unapprovedUsers.length} unapproved users. Approving them...`);
        
        for (const user of unapprovedUsers) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isApproved: true }
          });
          console.log(`Approved user: ${user.email}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
