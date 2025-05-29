#!/usr/bin/env node

/**
 * MySQL Migration Helper Script
 * This script helps migrate your application from PostgreSQL to MySQL
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 MySQL Migration Helper for Inkventory');
console.log('============================================');

const runCommand = (command, message) => {
  console.log(`\n📌 ${message}`);
  try {
    console.log(execSync(command, { encoding: 'utf8' }));
    console.log(`✅ Success: ${message}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${message}`);
    console.error(error.toString());
    return false;
  }
};

const checkEnvFile = () => {
  console.log('\n🔍 Checking .env file...');
  if (!fs.existsSync('.env')) {
    console.log('❗ No .env file found. Creating from example...');
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ Created .env file. Please update it with your MySQL credentials.');
    return false;
  }
  
  const envContent = fs.readFileSync('.env', 'utf8');
  if (!envContent.includes('mysql://')) {
    console.log('❗ Your .env file appears to contain a PostgreSQL connection string.');
    console.log('  Please update it with a MySQL connection string.');
    return false;
  }
  
  return true;
};

const migrateToMySQL = async () => {
  // Check if MySQL connector is installed
  if (!runCommand('npm list mysql2', 'Checking for MySQL connector')) {
    if (!await promptYesNo('MySQL connector is not installed. Install it?')) {
      console.log('❌ Migration aborted: MySQL connector is required.');
      process.exit(1);
    }
    runCommand('npm install mysql2', 'Installing MySQL connector');
  }
  
  // Validate environment variables
  if (!checkEnvFile()) {
    console.log('\nPlease update your .env file and run this script again.');
    process.exit(1);
  }
  
  // Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client for MySQL');
  
  if (await promptYesNo('Do you want to create a new MySQL database with Prisma migrations?')) {
    runCommand('npx prisma migrate dev --name mysql_migration', 'Creating database schema with Prisma');
    
    if (await promptYesNo('Do you want to seed the database with initial data?')) {
      runCommand('npm run db:seed', 'Seeding the database');
    }
  }
  
  console.log('\n🎉 Migration to MySQL completed successfully!');
  console.log('You can now deploy your application to Hostinger.');
};

function promptYesNo(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

migrateToMySQL().finally(() => rl.close());
