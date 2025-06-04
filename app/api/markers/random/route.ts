import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Helper function to get hex to HSL for color family filtering
const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
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
const isColorInFamily = (hex: string, family: string): boolean => {
  const { h, s, l } = hexToHSL(hex);
  
  // Handle grayscale colors first
  if (s < 0.1) {
    if (family === 'black' && l < 0.15) return true;
    if (family === 'white' && l > 0.85) return true;
    if (family === 'gray' && l >= 0.15 && l <= 0.85) return true;
    return false;
  }
  
  // Color families based on hue ranges
  switch (family) {
    case 'red': return (h < 15 || h >= 345);
    case 'orange': return (h >= 15 && h < 45);
    case 'yellow': return (h >= 45 && h < 75);
    case 'green': return (h >= 75 && h < 165);
    case 'cyan': return (h >= 165 && h < 195);
    case 'blue': return (h >= 195 && h < 255);
    case 'purple': return (h >= 255 && h < 285);
    case 'pink': return (h >= 285 && h < 345);
    default: return false;
  }
};

// GET - Get a random marker from the user's inventory
export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse the URL to get query parameters
    const url = new URL(request.url);
    const excludeParam = url.searchParams.get('exclude');
    const colorFamily = url.searchParams.get('colorFamily');
    
    // Create a base query
    const baseWhere: any = { userId: userId };
    
    // Add exclude filter if provided
    if (excludeParam) {
      const excludeIds = excludeParam.split(',').filter(id => id.trim() !== '');
      if (excludeIds.length > 0) {
        baseWhere.id = { notIn: excludeIds };
      }
    }
    
    // If there's a color family filter, we need to handle it differently
    if (colorFamily) {
      // Get all markers for the user with the base conditions
      const allMarkers = await prisma.marker.findMany({
        where: baseWhere,
        include: {
          brand: true,
          grid: true,
          simpleStorage: true
        }
      });
      
      if (allMarkers.length === 0) {
        return NextResponse.json({ error: 'No markers found in your inventory (or all markers have been used)' }, { status: 404 });
      }
      
      // Filter markers by color family
      const familyMarkers = allMarkers.filter(marker => 
        marker.colorHex && isColorInFamily(marker.colorHex, colorFamily)
      );
      
      if (familyMarkers.length === 0) {
        return NextResponse.json({ error: `No ${colorFamily} markers found in your inventory` }, { status: 404 });
      }
      
      // Select a random marker from the filtered list
      const randomIndex = Math.floor(Math.random() * familyMarkers.length);
      const randomMarker = familyMarkers[randomIndex];
      
      return NextResponse.json(randomMarker);
    } else {
      // Count total markers for the user with exclusions (no color family filter)
      const totalCount = await prisma.marker.count({
        where: baseWhere
      });
      
      if (totalCount === 0) {
        return NextResponse.json({ error: 'No markers found in your inventory (or all markers have been used)' }, { status: 404 });
      }
      
      // Generate a random skip value to get a random marker
      const randomSkip = Math.floor(Math.random() * totalCount);
      
      // Find a random marker
      const randomMarker = await prisma.marker.findFirst({
        where: baseWhere,
        skip: randomSkip,
        include: {
          brand: true,
          grid: true,
          simpleStorage: true
        }
      });
      
      if (!randomMarker) {
        return NextResponse.json({ error: 'Failed to get random marker' }, { status: 404 });
      }
      
      return NextResponse.json(randomMarker);
    }
    
  } catch (error) {
    console.error('Error getting random marker:', error);
    return NextResponse.json({ error: 'Failed to get random marker' }, { status: 500 });
  }
}
