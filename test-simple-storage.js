const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSimpleStorageData() {
  try {
    // Check if SimpleStorage table exists and has data
    const simpleStorages = await prisma.$queryRaw`SELECT * FROM SimpleStorage`;
    console.log('Simple Storage entries:', simpleStorages);
    
    // Check markers with simpleStorageId
    const markersWithSimpleStorage = await prisma.$queryRaw`
      SELECT m.id, m.markerNumber, m.colorName, m.simpleStorageId, s.name as storageName 
      FROM Marker m 
      LEFT JOIN SimpleStorage s ON m.simpleStorageId = s.id 
      WHERE m.simpleStorageId IS NOT NULL
    `;
    console.log('Markers with simple storage:', markersWithSimpleStorage);
    
    // Check all markers to see their storage assignment
    const allMarkers = await prisma.$queryRaw`
      SELECT id, markerNumber, colorName, gridId, simpleStorageId, columnNumber, rowNumber 
      FROM Marker 
      LIMIT 10
    `;
    console.log('Sample markers:', allMarkers);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSimpleStorageData();
