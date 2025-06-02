// Test script for Simple Storage API
const bcrypt = require('bcryptjs');

async function testSimpleStorageAPI() {
  const baseUrl = 'http://localhost:3030';
  
  // Test credentials
  const credentials = {
    email: 'user@example.com',
    password: 'Password123!'
  };

  try {
    console.log('1. Testing simple storage API...');

    // First try to login and get session
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: credentials.email,
        password: credentials.password,
        csrfToken: 'test', // This might need to be obtained first
        redirect: 'false'
      })
    });

    console.log('Login response status:', loginResponse.status);
    
    // Try to get session
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      credentials: 'include'
    });
    
    console.log('Session response status:', sessionResponse.status);
    const sessionData = await sessionResponse.json();
    console.log('Session data:', sessionData);

    // Try to access simple storage API
    const storageResponse = await fetch(`${baseUrl}/api/simple-storages`, {
      credentials: 'include'
    });
    
    console.log('Storage API response status:', storageResponse.status);
    if (storageResponse.ok) {
      const storageData = await storageResponse.json();
      console.log('Storage data:', storageData);
    } else {
      console.log('Storage API error');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

if (require.main === module) {
  testSimpleStorageAPI();
}
