// Login troubleshooting script
const http = require('http');
const https = require('https');
const { URL } = require('url');

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = (parsedUrl.protocol === 'https:' ? https : http).request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const response = {
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: null
        };
        
        try {
          if (responseData) {
            response.data = JSON.parse(responseData);
          }
        } catch (e) {
          response.rawData = responseData;
        }
        
        resolve(response);
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function main() {
  try {
    // Use the known admin credentials we found earlier
    const loginData = {
      email: 'marnie.nickelson@gmail.com',
      password: 'your-password-here' // This is a placeholder - you'd need to replace with actual password
    };
    
    console.log('Attempting to login via API...');
    console.log(`Email: ${loginData.email}`);
    
    const loginResponse = await makeRequest('http://localhost:3030/api/auth/callback/credentials', 'POST', loginData);
    
    console.log(`Login response status: ${loginResponse.status} ${loginResponse.statusText}`);
    console.log('Headers:', loginResponse.headers);
    
    if (loginResponse.data) {
      console.log('Response data:', loginResponse.data);
    } else if (loginResponse.rawData) {
      console.log('Raw response:', loginResponse.rawData.slice(0, 100) + (loginResponse.rawData.length > 100 ? '...' : ''));
    }
  } catch (error) {
    console.error('Error during login test:', error);
  }
}

main();
