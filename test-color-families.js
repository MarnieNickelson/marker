// Helper function for testing color family detection
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

// Updated isColorInFamily function
const isColorInFamily = (hex, family) => {
  const { h, s, l } = hexToHSL(hex);
  
  // Handle grayscale colors first
  if (s < 0.1) {
    if (family === 'black' && l < 0.15) return true;
    if (family === 'white' && l > 0.85) return true;
    if (family === 'gray' && l >= 0.15 && l <= 0.85) return true;
    return false;
  }
  
  // Check for brown as special case (so it takes precedence over orange/yellow ranges)
  // Broader definition of brown to catch more earth tones
  if (family === 'brown' && 
      ((h >= 15 && h < 50 && s > 0.1 && s < 0.7 && l < 0.5) || // Standard browns
       (h >= 20 && h < 40 && s > 0.3 && s < 0.8 && l < 0.4))   // Darker oranges that look brown
     ) return true;
  
  // Color families based on hue ranges - match the client-side getColorFamily function
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

// Test colors
const testColors = [
  { name: 'Saddle Brown', hex: '#8B4513' }, // Brown
  { name: 'Dark Brown', hex: '#654321' },   // Brown
  { name: 'Black', hex: '#000000' },        // Black
  { name: 'Dark Gray', hex: '#222222' },    // Very dark gray, might detect as black
  { name: 'Light Brown', hex: '#CD853F' },  // Sandy Brown
  { name: 'Sienna', hex: '#A0522D' }        // Brown
];

// Run tests
console.log('Testing color family detection:');
console.log('-------------------------------');

for (const color of testColors) {
  const hsl = hexToHSL(color.hex);
  console.log(`${color.name} (${color.hex})`);
  console.log(`HSL: h=${hsl.h.toFixed(1)}, s=${hsl.s.toFixed(2)}, l=${hsl.l.toFixed(2)}`);
  
  const colorFamilies = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gray'];
  const matches = colorFamilies.filter(family => isColorInFamily(color.hex, family));
  
  console.log(`Detected families: ${matches.join(', ') || 'none'}`);
  console.log('-------------------------------');
}
