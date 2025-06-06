import { NextResponse } from 'next/server';
import { hexToHSL, isColorInFamily } from '@/app/utils/colorUtils';

// Debug route to check color family detection
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hexColor = searchParams.get('hex');
    
    if (!hexColor) {
      return NextResponse.json({ error: 'Hex color parameter required' }, { status: 400 });
    }
    
    // Clean the hex color
    const cleanHex = hexColor.replace(/^#/, '');
    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      return NextResponse.json({ error: 'Invalid hex color format. Use format: RRGGBB' }, { status: 400 });
    }
    
    // Calculate HSL values
    const hslValues = hexToHSL(`#${cleanHex}`);
    
    // Check which color family it belongs to
    const colorFamilies = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gray'];
    const familyResults = colorFamilies.reduce<Record<string, boolean>>((acc, family) => {
      acc[family] = isColorInFamily(`#${cleanHex}`, family);
      return acc;
    }, {});
    
    // Find the first matching family
    const detectedFamily = colorFamilies.find(family => familyResults[family]) || 'unknown';
    
    return NextResponse.json({
      input: `#${cleanHex}`,
      hsl: hslValues,
      colorFamilies: familyResults,
      detectedFamily
    });
  } catch (error) {
    console.error('Error in color family debug endpoint:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
