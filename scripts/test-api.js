// Script to test API endpoints
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            statusText: res.statusMessage,
            data: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('Testing API endpoints...');
    
    // Test grids endpoint
    console.log('\nTesting /api/grids endpoint:');
    try {
      const gridsResponse = await makeRequest('http://localhost:3030/api/grids');
      
      console.log(`Status: ${gridsResponse.status} ${gridsResponse.statusText}`);
      if (gridsResponse.status === 200) {
        console.log(`Found ${gridsResponse.data.length} grids`);
      } else {
        console.error(`Response: ${JSON.stringify(gridsResponse.data)}`);
      }
    } catch (error) {
      console.error(`Error with grids endpoint: ${error.message}`);
    }
    
    // Test brands endpoint
    console.log('\nTesting /api/brands endpoint:');
    try {
      const brandsResponse = await makeRequest('http://localhost:3030/api/brands');
      
      console.log(`Status: ${brandsResponse.status} ${brandsResponse.statusText}`);
      if (brandsResponse.status === 200) {
        console.log(`Found ${brandsResponse.data.length} brands`);
      } else {
        console.error(`Response: ${JSON.stringify(brandsResponse.data)}`);
      }
    } catch (error) {
      console.error(`Error with brands endpoint: ${error.message}`);
    }
    
    console.log('\nAPI endpoint tests completed');
  } catch (error) {
    console.error('Error testing API endpoints:', error);
  }
}

main();
