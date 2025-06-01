// Script to reset NextAuth sessions
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetSessions() {
  try {
    console.log('Attempting to reset NextAuth sessions...');
    
    // Check if the sessions table exists
    let hasSessionsTable = false;
    try {
      // We need to use a raw query to check if the table exists
      // This is MySQL specific syntax
      await prisma.$queryRaw`SHOW TABLES LIKE 'Session'`;
      hasSessionsTable = true;
    } catch (e) {
      console.log('Sessions table not found, trying other options...');
    }
    
    if (hasSessionsTable) {
      console.log('Found Session table, deleting all sessions...');
      // Using prisma's executeRaw because we don't have a Session model defined
      await prisma.$executeRaw`DELETE FROM Session`;
      console.log('✅ All sessions deleted. Users will need to log in again.');
    } else {
      console.log('No Session table found in the database.');
      console.log('This is fine if you are using the JWT strategy for sessions.');
      console.log('\nTry these steps instead:');
      console.log('1. Clear your browser cookies for your application domain');
      console.log('2. Restart your Next.js server');
      console.log('3. Log in again with your credentials');
    }
    
    // Update lastLogin to null to force a complete session refresh
    console.log('\nResetting lastLogin for all users...');
    await prisma.user.updateMany({
      data: { lastLogin: null }
    });
    console.log('✅ LastLogin reset for all users.');
    
    console.log('\nVerifying user approval status...');
    const admins = await prisma.user.findMany({
      where: { role: 'admin' }
    });
    
    if (admins.length === 0) {
      console.log('⚠️ No admin users found! Creating an emergency admin account...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Emergency Admin',
          email: 'emergency@example.com',
          password: hashedPassword,
          role: 'admin',
          isApproved: true
        }
      });
      
      console.log('✅ Emergency admin account created:');
      console.log('  Email: emergency@example.com');
      console.log('  Password: Admin123!');
      console.log('  IMPORTANT: Change this password immediately after login!');
    } else {
      console.log(`Found ${admins.length} admin users.`);
      
      // Ensure all admins are approved
      for (const admin of admins) {
        if (!admin.isApproved) {
          console.log(`Approving admin user: ${admin.email}...`);
          await prisma.user.update({
            where: { id: admin.id },
            data: { isApproved: true }
          });
        }
      }
      
      console.log('✅ All admin users are now approved.');
    }
    
  } catch (error) {
    console.error('Error resetting sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSessions();
