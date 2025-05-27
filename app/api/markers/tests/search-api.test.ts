// app/api/markers/tests/search-api.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../search/route';
import prisma from '@/lib/prisma';

// Mock the Prisma client
vi.mock('@/lib/prisma', () => ({
  default: {
    marker: {
      findMany: vi.fn(),
    },
  },
}));

describe('Marker Search API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return 400 if no query is provided', async () => {
    const request = new Request('http://localhost:3000/api/markers/search');
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty('error', 'Search query is required');
  });

  it('should search by regular terms (marker number, color name, brand)', async () => {
    const request = new Request('http://localhost:3000/api/markers/search?q=blue');
    
    const mockMarkers = [
      { id: '1', markerNumber: 'B01', colorName: 'Blue', colorHex: '0000FF' },
      { id: '2', markerNumber: 'B02', colorName: 'Navy Blue', colorHex: '000080' },
    ];
    
    (prisma.marker.findMany as any).mockResolvedValue(mockMarkers);
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].colorName).toBe('Blue');
    
    // Check that the query used the standard search criteria
    expect(prisma.marker.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        AND: expect.arrayContaining([
          {
            OR: expect.arrayContaining([
              { markerNumber: { contains: 'blue', mode: 'insensitive' } },
              { colorName: { contains: 'blue', mode: 'insensitive' } },
              expect.anything(), // For the brand check
            ]),
          },
        ]),
      }),
    }));
  });

  it('should search by hex color code with # prefix', async () => {
    const request = new Request('http://localhost:3000/api/markers/search?q=%23FF5500');
    
    const mockMarkers = [
      { id: '3', markerNumber: 'O01', colorName: 'Orange', colorHex: 'FF5500' },
    ];
    
    (prisma.marker.findMany as any).mockResolvedValue(mockMarkers);
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].colorName).toBe('Orange');
    
    // Check that the query used the exact hex color search criteria
    expect(prisma.marker.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        AND: expect.arrayContaining([
          {
            OR: expect.arrayContaining([
              { colorHex: { equals: 'ff5500', mode: 'insensitive' } },
              { colorHex: { equals: '#ff5500', mode: 'insensitive' } },
            ]),
          },
        ]),
      }),
    }));
  });

  it('should search by hex color code without # prefix', async () => {
    const request = new Request('http://localhost:3000/api/markers/search?q=FF5500');
    
    const mockMarkers = [
      { id: '3', markerNumber: 'O01', colorName: 'Orange', colorHex: 'FF5500' },
    ];
    
    (prisma.marker.findMany as any).mockResolvedValue(mockMarkers);
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].colorName).toBe('Orange');
    
    // Check that the query used the exact hex color search criteria with both variations
    expect(prisma.marker.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        AND: expect.arrayContaining([
          {
            OR: expect.arrayContaining([
              { colorHex: { equals: 'ff5500', mode: 'insensitive' } },
              { colorHex: { equals: '#ff5500', mode: 'insensitive' } },
            ]),
          },
        ]),
      }),
    }));
  });

  it('should handle 3-digit hex color codes correctly', async () => {
    const request = new Request('http://localhost:3000/api/markers/search?q=%23F00');
    
    const mockMarkers = [
      { id: '4', markerNumber: 'R01', colorName: 'Red', colorHex: '#F00' },
    ];
    
    (prisma.marker.findMany as any).mockResolvedValue(mockMarkers);
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].colorName).toBe('Red');
    
    // Check that the query handled 3-digit hex code correctly
    expect(prisma.marker.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        AND: expect.arrayContaining([
          {
            OR: expect.arrayContaining([
              { colorHex: { equals: 'f00', mode: 'insensitive' } },
              { colorHex: { equals: '#f00', mode: 'insensitive' } },
            ]),
          },
        ]),
      }),
    }));
  });

  it('should return an empty array when no matches are found', async () => {
    const request = new Request('http://localhost:3000/api/markers/search?q=%23123456');
    
    (prisma.marker.findMany as any).mockResolvedValue([]);
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(0);
  });
});
