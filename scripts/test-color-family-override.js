// Script to test color family detection and overrides
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to convert hex to HSL
const hexToHSL = (hex) => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Find max and min values for RGB
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Calculate lightness
  const lightness = (max + min) / 2;
  
  // Calculate saturation
  let saturation = 0;
  if (max !== min) {
    saturation = lightness > 0.5 
      ? (max - min) / (2 - max - min) 
      : (max - min) / (max + min);
  }
  
  // Calculate hue
  let hue = 0;
  if (max !== min) {
    if (max === r) {
      hue = (g - b) / (max - min) + (g < b ? 6 : 0);
    } else if (max === g) {
      hue = (b - r) / (max - min) + 2;
    } else {
      hue = (r - g) / (max - min) + 4;
    }
    hue *= 60;
  }
  
  return { h: hue, s: saturation, l: lightness };
};

// Helper function to check if a hex color belongs to a color family
const isColorInFamily = (hex, family) => {
  const { h, s, l } = hexToHSL(hex);
  
  // Handle grayscale colors first
  if (s < 0.1) {
    if (family === 'black' && l < 0.15) return true;
    if (family === 'white' && l > 0.85) return true;
    if (family === 'gray' && l >= 0.15 && l <= 0.85) return true;
    return false;
  }
  
  // Check for brown as special case
  if (family === 'brown' && 
      ((h >= 15 && h < 50 && s > 0.1 && s < 0.7 && l < 0.5) || 
       (h >= 20 && h < 40 && s > 0.3 && s < 0.8 && l < 0.4))) {
    return true;
  }
  
  // Color families based on hue ranges
  switch (family) {
    case 'red': return (h < 15 || h >= 345);
    case 'orange': return (h >= 15 && h < 40);
    case 'yellow': return (h >= 40 && h < 65);
    case 'green': return (h >= 65 && h < 165);
    case 'cyan': return (h >= 165 && h < 195);
    case 'blue': return (h >= 195 && h < 255);
    case 'purple': return (h >= 255 && h < 285);
    case 'pink': return (h >= 285 && h < 345);
    default: return false;
  }
};

// Function to get auto-detected color family
const getAutoColorFamily = (hex) => {
  const families = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gray'];
  
  for (const family of families) {
    if (isColorInFamily(hex, family)) {
      return family;
    }
  }
  return 'unknown';
};

// Main test function
async function testColorFamilyOverride() {
  console.log('\n========== Testing Color Family Override Feature ==========\n');
  
  try {
    // 1. Get first 5 markers
    const markers = await prisma.marker.findMany({
      take: 5,
      include: { brand: true }
    });
    
    if (!markers.length) {
      console.log('No markers found in database. Please create some markers first.');
      return;
    }
    
    // 2. For each marker, show current color family detection
    console.log('Current markers:');
    console.log('-----------------');
    
    for (const marker of markers) {
      const autoFamily = getAutoColorFamily(marker.colorHex);
      console.log(`${marker.markerNumber} - ${marker.colorName} (${marker.colorHex})`);
      console.log(`  • Auto-detected family: ${autoFamily}`);
      console.log(`  • Current saved family: ${marker.colorFamily || 'AUTO'}`);
      console.log('-----------------');
    }
    
    // 3. Update the first marker with a manual color family override
    const testMarker = markers[0];
    const autoFamily = getAutoColorFamily(testMarker.colorHex);
    const overrideFamily = autoFamily === 'red' ? 'orange' : 'red'; // Pick something different
    
    console.log(`\nOverriding color family for ${testMarker.markerNumber}:`);
    console.log(`  • From: ${testMarker.colorFamily || autoFamily} (${testMarker.colorFamily ? 'manual' : 'auto'})`);
    console.log(`  • To: ${overrideFamily} (manual)`);
    
    const updatedMarker = await prisma.marker.update({
      where: { id: testMarker.id },
      data: { colorFamily: overrideFamily },
    });
    
    console.log(`\nUpdated marker successfully.`);
    console.log(`  • New color family: ${updatedMarker.colorFamily}`);
    
    // 4. Now remove the override to go back to auto-detection
    console.log(`\nRemoving color family override for ${testMarker.markerNumber}:`);
    
    const restoredMarker = await prisma.marker.update({
      where: { id: testMarker.id },
      data: { colorFamily: null },
    });
    
    console.log(`\nReset marker successfully.`);
    console.log(`  • New color family: ${restoredMarker.colorFamily || 'AUTO'} (${restoredMarker.colorFamily ? 'manual' : 'auto'})`);
    console.log(`  • Auto-detected family: ${autoFamily}`);
    
    console.log('\n========== Test Completed Successfully ==========');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testColorFamilyOverride();
