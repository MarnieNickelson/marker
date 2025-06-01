// Script to toggle approval status for a user
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const prisma = new PrismaClient();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function toggleApprovalStatus() {
  try {
    console.log('👥 Toggle User Approval Status\n');
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }
    
    console.log('Current users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}, Approved: ${user.isApproved ? 'Yes' : 'No'}`);
    });
    
    // Ask which user to toggle
    const selection = await prompt('\nEnter the number of the user to toggle approval status (or 0 to exit): ');
    const userIndex = parseInt(selection) - 1;
    
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= users.length) {
      if (parseInt(selection) === 0) {
        console.log('Exiting without changes.');
        return;
      }
      console.log('Invalid selection. Please try again.');
      return;
    }
    
    const selectedUser = users[userIndex];
    const newStatus = !selectedUser.isApproved;
    
    // Confirm the change
    const confirm = await prompt(`Are you sure you want to ${newStatus ? 'APPROVE' : 'UNAPPROVE'} ${selectedUser.name} (${selectedUser.email})? (y/n): `);
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      return;
    }
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: selectedUser.id },
      data: { isApproved: newStatus }
    });
    
    console.log(`\n✅ Successfully ${newStatus ? 'approved' : 'unapproved'} user:`);
    console.log(`Name: ${updatedUser.name}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Role: ${updatedUser.role}`);
    console.log(`Approved: ${updatedUser.isApproved}`);
    
  } catch (error) {
    console.error('❌ Error toggling approval status:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

toggleApprovalStatus();
