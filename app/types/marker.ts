export interface Grid {
  id: string;
  name: string;
  columns: number;
  rows: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Marker {
  id: string;
  markerNumber: string;
  colorName: string;
  colorHex: string;
  brand: string;
  quantity: number;
  gridId: string;
  grid?: Grid;
  columnNumber: number;
  rowNumber: number;
  createdAt: Date;
  updatedAt: Date;
}
