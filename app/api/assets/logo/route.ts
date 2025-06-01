import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This endpoint will serve the logo file directly without authentication
export async function GET(request: NextRequest) {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const imagePath = path.join(publicDir, 'inkventory-logo.png');
    
    // Read the file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Return the image with proper content type
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error serving logo:', error);
    return NextResponse.json(
      { error: 'Error serving logo' },
      { status: 500 }
    );
  }
}
