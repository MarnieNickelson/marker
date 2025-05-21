// app/api/markers/tests/markers-api.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PUT, DELETE } from '../[id]/route';
import prisma from '@/lib/prisma';

// Mock the Prisma client
vi.mock('@/lib/prisma', () => ({
  default: {
    marker: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    grid: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Marker API PUT endpoint', () => {
  const mockMarker = {
    id: 'mock-id',
    markerNumber: 'B123',
    colorName: 'Blue',
    colorHex: '#0000FF',
    brand: 'Copic',
    quantity: 1,
    gridId: 'grid-id',
    columnNumber: 1,
    rowNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should update a marker successfully', async () => {
    const updateData = {
      markerNumber: 'B123',
      colorName: 'Dark Blue',
      gridId: 'grid-id',
      columnNumber: 2,
      rowNumber: 3,
    };

    // Mock API request
    const request = new Request('http://localhost:3000/api/markers/mock-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const params = { id: 'mock-id' };

    // Mock Prisma responses
    (prisma.marker.findUnique as any).mockResolvedValue(mockMarker);
    (prisma.grid.findUnique as any).mockResolvedValue({
      id: 'grid-id',
      columns: 10,
      rows: 10,
    });
    (prisma.marker.update as any).mockResolvedValue({
      ...mockMarker,
      ...updateData,
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.colorName).toBe('Dark Blue');
    expect(data.columnNumber).toBe(2);
    expect(data.rowNumber).toBe(3);
  });

  it('should return 404 if marker not found', async () => {
    const request = new Request('http://localhost:3000/api/markers/not-exist', {
      method: 'PUT',
      body: JSON.stringify({ colorName: 'Red' }),
    });

    const params = { id: 'not-exist' };

    // Mock Prisma response - marker not found
    (prisma.marker.findUnique as any).mockResolvedValue(null);

    const response = await PUT(request, { params });

    expect(response.status).toBe(404);
  });
  
  it('should return 409 if marker number already exists', async () => {
    const updateData = {
      markerNumber: 'R456', // Trying to change to an existing marker number
    };

    // Mock API request
    const request = new Request('http://localhost:3000/api/markers/mock-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const params = { id: 'mock-id' };

    // Mock Prisma responses
    (prisma.marker.findUnique as any).mockImplementation((query: { where: { id?: string, markerNumber?: string } }) => {
      if (query.where.id === 'mock-id') {
        return Promise.resolve(mockMarker);
      }
      if (query.where.markerNumber === 'R456') {
        return Promise.resolve({ id: 'other-marker', markerNumber: 'R456' });
      }
      return Promise.resolve(null);
    });

    const response = await PUT(request, { params });

    expect(response.status).toBe(409);
    expect(await response.json()).toHaveProperty('error', 'A marker with this number already exists');
  });
  
  it('should return 400 if position is outside grid dimensions', async () => {
    const updateData = {
      gridId: 'grid-id',
      columnNumber: 15,  // Beyond the 10 columns of the grid
      rowNumber: 5,
    };

    // Mock API request
    const request = new Request('http://localhost:3000/api/markers/mock-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const params = { id: 'mock-id' };

    // Mock Prisma responses
    (prisma.marker.findUnique as any).mockResolvedValue(mockMarker);
    (prisma.grid.findUnique as any).mockResolvedValue({
      id: 'grid-id',
      columns: 10,
      rows: 10,
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Position must be within grid dimensions');
  });
  
  it('should return 404 if selected grid does not exist', async () => {
    const updateData = {
      gridId: 'non-existent-grid',
    };

    // Mock API request
    const request = new Request('http://localhost:3000/api/markers/mock-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const params = { id: 'mock-id' };

    // Mock Prisma responses
    (prisma.marker.findUnique as any).mockResolvedValue(mockMarker);
    (prisma.grid.findUnique as any).mockResolvedValue(null);

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Selected grid does not exist');
  });
});

describe('Marker API DELETE endpoint', () => {
  const mockMarker = {
    id: 'mock-id',
    markerNumber: 'B123',
    colorName: 'Blue',
    colorHex: '#0000FF',
    brand: 'Copic',
    quantity: 1,
    gridId: 'grid-id',
    columnNumber: 1,
    rowNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should delete a marker successfully', async () => {
    const request = new Request('http://localhost:3000/api/markers/mock-id', {
      method: 'DELETE',
    });

    const params = { id: 'mock-id' };

    // Mock Prisma responses
    (prisma.marker.findUnique as any).mockResolvedValue(mockMarker);
    (prisma.marker.delete as any).mockResolvedValue(mockMarker);

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Marker deleted successfully');
    expect(prisma.marker.delete).toHaveBeenCalledWith({ where: { id: 'mock-id' } });
  });

  it('should return 404 if marker not found', async () => {
    const request = new Request('http://localhost:3000/api/markers/not-exist', {
      method: 'DELETE',
    });

    const params = { id: 'not-exist' };

    // Mock Prisma response - marker not found
    (prisma.marker.findUnique as any).mockResolvedValue(null);

    const response = await DELETE(request, { params });

    expect(response.status).toBe(404);
    expect(prisma.marker.delete).not.toHaveBeenCalled();
  });
});
