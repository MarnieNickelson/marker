import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample grid data
const grids = [
  {
    name: 'Left Storage',
    columns: 15,
    rows: 12,
  },
  {
    name: 'Right Storage',
    columns: 15,
    rows: 12,
  },
  {
    name: 'Drawer 1',
    columns: 10,
    rows: 8,
  },
];

// Sample brand data
const brands = [
  { name: 'Copic' },
  { name: 'Prismacolor' },
  { name: 'Tombow' },
  { name: 'Faber-Castell' },
];

// Helper type for our markers with gridIndex
type MarkerWithGridIndex = {
  markerNumber: string;
  colorName: string;
  colorHex: string;
  brandName: string; // Now we store brand name to lookup the ID later
  quantity: number;
  gridIndex: number; // Used to reference the grids array
  columnNumber: number;
  rowNumber: number;
};

// Sample marker data with hex colors, brands, and quantities
const markers: MarkerWithGridIndex[] = [
  {
    markerNumber: 'R123',
    colorName: 'Crimson Red',
    colorHex: '#DC143C',
    brandName: 'Copic',
    quantity: 2,
    gridIndex: 0, // This will be replaced with actual gridId
    columnNumber: 3,
    rowNumber: 5,
  },
  {
    markerNumber: 'B456',
    colorName: 'Deep Blue',
    colorHex: '#00008B',
    brandName: 'Prismacolor',
    quantity: 1,
    gridIndex: 1, 
    columnNumber: 10,
    rowNumber: 7,
  },
  {
    markerNumber: 'G789',
    colorName: 'Forest Green',
    colorHex: '#228B22',
    brandName: 'Copic',
    quantity: 3,
    gridIndex: 0, 
    columnNumber: 8,
    rowNumber: 2,
  },
  {
    markerNumber: 'Y101',
    colorName: 'Sunshine Yellow',
    colorHex: '#FFD700',
    brandName: 'Tombow',
    quantity: 1,
    gridIndex: 1, 
    columnNumber: 4,
    rowNumber: 10,
  },
  {
    markerNumber: 'P202',
    colorName: 'Royal Purple',
    colorHex: '#7851A9',
    brandName: 'Copic',
    quantity: 1,
    gridIndex: 0, 
    columnNumber: 12,
    rowNumber: 3,
  },
  {
    markerNumber: 'O303',
    colorName: 'Bright Orange',
    colorHex: '#FF7F50',
    brandName: 'Prismacolor',
    quantity: 2,
    gridIndex: 1, 
    columnNumber: 6,
    rowNumber: 8,
  },
  {
    markerNumber: 'BR404',
    colorName: 'Chocolate Brown',
    colorHex: '#7B3F00',
    brandName: 'Faber-Castell',
    quantity: 1,
    gridIndex: 0, 
    columnNumber: 15,
    rowNumber: 11,
  },
  {
    markerNumber: 'BL505',
    colorName: 'Midnight Black',
    colorHex: '#191970',
    brandName: 'Copic',
    quantity: 4,
    gridIndex: 1, 
    columnNumber: 9,
    rowNumber: 4,
  },
  {
    markerNumber: 'W606',
    colorName: 'Pure White',
    colorHex: '#FFFFFF',
    brandName: 'Prismacolor',
    quantity: 2,
    gridIndex: 0, 
    columnNumber: 2,
    rowNumber: 6,
  },
  {
    markerNumber: 'PK707',
    colorName: 'Hot Pink',
    colorHex: '#FF69B4',
    brandName: 'Tombow',
    quantity: 1,
    gridIndex: 1, 
    columnNumber: 14,
    rowNumber: 9,
  },
  {
    markerNumber: 'T808',
    colorName: 'Teal',
    colorHex: '#008080',
    brandName: 'Copic',
    quantity: 2,
    gridIndex: 2, 
    columnNumber: 5,
    rowNumber: 3,
  },
  {
    markerNumber: 'M909',
    colorName: 'Magenta',
    colorHex: '#FF00FF',
    brandName: 'Faber-Castell',
    quantity: 1,
    gridIndex: 2, 
    columnNumber: 8,
    rowNumber: 6,
  },
];

async function main() {
  console.log('Starting database seeding...');
  
  try {
    // Clear existing data 
    // Delete markers first because they depend on grids and brands
    await prisma.marker.deleteMany();
    console.log('Cleared existing marker data');
    
    await prisma.grid.deleteMany();
    console.log('Cleared existing grid data');
    
    await prisma.brand.deleteMany();
    console.log('Cleared existing brand data');
    
    // Create brands first
    const createdBrands = await Promise.all(
      brands.map(brand => prisma.brand.create({ data: brand }))
    );
    console.log(`Created ${createdBrands.length} brands`);
    
    // Create a map of brand name to brand ID for easy lookup
    const brandMap = new Map();
    createdBrands.forEach(brand => {
      brandMap.set(brand.name, brand.id);
    });
    
    // Create grids
    const createdGrids = [];
    for (const grid of grids) {
      const createdGrid = await prisma.grid.create({
        data: grid,
      });
      createdGrids.push(createdGrid);
    }
    console.log(`Created ${createdGrids.length} grids`);
    
    // Insert marker data with grid IDs and brand IDs
    const createdMarkers = [];
    for (const marker of markers) {
      // Make sure gridIndex is within the range of created grids
      if (marker.gridIndex >= 0 && marker.gridIndex < createdGrids.length) {
        // Get the appropriate grid ID based on the index
        const gridId = createdGrids[marker.gridIndex].id;
        
        // Get the brand ID from our map
        const brandId = brandMap.get(marker.brandName);
        
        // Remove the gridIndex and brandName fields and replace with gridId and brandId
        const { gridIndex, brandName, ...markerData } = marker;
        
        const createdMarker = await prisma.marker.create({
          data: {
            ...markerData,
            gridId,
            brandId,
          },
        });
        
        createdMarkers.push(createdMarker);
      } else {
        console.warn(`Skipping marker ${marker.markerNumber}: Invalid gridIndex ${marker.gridIndex}`);
      }
    }
    
    console.log(`Database seeded with ${createdMarkers.length} markers`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
