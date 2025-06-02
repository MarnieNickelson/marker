#!/usr/bin/env node

/**
 * Test script to verify frontend routes are accessible
 */

const http = require('http');

function testRoute(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3030,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'test-script'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`${path}: ${res.statusCode} ${res.statusMessage}`);
      resolve({ path, status: res.statusCode });
    });

    req.on('error', (e) => {
      console.log(`${path}: ERROR - ${e.message}`);
      resolve({ path, status: 'error', error: e.message });
    });

    req.end();
  });
}

async function testRoutes() {
  console.log('🌐 Testing frontend routes...\n');
  
  const routes = [
    '/color',
    '/color/pages'
  ];

  const results = [];
  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);
  }

  console.log('\n📊 Summary:');
  results.forEach(result => {
    const status = result.status === 200 ? '✅' : result.status >= 300 && result.status < 400 ? '↗️' : '❌';
    console.log(`${status} ${result.path}: ${result.status}`);
  });
}

testRoutes().catch(console.error);
