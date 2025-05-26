import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Export all markers as CSV
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gridId = searchParams.get('gridId');
    const template = searchParams.get('template') === 'true';
    
    const where = gridId ? { gridId } : {};
    
    const markers = await prisma.marker.findMany({
      where,
      include: {
        grid: true,
        brand: true,
      },
      orderBy: [
        { grid: { name: 'asc' } },
        { columnNumber: 'asc' },
        { rowNumber: 'asc' },
      ]
    });

    // Create CSV content
    const headers = [
      'markerNumber',
      'colorName', 
      'colorHex',
      'brand',
      'quantity',
      'gridName',
      'columnNumber',
      'rowNumber'
    ];

    let csvRows: string[];

    if (template || markers.length === 0) {
      // Generate template with example data
      csvRows = [
        headers.join(','), // Header row
        'R123,"Crimson Red",#FF0000,Copic,1,"Main Storage",3,5',
        'B456,"Deep Blue",#0000FF,Prismacolor,1,"Main Storage",10,7',
        'G789,"Forest Green",#228B22,Copic,1,"Main Storage",8,2'
      ];
    } else {
      // Generate CSV with actual data
      csvRows = [
        headers.join(','), // Header row
        ...markers.map(marker => [
          marker.markerNumber,
          marker.colorName,
          marker.colorHex,
          marker.brand?.name || '',
          marker.quantity.toString(),
          marker.grid?.name || '',
          marker.columnNumber.toString(),
          marker.rowNumber.toString()
        ].map(field => {
          // Escape fields that contain commas or quotes
          if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        }).join(','))
      ];
    }

    const csvContent = csvRows.join('\n');
    const filename = template || markers.length === 0 
      ? `markers-template-${new Date().toISOString().split('T')[0]}.csv`
      : `markers-export-${new Date().toISOString().split('T')[0]}.csv`;

    // Return CSV with appropriate headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting markers:', error);
    return NextResponse.json({ error: 'Failed to export markers' }, { status: 500 });
  }
}
