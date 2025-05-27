import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Marker, Grid } from '../types/marker';
import GridComponent from './Grid';
import toast from 'react-hot-toast';

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

const SearchMarkers: React.FC = () => {
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
      try {
        const response = await fetch('/api/grids');
        if (!response.ok) {
          throw new Error('Failed to load grids');
        }
        const data = await response.json();
        setGrids(data);
      } catch (error) {
        console.error('Error loading grids:', error);
        toast.error('Failed to load storage grids');
      }
    };

    fetchGrids();
  }, []);

  const fetchLocationCounts = async (markers: Marker[]) => {
    const counts: {[key: string]: number} = {};
    
    // Create a batch of promises to fetch location counts for each marker
    const promises = markers.map(async (marker) => {
      try {
        const response = await fetch(`/api/markers/locations?markerNumber=${encodeURIComponent(marker.markerNumber)}&colorName=${encodeURIComponent(marker.colorName)}&brandId=${marker.brandId || ''}`);
        if (!response.ok) return;
        
        const data = await response.json();
        counts[marker.id] = data.length;
      } catch (error) {
        console.error(`Error fetching location count for marker ${marker.id}:`, error);
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
      
      const response = await fetch(`/api/markers/search?q=${encodeURIComponent(formattedQuery)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search markers');
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
        setSelectedMarker(singleMarker);
        
        // Immediately fetch locations for the single marker
        try {
          const locResponse = await fetch(`/api/markers/locations?markerNumber=${encodeURIComponent(singleMarker.markerNumber)}&colorName=${encodeURIComponent(singleMarker.colorName)}&brandId=${singleMarker.brandId || ''}`);
          if (locResponse.ok) {
            const locData = await locResponse.json();
            setSameMarkers(locData);
            // Also update the locationCounts for this marker
            setLocationCounts({ [singleMarker.id]: locData.length });
          }
        } catch (error) {
          console.error('Error fetching single marker locations:', error);
        }
        
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
      toast.error((err as Error).message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMarker = async (marker: Marker) => {
    setSelectedMarker(marker);
    
    // Fetch all markers with the same marker number, color, and brand
    setLoadingSameMarkers(true);
    try {
      const response = await fetch(`/api/markers/locations?markerNumber=${encodeURIComponent(marker.markerNumber)}&colorName=${encodeURIComponent(marker.colorName)}&brandId=${marker.brandId || ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch marker locations');
      }
      
      const data = await response.json();
      setSameMarkers(data);
    } catch (error) {
      console.error('Error fetching marker locations:', error);
      toast.error('Failed to load all locations for this marker');
    } finally {
      setLoadingSameMarkers(false);
    }
  };
  
  // Find the grid by ID
  const findGridById = (gridId: string) => {
    return grids.find(grid => grid.id === gridId);
  };

  return (
    <div className="mt-8">
      <motion.h2 
        className="text-2xl font-bold mb-4 text-primary-800" 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Find a Marker
      </motion.h2>
      
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
          {isHexColorCode(searchQuery) && (
            <div className="absolute inset-y-0 right-0 pr-8 flex items-center">
              <div className="bg-gray-100 rounded-md px-2 py-1 text-xs text-gray-600">
                Searching by hex color
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors flex items-center gap-2 shadow-md"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </>
          ) : (
            <>
              <span>Search</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </>
          )}
        </button>
      </motion.form>
      
      <AnimatePresence mode="wait">
        {searchResults.length > 0 ? (
          <motion.div 
            key="results"
            className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-600 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Search Results ({searchResults.length})
              </h3>
              <div className="max-h-[500px] overflow-y-auto pr-1 space-y-2">
                {searchResults.map((marker) => (
                  <motion.div
                    key={marker.id}
                    className={`p-3 mt-1 mb-1 ml-1 cursor-pointer rounded-lg transition-all border ${
                      selectedMarker?.id === marker.id 
                        ? 'ring-2 ring-primary-500 border-primary-300 bg-primary-50' 
                        : 'hover:bg-gray-50 border-gray-100'
                    }`}
                    onClick={() => handleSelectMarker(marker)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800">{marker.markerNumber}</p>
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ 
                          backgroundColor: marker.colorHex,
                          border: '1px solid #e5e7eb'
                        }}
                        title={normalizeHexColor(marker.colorHex)}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {marker.colorName}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {marker.brand?.name || 'No brand'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {normalizeHexColor(marker.colorHex)}
                      </span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {locationCounts[marker.id] !== undefined ? `${locationCounts[marker.id]} ${locationCounts[marker.id] === 1 ? 'location' : 'locations'}` : '...'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {findGridById(marker.gridId)?.name || 'Unknown grid'} ({marker.columnNumber}, {marker.rowNumber})
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div>
              <AnimatePresence mode="wait">
                {selectedMarker ? (
                  <motion.div 
                    key={selectedMarker.id}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="border-b border-gray-100 pb-4 mb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedMarker.markerNumber}</h3>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full"
                              style={{ 
                                backgroundColor: selectedMarker.colorHex,
                                border: '1px solid #e5e7eb'
                              }}
                              title={selectedMarker.colorHex}
                            />
                            <span className="text-sm text-gray-600">{selectedMarker.colorName}</span>
                            
                            {/* Display hex color code with a copy button */}
                            <div 
                              className="ml-2 bg-gray-50 px-2 py-1 rounded-md text-xs flex items-center cursor-pointer hover:bg-gray-100"
                              onClick={() => {
                                const hexColor = normalizeHexColor(selectedMarker.colorHex);
                                navigator.clipboard.writeText(hexColor);
                                toast.success(`Copied ${hexColor} to clipboard`);
                              }}
                              title="Click to copy hex code"
                            >
                              <span className="mr-1">{normalizeHexColor(selectedMarker.colorHex)}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </div>
                          </div>
                          {selectedMarker.brand && (
                            <p className="text-sm text-gray-500 mt-1">
                              Brand: {selectedMarker.brand.name}
                            </p>
                          )}
                          <p className="text-sm text-blue-600 mt-2 font-medium">
                            Total Markers: {locationCounts[selectedMarker.id] !== undefined ? locationCounts[selectedMarker.id] : (sameMarkers.length > 0 ? sameMarkers.length : '...')} {(locationCounts[selectedMarker.id] || sameMarkers.length) > 1 ? 'locations' : 'location'}
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                          <p className="text-sm font-medium text-gray-800 mb-2">
                            Locations ({loadingSameMarkers ? '...' : sameMarkers.length > 0 ? sameMarkers.length : '0'})
                          </p>
                          
                          {loadingSameMarkers ? (
                            <div className="flex justify-center py-2">
                              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {sameMarkers.map((sameMarker) => (
                                <div 
                                  key={sameMarker.id} 
                                  className={`text-xs p-1.5 rounded border ${selectedMarker?.id === sameMarker.id ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-100'}`}
                                  onClick={() => handleSelectMarker(sameMarker)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                      {findGridById(sameMarker.gridId)?.name || 'Unknown grid'}
                                    </span>
                                  </div>
                                  <div className="text-gray-500 mt-1">
                                    Column {sameMarker.columnNumber}, Row {sameMarker.rowNumber}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-600 mb-4 flex items-center text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Primary Location
                      </h4>
                      
                      <div>
                        {selectedMarker.gridId && 
                          findGridById(selectedMarker.gridId) && (
                            <GridComponent
                              grid={findGridById(selectedMarker.gridId)!}
                              highlightedMarker={selectedMarker}
                              highlightedPosition={{
                                columnNumber: selectedMarker.columnNumber,
                                rowNumber: selectedMarker.rowNumber,
                              }}
                            />
                          )
                        }
                      </div>
                      
                      {/* Show other locations if there are any */}
                      {sameMarkers.length > 1 && (
                        <div className="mt-6">
                          <h4 className="text-lg font-semibold text-gray-600 mb-4 flex items-center text-gray-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Other Locations
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sameMarkers
                              .filter(marker => marker.id !== selectedMarker?.id)
                              .map(marker => (
                                <div 
                                  key={marker.id}
                                  className="p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
                                  onClick={() => handleSelectMarker(marker)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-primary-800">{findGridById(marker.gridId)?.name || 'Unknown grid'}</span>
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Position: Column {marker.columnNumber}, Row {marker.rowNumber}
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center py-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg text-gray-500">Select a marker from the list to view details</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {loading ? (
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-12 w-12 text-primary-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl text-gray-600">Searching markers...</p>
              </div>
            ) : searchQuery ? (
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xl text-gray-500 mb-2">No markers found</p>
                <p className="text-gray-400">Try a different search term or add a new marker</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xl text-gray-500 mb-2">Search for a marker to see results</p>
                <p className="text-gray-400">Enter marker number or color name above</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchMarkers;
