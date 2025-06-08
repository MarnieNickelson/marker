'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import SearchMarkers from './components/SearchMarkers';
import Layout from './components/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Marker } from './types/marker';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from './utils/api';
import { getMarkerColorFamily } from './utils/colorUtils';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [colorFamilyMarkers, setColorFamilyMarkers] = useState<Marker[]>([]);
  const [selectedColorFamily, setSelectedColorFamily] = useState<string | null>(null);
  const [loadingColorFamily, setLoadingColorFamily] = useState(false);

  // Color families based on the existing app's color system
  const colorFamilies = [
    { name: 'Red', value: 'red', bgClass: 'bg-red-500 hover:bg-red-600', textClass: 'text-white' },
    { name: 'Orange', value: 'orange', bgClass: 'bg-orange-500 hover:bg-orange-600', textClass: 'text-white' },
    { name: 'Yellow', value: 'yellow', bgClass: 'bg-yellow-400 hover:bg-yellow-500', textClass: 'text-black' },
    { name: 'Green', value: 'green', bgClass: 'bg-green-500 hover:bg-green-600', textClass: 'text-white' },
    { name: 'Cyan', value: 'cyan', bgClass: 'bg-cyan-500 hover:bg-cyan-600', textClass: 'text-white' },
    { name: 'Blue', value: 'blue', bgClass: 'bg-blue-500 hover:bg-blue-600', textClass: 'text-white' },
    { name: 'Purple', value: 'purple', bgClass: 'bg-purple-500 hover:bg-purple-600', textClass: 'text-white' },
    { name: 'Pink', value: 'pink', bgClass: 'bg-pink-500 hover:bg-pink-600', textClass: 'text-white' },
    { name: 'Brown', value: 'brown', bgClass: 'bg-amber-800 hover:bg-amber-900', textClass: 'text-white' },
    { name: 'Gray', value: 'gray', bgClass: 'bg-gray-500 hover:bg-gray-600', textClass: 'text-white' },
    { name: 'Black', value: 'black', bgClass: 'bg-black hover:bg-gray-900', textClass: 'text-white' },
    { name: 'White', value: 'white', bgClass: 'bg-white hover:bg-gray-100 border border-gray-300', textClass: 'text-black' }
  ];

  // Function to handle clicking on a color family
  const handleColorFamilyClick = async (family: string) => {
    try {
      setLoadingColorFamily(true);
      setSelectedColorFamily(family);
      setSelectedMarker(null); // Clear any selected marker

      // Fetch markers for this color family
      const response = await fetchWithAuth<Marker[]>(`/api/markers?colorFamily=${family.toLowerCase()}&includeGrid=true&includeSimpleStorage=true`);
      
      if (response) {
        console.log("Color family markers response:", response);
        // Check a sample marker for storage information
        if (response.length > 0) {
          console.log("Sample marker:", response[0]);
          console.log("Sample marker grid:", response[0].grid);
          console.log("Sample marker simpleStorage:", response[0].simpleStorage);
        }
        setColorFamilyMarkers(response);
        if (response.length === 0) {
          toast.error(`No markers found in the ${family} color family.`);
        }
      } else {
        setColorFamilyMarkers([]);
        toast.error(`Failed to load ${family} markers.`);
      }
    } catch (error) {
      toast.error(`Error loading ${family} markers.`);
      setColorFamilyMarkers([]);
    } finally {
      setLoadingColorFamily(false);
    }
  };

  // Handle marker selection from search
  const handleMarkerSelected = (marker: Marker) => {
    setSelectedMarker(marker);
    // Clear color family results when a marker is selected from search
    setColorFamilyMarkers([]);
    setSelectedColorFamily(null);
  };

  // Handle clicking a marker to view it on the markers page
  const handleViewMarkerDetails = (marker: Marker) => {
    router.push(`/markers?marker=${marker.id}`);
  };

  // Find the color family of a marker
  const getColorFamily = (marker: Marker): string => {
    // Use manually set color family if available
    if (marker.colorFamily) {
      return marker.colorFamily;
    }
    
    // Otherwise auto-detect from hex
    const hex = marker.colorHex;
    
    // Remove # if present and validate hex format
    const cleanHex = hex.replace(/^#/, '');
    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      return 'unknown';
    }

    // Convert hex to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    // Find max and min values for RGB
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Calculate lightness
    const lightness = (max + min) / 2;
    
    // Calculate saturation
    let saturation = 0;
    if (max !== min) {
      saturation = lightness > 0.5 
        ? (max - min) / (2 - max - min) 
        : (max - min) / (max + min);
    }
    
    // Calculate hue
    let hue = 0;
    if (max !== min) {
      if (max === r) {
        hue = (g - b) / (max - min) + (g < b ? 6 : 0);
      } else if (max === g) {
        hue = (b - r) / (max - min) + 2;
      } else {
        hue = (r - g) / (max - min) + 4;
      }
      hue *= 60;
    }
    
    // Determine color family based on hue, saturation, and lightness
    if (saturation < 0.1) {
      if (lightness < 0.15) return 'black';
      if (lightness > 0.85) return 'white';
      return 'gray';
    }
    
    // Color families based on hue ranges
    if (hue < 15) return 'red';
    if (hue < 40) return 'orange';
    if (hue < 65) return 'yellow';
    // Brown is a special case - broader definition to catch more earth tones
    if ((hue >= 15 && hue < 50 && saturation > 0.1 && saturation < 0.7 && lightness < 0.5) || 
        (hue >= 20 && hue < 40 && saturation > 0.3 && saturation < 0.8 && lightness < 0.4)) return 'brown';
    if (hue < 165) return 'green';
    if (hue < 195) return 'cyan';
    if (hue < 255) return 'blue';
    if (hue < 285) return 'purple';
    if (hue < 345) return 'pink';
    return 'red'; // 345-360 is red again
  };

  // Find a grid by ID
  const findGridById = (gridId: string | null) => {
    if (!gridId) return null;
    return null; // We don't have a grids list in the home page component
  };
  
  // Helper function to get the storage name for display
  const getStorageLocationName = (marker: Marker) => {
    if (marker.gridId && marker.columnNumber !== null && marker.rowNumber !== null) {
      if (marker.grid) {
        return `${marker.grid.name} (${marker.columnNumber}, ${marker.rowNumber})`;
      }
      return `Grid (${marker.columnNumber}, ${marker.rowNumber})`;
    } else if (marker.simpleStorageId && marker.simpleStorage) {
      return marker.simpleStorage.name;
    } else {
      return 'Not stored';
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <img src="/inkventory-icon.png" alt="Inkventory Logo" className="h-12" />
            <h1 className="text-3xl font-bold text-primary-800">Welcome to Inkventory</h1>
          </div>
          <p className="text-gray-600 max-w-3xl mb-4">
            Keep track of your markers and find them quickly in your storage grids. 
            This app helps you organize your markers by their number, color, brand, and exact storage location.
          </p>
        </motion.div>

        {isAuthenticated ? (
          <>
            {/* Search Section - Reusing the SearchMarkers component */}
            <div className="mb-8">
              <SearchMarkers onMarkerSelected={handleMarkerSelected} simpleView={true} />
            </div>
            
            {/* Browse Markers Section */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-primary-800">Browse Markers</h2>
              
              <p className="text-gray-600 mb-4">
                Browse your markers by color family. Click on a color to see all markers in that color group.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
                {colorFamilies.map((family, index) => (
                  <button 
                    key={index}
                    onClick={() => handleColorFamilyClick(family.value)}
                    disabled={loadingColorFamily}
                    className={`${family.bgClass} ${family.textClass} font-medium py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 
                      ${selectedColorFamily === family.value ? 'ring-2 ring-white ring-offset-2' : ''}`}
                  >
                    {family.name}
                  </button>
                ))}
              </div>
              
              {/* Color family markers results */}
              {loadingColorFamily && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading markers...</p>
                </div>
              )}
              
              {!loadingColorFamily && colorFamilyMarkers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-semibold mb-3">
                    {selectedColorFamily && selectedColorFamily.charAt(0).toUpperCase() + selectedColorFamily.slice(1)} Markers 
                    <span className="ml-2 text-sm font-normal text-gray-500">({colorFamilyMarkers.length} found)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {colorFamilyMarkers.map((marker) => (
                      <div
                        key={marker.id}
                        onClick={() => handleViewMarkerDetails(marker)}
                        className="flex items-center p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div 
                          className="h-10 w-10 rounded-full mr-3" 
                          style={{ 
                            backgroundColor: marker.colorHex,
                            border: '1px solid #e5e7eb'
                          }}
                        />
                        <div className="flex-grow">
                          <p className="font-medium">
                            {marker.brand?.name && `${marker.brand.name} `}{marker.markerNumber}
                          </p>
                          <p className="text-sm font-medium">{marker.colorName} - {marker.markerNumber}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            {marker.brand?.name || 'No brand'} 
                            {marker.colorFamily && (
                              <span className="ml-1 flex items-center" title="Manually set color family">
                                • {marker.colorFamily}
                                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary-400"></span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-primary-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              <div className="flex justify-center mt-6">
                <Link href="/markers" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                  View All Markers
                </Link>
              </div>
            </motion.div>
            
            {/* Selected Marker Display */}
            {selectedMarker && !selectedColorFamily && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <h3 className="text-xl font-bold mb-2">Selected Marker</h3>
                <div 
                  className="flex items-center cursor-pointer hover:bg-gray-50 p-3 rounded-md transition-colors"
                  onClick={() => handleViewMarkerDetails(selectedMarker)}
                >
                  <div 
                    className="h-10 w-10 rounded-full mr-4" 
                    style={{ 
                      backgroundColor: selectedMarker.colorHex,
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">
                        {selectedMarker.brand?.name && `${selectedMarker.brand.name} `}
                        {selectedMarker.markerNumber}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">{selectedMarker.colorName}</p>
                    <p className="text-xs text-gray-500">
                      {getStorageLocationName(selectedMarker)}
                    </p>
                  </div>
                  <div className="text-primary-600">
                    View Details →
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            className="mt-12 p-8 bg-white rounded-lg shadow-lg text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-primary-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to access the Inkventory features.
            </p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
