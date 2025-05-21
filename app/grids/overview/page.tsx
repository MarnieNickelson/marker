'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import Grid from '../../components/Grid';
import toast from 'react-hot-toast';
import { Grid as GridType, Marker } from '../../types/marker';

export default function GridOverviewPage() {
  const [grids, setGrids] = useState<GridType[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrid, setSelectedGrid] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all grids
      const gridsResponse = await fetch('/api/grids');
      if (!gridsResponse.ok) {
        throw new Error('Failed to fetch grids');
      }
      const gridsData = await gridsResponse.json();
      setGrids(gridsData);

      // Fetch all markers with grid info
      const markersResponse = await fetch('/api/markers?includeGrid=true');
      if (!markersResponse.ok) {
        throw new Error('Failed to fetch markers');
      }
      const markersData = await markersResponse.json();
      setMarkers(markersData);

      // Set the first grid as selected by default if any exist
      if (gridsData.length > 0) {
        setSelectedGrid(gridsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Group markers by their gridId
  const markersByGrid = markers.reduce((acc, marker) => {
    if (!acc[marker.gridId]) {
      acc[marker.gridId] = [];
    }
    acc[marker.gridId].push(marker);
    return acc;
  }, {} as Record<string, Marker[]>);

  // Get current grid's markers
  const currentGridMarkers = selectedGrid ? markersByGrid[selectedGrid] || [] : [];

  // Get stats for the selected grid
  const getGridStats = (gridId: string) => {
    const gridMarkers = markersByGrid[gridId] || [];
    return {
      total: gridMarkers.length,
      filled: gridMarkers.length,
      empty: grids.find(g => g.id === gridId)
        ? grids.find(g => g.id === gridId)!.columns * grids.find(g => g.id === gridId)!.rows - gridMarkers.length
        : 0
    };
  };

  return (
    <Layout>
      <motion.div
        className="p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-800">Grid Overview</h1>
            <div className="flex mt-2 space-x-4">
              <a href="/grids" className="text-gray-500 font-medium hover:text-blue-600">List View</a>
              <a href="/grids/overview" className="text-blue-600 font-medium border-b-2 border-blue-600">Grid Overview</a>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <svg
              className="animate-spin h-8 w-8 text-primary-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : grids.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
            <p className="text-xl text-gray-500 mb-4">No storage grids defined yet</p>
            <a
              href="/grids"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Your First Grid
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-[300px_1fr] gap-6">
            {/* Grid selection sidebar */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 bg-blue-600 text-white">
                <h2 className="text-lg font-semibold">Your Grids</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {grids.map((grid) => {
                  const stats = getGridStats(grid.id);
                  return (
                    <button
                      key={grid.id}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedGrid === grid.id ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => setSelectedGrid(grid.id)}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-800">{grid.name}</h3>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                          {grid.columns}×{grid.rows}
                        </span>
                      </div>
                      <div className="mt-2 flex text-xs space-x-2 text-gray-500">
                        <span>{stats.filled} markers</span>
                        <span>•</span>
                        <span>{stats.empty} empty</span>
                      </div>
                      {/* Mini preview */}
                      <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(6px,1fr))] gap-0.5">
                        {Array.from({ length: Math.min(grid.columns * 3, 50) }).map((_, i) => {
                          const marker = markersByGrid[grid.id]?.find(
                            m => 
                              m.columnNumber === ((i % grid.columns) + 1) && 
                              m.rowNumber === Math.floor(i / grid.columns) + 1
                          );
                          return (
                            <div 
                              key={i} 
                              className="w-[6px] h-[6px] rounded-sm" 
                              style={{ 
                                backgroundColor: marker 
                                  ? marker.colorHex 
                                  : '#e5e7eb'
                              }}
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid display area */}
            {selectedGrid && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-4">
                <h2 className="text-xl font-bold mb-4">
                  {grids.find((g) => g.id === selectedGrid)?.name} Overview
                </h2>
                
                {/* Display selected grid with all its markers */}
                {selectedGrid && grids.find((g) => g.id === selectedGrid) && (
                  <GridWithAllMarkers 
                    grid={grids.find((g) => g.id === selectedGrid)!} 
                    markers={markersByGrid[selectedGrid] || []} 
                  />
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}

// Component to display a grid with all its markers
const GridWithAllMarkers = ({ grid, markers }: { grid: GridType; markers: Marker[] }) => {
  // Create a map of positions to markers for quick lookup
  const markerMap: Record<string, Marker> = {};
  
  markers.forEach(marker => {
    const key = `${marker.columnNumber}-${marker.rowNumber}`;
    markerMap[key] = marker;
  });
  
  const columns = Array.from({ length: grid.columns }, (_, i) => i + 1);
  const rows = Array.from({ length: grid.rows }, (_, i) => i + 1);
  
  // Determine if this is an odd or even grid to alternate colors
  const isEven = grid.id.charCodeAt(0) % 2 === 0;

  const gridColor = {
    bg: isEven ? 'bg-primary-50' : 'bg-accent-50',
    border: isEven ? 'border-primary-200' : 'border-accent-200',
    header: isEven ? 'bg-blue-600 text-white' : 'bg-accent-600 text-white',
  };

  // Create grid template columns style
  const gridTemplateColumns = `auto repeat(${grid.columns}, minmax(44px, 1fr))`;

  return (
    <motion.div 
      className={`mt-4 rounded-xl overflow-hidden border ${gridColor.border} shadow-md`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className={`text-lg font-semibold text-gray-600 py-2 px-4 ${gridColor.header}`}>
        {grid.name}
      </h3>
      <div className="overflow-x-auto p-2">
        <div 
          className={`grid ${gridColor.bg} rounded-lg`}
          style={{ gridTemplateColumns }}
        >
          {/* Column headers */}
          <div className="h-10 flex items-center justify-center font-bold"></div>
          {columns.map((col) => (
            <div 
              key={col} 
              className="h-10 flex items-center justify-center font-medium border-b-2 border-gray-300"
            >
              {col}
            </div>
          ))}

          {/* Grid cells */}
          {rows.map((row) => (
            <React.Fragment key={row}>
              {/* Row headers */}
              <div className="h-10 flex items-center justify-center font-medium border-r-2 border-gray-300">
                {row}
              </div>
              
              {/* Cells */}
              {columns.map((col) => {
                const key = `${col}-${row}`;
                const marker = markerMap[key];
                
                return (
                  <div 
                    key={`${row}-${col}`}
                    className={`h-11 w-11 border border-gray-200 flex items-center justify-center rounded-md m-0.5 transition-all hover:scale-105`}
                  >
                    {marker ? (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                        style={{ 
                          backgroundColor: marker.colorHex,
                          color: getContrastTextColor(marker.colorHex)
                        }}
                        title={`${marker.markerNumber} - ${marker.colorName} (${marker.brand})`}
                      >
                        <span>{marker.markerNumber}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="p-2 text-xs text-gray-500 flex items-center justify-between border-t border-gray-100">
        <div>
          <span className="mr-1">{grid.columns}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="ml-1">{grid.rows}</span> grid
        </div>
        <div>
          {markers.length} / {grid.columns * grid.rows} filled
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to determine if text should be white or black based on background color
const getContrastTextColor = (hexColor: string): string => {
  // Remove the hash if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Calculate luminance - using the formula for perceived brightness
  // See: https://www.w3.org/TR/AERT/#color-contrast
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};