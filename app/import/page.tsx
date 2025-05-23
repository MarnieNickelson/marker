'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Grid } from '../types/marker';

interface MarkerImport {
  markerNumber: string;
  colorName: string;
  colorHex: string;
  brand: string;
  quantity: number;
  gridId?: string;
  gridName?: string;
  columnNumber: number;
  rowNumber: number;
}

export default function ImportPage() {
  const [importText, setImportText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [loadingGrids, setLoadingGrids] = useState(true);

  // Fetch available grids
  useEffect(() => {
    const fetchGrids = async () => {
      try {
        const response = await fetch('/api/grids');
        if (!response.ok) {
          throw new Error('Failed to fetch grids');
        }
        const data = await response.json();
        setGrids(data);
      } catch (error) {
        console.error('Error fetching grids:', error);
        toast.error('Failed to load storage grids');
      } finally {
        setLoadingGrids(false);
      }
    };
    
    fetchGrids();
  }, []);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!importText.trim()) {
      toast.error('Please enter marker data to import');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Parse the import text (CSV format)
      // Expected format: markerNumber,colorName,colorHex,brand,quantity,gridName,columnNumber,rowNumber
      // Example: R123,Crimson Red,#FF0000,Copic,2,Main Storage,3,5
      const lines = importText.split('\n').filter(line => line.trim());
      const markers: MarkerImport[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(',').map(part => part.trim());
        
        // Check for minimal required parts
        if (parts.length < 4) {
          errors.push(`Line ${i+1}: Not enough values (minimum required: markerNumber,colorName,gridName,columnNumber,rowNumber)`);
          continue;
        }
        
        // For backward compatibility, handle both formats
        // Old format: markerNumber,colorName,gridName,columnNumber,rowNumber
        // New format: markerNumber,colorName,colorHex,brand,gridName,columnNumber,rowNumber
        
        let markerNumber: string, 
            colorName: string, 
            colorHex: string = '#000000', 
            brand: string = '', 
            gridName: string, 
            columnNumber: string, 
            rowNumber: string;
        
        if (parts.length === 5) {
          // Old format - directly use grid name
          [markerNumber, colorName, gridName, columnNumber, rowNumber] = parts;
        } else if (parts.length >= 7) {
          // New format with colorHex and brand
          [markerNumber, colorName, colorHex, brand, gridName, columnNumber, rowNumber] = parts;
          
          // Validate hex color format
          if (!colorHex.startsWith('#') || (colorHex.length !== 4 && colorHex.length !== 7)) {
            colorHex = '#000000'; // Default to black if invalid
          }
        } else {
          // Handle ambiguous case with 6-7 values by assuming the last two are always column and row
          // This adapts to potential variations in the format
          colorName = parts.slice(1, parts.length - 4).join(','); // Combine any excess parts into colorName
          gridName = parts[parts.length - 3];
          columnNumber = parts[parts.length - 2];
          rowNumber = parts[parts.length - 1];
          markerNumber = parts[0];
        }
        
        // Find grid by name
        const grid = grids.find(g => g.name.toLowerCase() === gridName.toLowerCase());
        
        if (!grid) {
          errors.push(`Line ${i+1}: Grid with name "${gridName}" not found`);
          continue;
        }
        
        const colNum = parseInt(columnNumber);
        const rowNum = parseInt(rowNumber);
        
        if (isNaN(colNum) || colNum < 1 || colNum > grid.columns || isNaN(rowNum) || rowNum < 1 || rowNum > grid.rows) {
          errors.push(`Line ${i+1}: Invalid coordinates. Column must be 1-${grid.columns}, row must be 1-${grid.rows}`);
          continue;
        }
        
        markers.push({
          markerNumber,
          colorName,
          colorHex,
          brand,
          quantity: 1, // Always 1 since we count by instances
          gridName,
          gridId: grid.id, // Include both for compatibility
          columnNumber: colNum,
          rowNumber: rowNum
        });
      }
      
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error, { duration: 4000 }));
        if (markers.length === 0) {
          return; // Don't proceed if there are no valid markers
        }
        toast.error(`Found ${errors.length} issues. Proceeding with ${markers.length} valid markers.`);
      }
      
      if (markers.length === 0) {
        toast.error('No valid markers found to import');
        return;
      }
      
      // Send the parsed markers to the API
      const response = await fetch('/api/markers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markers }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to import markers');
      }
      
      // Success
      toast.success(`Successfully imported ${result.imported} markers`);
      setImportText('');
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error((error as Error).message || 'Failed to import markers');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <motion.div
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-primary-800 mb-6">Bulk Import Markers</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          {loadingGrids ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
              <p>Loading grid information...</p>
            </div>
          ) : grids.length === 0 ? (
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">No Storage Grids Available</h3>
              <p className="text-yellow-700 mb-4">You need to create at least one storage grid before importing markers.</p>
              <a href="/grids" className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Create Storage Grids
              </a>
            </div>
          ) : (
            <form onSubmit={handleImport} className="space-y-6">
              <div>
                <label htmlFor="importText" className="block text-sm font-medium text-gray-700 mb-1">
                  Marker Data (CSV Format)
                </label>
                <div className="text-xs text-gray-500 mb-2">
                  <p>Format each line as:</p>
                  <p className="font-mono bg-gray-50 p-1 mt-1 rounded">markerNumber,colorName,colorHex,brand,gridName,columnNumber,rowNumber</p>
                  <p className="mt-1">Example: R123,Crimson Red,#FF0000,Copic,{grids[0]?.name},3,5</p>
                  <p className="italic mt-1">Simplified format also supported: markerNumber,colorName,gridName,columnNumber,rowNumber</p>
                  <p className="text-blue-600 mt-1">Brand can be either a brand name (will be created if it doesn't exist) or a brand ID</p>
                </div>
                <textarea
                  id="importText"
                  rows={10}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                  placeholder={`R123,Crimson Red,#FF0000,Copic,${grids[0]?.name},3,5
B456,Deep Blue,#0000FF,Prismacolor,${grids[0]?.name},10,7
G789,Forest Green,#228B22,Copic,${grids[0]?.name},8,2`}
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing...
                    </>
                  ) : (
                    'Import Markers'
                  )}
                </button>
              </div>
            </form>
          )}
          
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-600 mb-4 flex items-center text-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Available Grids
            </h3>
            
            {!loadingGrids && (
              <div className="space-y-3 mb-6">
                {grids.map(grid => (
                  <div key={grid.id} className="bg-primary-600 p-3 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">{grid.name}</p>
                        <p className="text-xs text-white opacity-80">Use this name in your CSV</p>
                      </div>
                      <div className="text-sm text-white">
                        {grid.columns} columns × {grid.rows} rows
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-gray-600 mb-4 flex items-center text-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Import Instructions
            </h3>              <div className="space-y-3 text-sm text-gray-600">
              <p>Upload multiple markers at once using CSV format. Each line represents one marker.</p>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-700">Full format (recommended):</p>
                <p className="mt-1 font-mono">markerNumber,colorName,colorHex,brand,gridName,columnNumber,rowNumber</p>
                <p className="mt-2 text-xs">
                  <span className="font-medium">markerNumber:</span> Identifier for the marker<br />
                  <span className="font-medium">colorName:</span> Name of the color (e.g., "Crimson Red")<br />
                  <span className="font-medium">colorHex:</span> Hexadecimal color code (e.g., "#FF0000")<br />
                  <span className="font-medium">brand:</span> Marker brand (e.g., "Copic")<br />
                  <span className="font-medium">gridName:</span> Name of the storage grid<br />
                  <span className="font-medium">columnNumber:</span> Column position in the grid<br />
                  <span className="font-medium">rowNumber:</span> Row position in the grid
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-700">Simplified format (also supported):</p>
                <p className="mt-1 font-mono">markerNumber,colorName,gridName,columnNumber,rowNumber</p>
                <p className="mt-1 text-xs text-gray-500">
                  When using simplified format, default values will be used for missing fields:
                  colorHex="#000000", brand="", quantity=1
                </p>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                <p className="text-yellow-800 font-medium">
                  Notes:
                </p>
                <ul className="list-disc ml-5 mt-1 text-yellow-800">
                  <li>Duplicate marker numbers will be rejected.</li>
                  <li>Grid names are case-insensitive (e.g., "Main Grid" and "main grid" are the same).</li>
                  <li>Make sure column and row numbers are within the grid's dimensions.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
