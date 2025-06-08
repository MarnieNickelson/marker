export interface Grid {
  id: string;
  name: string;
  columns: number;
  rows: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimpleStorage {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Marker {
  id: string;
  markerNumber: string;
  colorName: string;
  colorHex: string;
  colorFamily: string | null; // Optional manual override for color family
  brandId: string | null;
  brand?: Brand;
  quantity: number;
  // Grid storage (optional)
  gridId: string | null;
  grid?: Grid;
  columnNumber: number | null;
  rowNumber: number | null;
  // Simple storage (optional)
  simpleStorageId: string | null;
  simpleStorage?: SimpleStorage;
  createdAt: Date;
  updatedAt: Date;
}
