#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define the path to the .env file
const envPath = path.resolve(__dirname, '../.env');

// MySQL connection string for local development
const mysqlConnectionString = 'DATABASE_URL="mysql://root:@localhost:3306/marker_tracker"';

// Check if .env file exists
if (fs.existsSync(envPath)) {
  console.log('Updating existing .env file...');
  
  // Read the current content
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace the DATABASE_URL line or add it if it doesn't exist
  if (envContent.includes('DATABASE_URL=')) {
    // Replace existing DATABASE_URL line
    envContent = envContent.replace(/DATABASE_URL=.*$/m, mysqlConnectionString);
  } else {
    // Add the DATABASE_URL line
    envContent += '\n' + mysqlConnectionString;
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(envPath, envContent);
} else {
  console.log('Creating new .env file...');
  
  // Create a new .env file with the MySQL connection string
  fs.writeFileSync(envPath, `${mysqlConnectionString}\nNEXTAUTH_SECRET="your-nextauth-secret-key"\nNEXTAUTH_URL="http://localhost:3000"`);
}

console.log('.env file has been updated with MySQL connection string.');
