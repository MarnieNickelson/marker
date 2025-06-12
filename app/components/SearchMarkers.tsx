import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Marker, Grid } from '../types/marker';
import GridComponent from './Grid';
import toast from 'react-hot-toast';
import { fetchWithAuth } from '../utils/api';

// Helper function to determine if text should be white or black based on background color
const getContrastingTextColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Helper function to check if a string is a valid hex color code
const isHexColorCode = (str: string): boolean => {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(str);
};

// Helper function to normalize hex color (ensure it has # prefix)
const normalizeHexColor = (hexColor: string): string => {
  if (!hexColor.startsWith('#')) {
    return `#${hexColor}`;
  }
  return hexColor;
};

interface SearchMarkersProps {
  simpleView?: boolean;
  onMarkerSelected?: (marker: Marker) => void;
  onMarkerEdit?: (marker: Marker) => void;
}

const SearchMarkers: React.FC<SearchMarkersProps> = ({ 
  simpleView = false,
  onMarkerSelected,
  onMarkerEdit
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [sameMarkers, setSameMarkers] = useState<Marker[]>([]);
  const [loadingSameMarkers, setLoadingSameMarkers] = useState(false);
  const [locationCounts, setLocationCounts] = useState<{[key: string]: number}>({});

  // Fetch all grids on component mount
  useEffect(() => {
    const fetchGrids = async () => {
      const data = await fetchWithAuth<Grid[]>('/api/grids');
      if (data) {
        setGrids(data);
      }
    };

    fetchGrids();
  }, []);

  const fetchLocationCounts = async (markers: Marker[]) => {
    const counts: {[key: string]: number} = {};
    
    // Create a batch of promises to fetch location counts for each marker
    const promises = markers.map(async (marker) => {
      const data = await fetchWithAuth<Marker[]>(`/api/markers/locations?markerNumber=${encodeURIComponent(marker.markerNumber)}&colorName=${encodeURIComponent(marker.colorName)}&brandId=${marker.brandId || ''}`);
      if (data) {
        counts[marker.id] = data.length;
      }
    });
    
    // Wait for all fetches to complete
    await Promise.all(promises);
    setLocationCounts(counts);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Format the query appropriately
      const formattedQuery = searchQuery.trim();
      const isHexSearch = isHexColorCode(formattedQuery);
      
      // Include grid and simpleStorage data in search results
      const data = await fetchWithAuth<Marker[]>(`/api/markers/search?q=${encodeURIComponent(formattedQuery)}&includeGrid=true&includeSimpleStorage=true`);
      
      if (!data) {
        setSearchResults([]);
        return;
      }
      
      setSearchResults(data);
      setSelectedMarker(null);
      
      if (data.length === 0) {
        if (isHexSearch) {
          toast.error(`No markers found with color code ${normalizeHexColor(formattedQuery)}`);
        } else {
          toast.error('No markers found matching your search');
        }
      } else if (data.length === 1) {
        // Automatically select the marker if only one is found
        const singleMarker = data[0];
        handleSelectMarker(singleMarker);
        
        if (isHexSearch) {
          toast.success(`1 marker found with color code ${normalizeHexColor(formattedQuery)}`);
        } else {
          toast.success('1 marker found');
        }
      } else {
        if (isHexSearch) {
          toast.success(`${data.length} markers found with color code ${normalizeHexColor(formattedQuery)}`);
        } else {
          toast.success(`${data.length} markers found`);
        }
        
        // Fetch location counts for all returned markers when multiple
        await fetchLocationCounts(data);
      }
      
    } catch (err) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMarker = async (marker: Marker) => {
    setSelectedMarker(marker);
    
    // Notify parent component about marker selection if callback provided
    if (onMarkerSelected) {
      onMarkerSelected(marker);
    }
    
    // If in simple view mode, we don't need to fetch locations
    if (simpleView) return;
    
    // Fetch all markers with the same marker number, color, and brand
    setLoadingSameMarkers(true);
    
    const data = await fetchWithAuth<Marker[]>(
      `/api/markers/locations?markerNumber=${encodeURIComponent(marker.markerNumber)}&colorName=${encodeURIComponent(marker.colorName)}&brandId=${marker.brandId || ''}`
    );
    
    if (data) {
      setSameMarkers(data);
    }
    
    setLoadingSameMarkers(false);
  };
  
  // Helper function to get the storage name for display
  const getStorageLocationName = (marker: Marker): string => {
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

  // Find the grid by ID
  const findGridById = (gridId: string) => {
    return grids.find(grid => grid.id === gridId);
  };

  // Helper function to convert hex to HSL
  const hexToHSL = (hex: string): { h: number, s: number, l: number } => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Find max and min values for RGB
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Calculate lightness
    const l = (max + min) / 2;
    
    // Calculate saturation
    let s = 0;
    if (max !== min) {
      s = l > 0.5 
        ? (max - min) / (2 - max - min) 
        : (max - min) / (max + min);
    }
    
    // Calculate hue
    let h = 0;
    if (max !== min) {
      if (max === r) {
        h = (g - b) / (max - min) + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / (max - min) + 2;
      } else {
        h = (r - g) / (max - min) + 4;
      }
      h *= 60;
    }
    
    return { h, s, l };
  };

  // Function to determine color family from hex code
  const getColorFamily = (hex: string): string => {
    // Remove # if present and validate hex format
    hex = hex.replace(/^#/, '');
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return 'unknown';
    }

    const { h, s, l } = hexToHSL(`#${hex}`);
    
    // Determine color family based on hue, saturation, and lightness
    if (s < 0.1) {
      if (l < 0.15) return 'black';
      if (l > 0.85) return 'white';
      return 'gray';
    }
    
    // Color families based on hue ranges
    if (h < 15) return 'red';
    if (h < 40) return 'orange';
    if (h < 65) return 'yellow';
    // Brown is a special case - broader definition to catch more earth tones
    if ((h >= 15 && h < 50 && s > 0.1 && s < 0.7 && l < 0.5) || 
        (h >= 20 && h < 40 && s > 0.3 && s < 0.8 && l < 0.4)) return 'brown';
    if (h < 165) return 'green';
    if (h < 195) return 'cyan';
    if (h < 255) return 'blue';
    if (h < 285) return 'purple';
    if (h < 345) return 'pink';
    return 'red'; // 345-360 is red again
  };

  return (
    <div className="mt-8">
      <motion.h2 
        className="text-2xl font-bold mb-4 text-primary-800" 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {simpleView ? 'Search for a Marker' : 'Find a Marker'}
      </motion.h2>
      
      {/* Selected Marker Display - show above search, styled like color page */}
      {!simpleView && selectedMarker && (
        <AnimatePresence>
          <motion.div 
            className="mb-8 bg-white rounded-lg shadow-md p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-3">Selected Marker</h3>
            <div 
              className="w-full h-32 rounded-lg flex items-center justify-center mb-4"
              style={{ 
                backgroundColor: selectedMarker.colorHex,
                color: getContrastingTextColor(selectedMarker.colorHex)
              }}
            >
              <div className="text-center">
                <p className="text-xl font-bold">{selectedMarker.colorName} - {selectedMarker.markerNumber}</p>
                <p className="text-sm mt-1">
                  {selectedMarker.brand?.name || 'No brand'} ~ 
                  {selectedMarker.colorFamily ? (
                    <span title="Manually set color family" className="inline-flex items-center">
                      {selectedMarker.colorFamily}
                      <span className="ml-1 w-2 h-2 rounded-full bg-primary-400" title="Manually set"></span>
                    </span>
                  ) : (
                    <span title="Auto-detected color family">
                      {getColorFamily(selectedMarker.colorHex)}
                    </span>
                  )}
                </p>
                {selectedMarker.gridId && (
                  <p className="text-sm mt-2">
                    Location: {selectedMarker.grid?.name || 'Unknown grid'} 
                    {selectedMarker.columnNumber !== null && selectedMarker.rowNumber !== null && 
                      ` (Column: ${selectedMarker.columnNumber}, Row: ${selectedMarker.rowNumber})`
                    }
                  </p>
                )}
                {selectedMarker.simpleStorageId && !selectedMarker.gridId && (
                  <p className="text-sm mt-2">
                    Location: {selectedMarker.simpleStorage?.name || 'Simple storage'}
                  </p>
                )}
                {!selectedMarker.gridId && !selectedMarker.simpleStorageId && (
                  <p className="text-sm mt-2">Location: Not stored</p>
                )}
                <p className="text-sm mt-2 italic">
                  Last updated: {new Date(selectedMarker.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Same markers section */}
            {!loadingSameMarkers && sameMarkers.length > 1 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  Other {selectedMarker.colorName} - {selectedMarker.markerNumber} markers in your inventory:
                </h4>
                <div className="grid gap-2 max-h-60 overflow-y-auto pr-2">
                  {sameMarkers.filter(marker => marker.id !== selectedMarker.id).map((marker, index) => (
                    <div key={index} className="p-2 bg-white rounded border border-gray-200 text-sm">
                      <div className="flex justify-between items-center">
                        {marker.gridId ? (
                          <span>
                            <span className="font-medium">{marker.grid?.name}</span>
                            {marker.columnNumber !== null && marker.rowNumber !== null && (
                              <span className="text-gray-600"> at position {marker.columnNumber}, {marker.rowNumber}</span>
                            )}
                          </span>
                        ) : marker.simpleStorage ? (
                          <span>
                            <span className="font-medium">{marker.simpleStorage.name}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">Not stored</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {loadingSameMarkers && (
              <div className="mt-4 flex items-center text-gray-500">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading other locations...
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
      
      <motion.form 
        onSubmit={handleSearch} 
        className="flex gap-2 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isHexColorCode(searchQuery) ? (
              <div 
                className="h-5 w-5 rounded-full"
                style={{ 
                  backgroundColor: searchQuery.startsWith('#') ? searchQuery : `#${searchQuery}`,
                  border: '1px solid #e5e7eb'
                }}
                title="Searching by hex color"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by marker number, color name, hex code (#F5A623), or brand..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
        <button 
          type="submit" 
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching
            </span>
          ) : (
            'Search'
          )}
        </button>
      </motion.form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h3 className="font-bold text-lg mb-2 text-gray-700">{searchResults.length} Results</h3>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-200">
            {searchResults.slice(0, 10).map(marker => (
              <div 
                key={marker.id}
                className={`flex items-center p-3 cursor-pointer transition-colors ${
                  selectedMarker?.id === marker.id ? 'bg-primary-50' : 'hover:bg-gray-50'
                }`}
              >
                <div 
                  className="h-8 w-8 rounded-full mr-3"
                  style={{ 
                    backgroundColor: marker.colorHex,
                    border: '1px solid #e5e7eb'
                  }}
                  onClick={() => handleSelectMarker(marker)}
                />
                <div className="flex-grow" onClick={() => handleSelectMarker(marker)}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {marker.colorName} - {marker.markerNumber}
                    </p>
                    <div className="flex items-center gap-2">
                      {locationCounts[marker.id] > 1 && (
                        <span className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded-full">
                          {locationCounts[marker.id]} locations
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {marker.brand?.name || 'No brand'} ~ {getColorFamily(marker.colorHex)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getStorageLocationName(marker)} • Last updated: {new Date(marker.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                {onMarkerEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerEdit(marker);
                    }}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors ml-2"
                    title="Edit marker"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SearchMarkers;
