'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Marker, Grid } from '../types/marker';

interface MarkerStats {
  totalCount: number;
  totalQuantity: number;
  gridCounts: {
    [gridName: string]: number;
  };
  colorCounts: {
    [colorName: string]: number;
  };
  brandCounts: {
    [brand: string]: number;
  };
}

export default function StatsPage() {
  const [stats, setStats] = useState<MarkerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [grids, setGrids] = useState<Grid[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch grids first
        const gridsResponse = await fetch('/api/grids');
        if (!gridsResponse.ok) {
          throw new Error('Failed to fetch grids');
        }
        const gridsData = await gridsResponse.json();
        setGrids(gridsData);
        
        // Then fetch markers
        const markersResponse = await fetch('/api/markers');
        if (!markersResponse.ok) {
          throw new Error('Failed to fetch marker data');
        }
        
        const markers: Marker[] = await markersResponse.json();
        
        // Calculate statistics
        const colorCounts: {[colorName: string]: number} = {};
        const gridCounts: {[gridId: string]: number} = {};
        const brandCounts: {[brand: string]: number} = {};
        
        // Track unique markers by combining markerNumber, colorName, and brand
        const uniqueMarkers = new Set<string>();
        
        markers.forEach(marker => {
          // Add to unique markers count
          const markerKey = `${marker.markerNumber}-${marker.colorName}-${marker.brand}`;
          uniqueMarkers.add(markerKey);
          
          // Count by color
          if (colorCounts[marker.colorName]) {
            colorCounts[marker.colorName]++;
          } else {
            colorCounts[marker.colorName] = 1;
          }
          
          // Count by grid
          if (gridCounts[marker.gridId]) {
            gridCounts[marker.gridId]++;
          } else {
            gridCounts[marker.gridId] = 1;
          }
          
          // Count by brand
          const brand = marker.brand || 'Unspecified';
          if (brandCounts[brand]) {
            brandCounts[brand]++;
          } else {
            brandCounts[brand] = 1;
          }
        });
        
        // Convert grid IDs to names in the stats
        const namedGridCounts: {[gridName: string]: number} = {};
        
        Object.entries(gridCounts).forEach(([gridId, count]) => {
          const grid = gridsData.find((g: Grid) => g.id === gridId);
          const gridName = grid ? grid.name : 'Unknown Grid';
          namedGridCounts[gridName] = count;
        });
        
        setStats({
          totalCount: markers.length, // Total marker instances
          totalQuantity: uniqueMarkers.size, // Number of unique markers
          gridCounts: namedGridCounts,
          colorCounts,
          brandCounts
        });
        
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Failed to load marker statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Function to get color class for cards
  const getColorClass = (colorName: string) => {
    const lowerColor = colorName.toLowerCase();
    
    if (lowerColor.includes('red')) return 'bg-secondary-100 text-red-800 border-red-200';
    if (lowerColor.includes('blue')) return 'bg-primary-100 text-blue-800 border-blue-200';
    if (lowerColor.includes('green')) return 'bg-green-100 text-green-800 border-green-200';
    if (lowerColor.includes('yellow')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (lowerColor.includes('purple')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (lowerColor.includes('pink')) return 'bg-pink-100 text-pink-800 border-pink-200';
    if (lowerColor.includes('orange')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (lowerColor.includes('gray') || lowerColor.includes('grey')) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (lowerColor.includes('black')) return 'bg-gray-800 text-white border-gray-700';
    if (lowerColor.includes('white')) return 'bg-gray-50 text-gray-800 border-gray-200';
    if (lowerColor.includes('brown')) return 'bg-amber-100 text-amber-800 border-amber-200';
    
    return 'bg-primary-100 text-primary-800 border-primary-200';
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-primary-800 mb-4">Marker Statistics</h1>
        <p className="text-gray-600 max-w-3xl mb-8">
          Overview of your marker collection and storage distribution.
        </p>

        {loading ? (
          <div className="flex justify-center p-10">
            <svg className="animate-spin h-10 w-10 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <motion.div 
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800">Total Markers</h3>
                    <span className="text-3xl font-bold text-primary-600">{stats.totalCount}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Total number of marker instances across all locations</p>
                </motion.div>

                <motion.div 
                  className="bg-white p-6 rounded-xl shadow-md border border-primary-100"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800">Unique Markers</h3>
                    <span className="text-3xl font-bold text-primary-600">{stats.totalQuantity}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Number of unique markers (by number, color, brand)</p>
                </motion.div>

                {Object.entries(stats.gridCounts).map(([gridName, count], index) => (
                  <motion.div 
                    key={gridName}
                    className="bg-white p-6 rounded-xl shadow-md border border-accent-100"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-800">{gridName}</h3>
                      <span className="text-3xl font-bold text-accent-600">{count}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Markers stored in {gridName}</p>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full">
                      <div 
                        className="h-full bg-accent-500 rounded-full" 
                        style={{width: `${stats.totalCount ? (count / stats.totalCount) * 100 : 0}%`}}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {stats && stats.colorCounts && (
              <motion.div
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Markers by Color</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.colorCounts).map(([colorName, count], index) => (
                    <motion.div
                      key={colorName}
                      className={`p-4 rounded-lg border ${getColorClass(colorName)}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{colorName}</span>
                        <span className="text-lg font-semibold text-gray-600">{count}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {stats && stats.brandCounts && (
              <motion.div
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Markers by Brand</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.brandCounts).map(([brand, count], index) => (
                    <motion.div
                      key={brand}
                      className={`p-4 rounded-lg border ${getColorClass(brand)}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{brand}</span>
                        <span className="text-lg font-semibold text-gray-600">{count}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </Layout>
  );
}
