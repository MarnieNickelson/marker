export interface Grid {
  id: string;
  name: string;
  columns: number;
  rows: number;
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
  brandId: string | null; // Changed from brand to brandId
  brand?: Brand;
  quantity: number;
  gridId: string;
  grid?: Grid;
  columnNumber: number;
  rowNumber: number;
  createdAt: Date;
  updatedAt: Date;
}
