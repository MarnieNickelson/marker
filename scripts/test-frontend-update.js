#!/usr/bin/env node

/**
 * Test script to verify frontend-to-backend page editing workflow
 */

const fetch = require('node-fetch');

// Test data that mimics what the frontend would send
const testUpdateData = {
  title: "Updated Frontend Test",
  description: "Testing with frontend-like data",
  items: [
    {
      id: "cmbe5test1", // This is pageItem.id, not markerId
      markerNumber: "R000",
      colorName: "Colorless",
      colorHex: "#ffffff",
      brandName: "Test Brand",
      gridName: "Main Grid",
      columnNumber: 1,
      rowNumber: 1,
      orderIndex: 0,
      markerId: null // This is what we should be using
    },
    {
      id: "cmbe5test2",
      markerNumber: "R001", 
      colorName: "Red",
      colorHex: "#ff0000",
      brandName: "Test Brand",
      gridName: "Main Grid", 
      columnNumber: 2,
      rowNumber: 1,
      orderIndex: 1,
      markerId: null
    }
  ]
};

async function testFrontendUpdate() {
  console.log('🎨 Testing Frontend-like Page Update...\n');
  
  try {
    // First, create a test page
    console.log('Creating test page...');
    const createResponse = await fetch('http://localhost:3030/api/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // This won't work but shows the pattern
      },
      body: JSON.stringify({
        title: "Original Frontend Test",
        description: "Testing",
        items: [{
          markerNumber: "R999",
          colorName: "Test Color",
          colorHex: "#000000",
          brandName: "Test",
          gridName: null,
          columnNumber: null,
          rowNumber: null,
          orderIndex: 0,
          markerId: null
        }]
      })
    });
    
    if (!createResponse.ok) {
      console.log(`❌ Create failed: ${createResponse.status} ${createResponse.statusText}`);
      const errorText = await createResponse.text();
      console.log('Error details:', errorText);
      return;
    }
    
    const createdPage = await createResponse.json();
    console.log(`✅ Created page: ${createdPage.id}`);
    
    // Now test the update
    console.log('Updating page with frontend-like data...');
    const updateResponse = await fetch(`http://localhost:3030/api/pages/${createdPage.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test'
      },
      body: JSON.stringify(testUpdateData)
    });
    
    if (!updateResponse.ok) {
      console.log(`❌ Update failed: ${updateResponse.status} ${updateResponse.statusText}`);
      const errorText = await updateResponse.text();
      console.log('Error details:', errorText);
      return;
    }
    
    console.log('✅ Update successful!');
    
    // Clean up
    await fetch(`http://localhost:3030/api/pages/${createdPage.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': 'next-auth.session-token=test'
      }
    });
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testFrontendUpdate();
