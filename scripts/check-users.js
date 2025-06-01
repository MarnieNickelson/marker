// Script to check user approval status in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking user approval status in the database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        lastLogin: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    console.table(users);
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
