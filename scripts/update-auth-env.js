#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Define the path to the .env file
const envPath = path.resolve(__dirname, '../.env');

// Generate a secure random string for NEXTAUTH_SECRET
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Check if .env file exists
if (fs.existsSync(envPath)) {
  console.log('Updating existing .env file...');
  
  // Read the current content
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Make sure DATABASE_URL is correct
  if (envContent.includes('DATABASE_URL=')) {
    // Replace existing DATABASE_URL line if needed
    if (!envContent.includes('mysql://')) {
      envContent = envContent.replace(
        /DATABASE_URL=.*$/m, 
        'DATABASE_URL="mysql://root:@localhost:3306/marker_tracker"'
      );
    }
  } else {
    // Add the DATABASE_URL line
    envContent += '\nDATABASE_URL="mysql://root:@localhost:3306/marker_tracker"';
  }
  
  // Add or update NEXTAUTH_SECRET
  if (envContent.includes('NEXTAUTH_SECRET=')) {
    // Don't replace if it already has a value that's not empty
    if (envContent.match(/NEXTAUTH_SECRET=["']?["']?/)) {
      envContent = envContent.replace(
        /NEXTAUTH_SECRET=["']?["']?/m, 
        `NEXTAUTH_SECRET="${generateSecret()}"`
      );
    }
  } else {
    // Add the NEXTAUTH_SECRET line
    envContent += `\nNEXTAUTH_SECRET="${generateSecret()}"`;
  }
  
  // Add or update NEXTAUTH_URL
  if (envContent.includes('NEXTAUTH_URL=')) {
    // Don't replace if it already has a value
    if (envContent.match(/NEXTAUTH_URL=["']?["']?/)) {
      envContent = envContent.replace(
        /NEXTAUTH_URL=["']?["']?/m, 
        'NEXTAUTH_URL="http://localhost:3030"'
      );
    }
  } else {
    // Add the NEXTAUTH_URL line
    envContent += '\nNEXTAUTH_URL="http://localhost:3030"';
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(envPath, envContent);
} else {
  console.log('Creating new .env file...');
  
  // Create a new .env file with all required variables
  fs.writeFileSync(envPath, 
    `DATABASE_URL="mysql://root:@localhost:3306/marker_tracker"
NEXTAUTH_SECRET="${generateSecret()}"
NEXTAUTH_URL="http://localhost:3030"`
  );
}

console.log('.env file has been updated with all required configuration variables.');
