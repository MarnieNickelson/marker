'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import { Marker, Grid as GridType } from '../types/marker';
import GridComponent from '../components/Grid';
import Layout from '../components/Layout';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import MarkerEditForm from '../components/MarkerEditForm';
import SearchMarkers from '../components/SearchMarkers';

// Helper function to determine if text should be white or black based on background color
const getContrastingTextColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
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

// Wrapper component that uses useSearchParams
function MarkerPageContent() {
  const searchParams = useSearchParams();
  
  const [markers, setMarkers] = useState<Marker[]>([]);

  // Rest of the component implementation will go here
  const [grids, setGrids] = useState<GridType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState<'markerNumber' | 'colorName' | 'gridId' | 'brand' | 'grid' | 'storage'>('markerNumber');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sameMarkers, setSameMarkers] = useState<Marker[]>([]);
  const [loadingSameMarkers, setLoadingSameMarkers] = useState(false);
  const [colorFamilyFilter, setColorFamilyFilter] = useState<string | null>(null);
  
  // Color families for filtering
  const colorFamilies = [
    { name: 'All', value: '', bgClass: 'bg-gradient-to-r from-red-500 via-blue-500 to-green-500', textClass: 'text-white' },
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

  // Get URL params on load
  useEffect(() => {
    const colorFamily = searchParams.get('colorFamily');
    const markerId = searchParams.get('marker');
    
    if (colorFamily) {
      setColorFamilyFilter(colorFamily);
      setFilterValue(''); // Clear any text filter when using color family
      
      // If a specific marker ID was also requested, pass it to fetchData
      if (markerId) {
        fetchData(markerId, colorFamily);
      } else {
        fetchData(undefined, colorFamily);
      }
    } else {
      if (markerId) {
        // We'll handle this after loading markers
        fetchData(markerId);
      } else {
        // No specific marker requested, don't select anything by default
        fetchData();
      }
    }
  }, [searchParams]);

  const fetchData = async (markerId?: string, colorFamily?: string) => {
    try {
      setLoading(true);
      
      // Fetch grids
      const gridsResponse = await fetch('/api/grids');
      if (!gridsResponse.ok) {
        throw new Error('Failed to fetch grids');
      }
      const gridsData = await gridsResponse.json();
      setGrids(gridsData);
      
      // Fetch markers with grid and simple storage data
      let url = '/api/markers?includeGrid=true&includeSimpleStorage=true';
      
      // Add color family filter if specified
      if (colorFamily) {
        url += `&colorFamily=${encodeURIComponent(colorFamily.toLowerCase())}`;
      }
      
      console.log("Fetching from URL:", url);
      
      const markersResponse = await fetch(url);
      if (!markersResponse.ok) {
        throw new Error('Failed to fetch markers');
      }
      const markersData = await markersResponse.json();
      
      // Log if we got results
      console.log(`Got ${markersData.length} markers ${colorFamily ? `in ${colorFamily} color family` : ''}`);
      
      // Debug the first few markers when filtering by brown or black
      if (colorFamily === 'brown' || colorFamily === 'black') {
        console.log("Sample markers for", colorFamily, ":");
        markersData.slice(0, 3).forEach((marker: any) => {
          console.log(`- ${marker.colorName} (${marker.colorHex})`);
        });
      }
      
      setMarkers(markersData);
      
      if (markerId) {
        // If a specific marker ID was requested, select it
        const marker = markersData.find((m: Marker) => m.id === markerId);
        if (marker) {
          handleSelectMarker(marker);
        } else {
          toast.error("The requested marker could not be found");
        }
      } else {
        // Don't automatically select the first marker
        setSelectedMarker(null);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch locations for a marker
  const fetchMarkerLocations = async (marker: Marker) => {
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
  
  const handleSelectMarker = async (marker: Marker) => {
    setSelectedMarker(marker);
    setIsEditing(false);
    setDeleteConfirmOpen(false);
    
    // Fetch all markers with the same marker number, color, and brand
    fetchMarkerLocations(marker);
  };
  
  // Find the grid by ID
  const findGridById = (gridId: string | null) => {
    if (!gridId) return null;
    return grids.find(grid => grid.id === gridId);
  };
  
  // Helper function to get the storage name for display
  const getStorageLocationName = (marker: Marker) => {
    if (marker.gridId && marker.columnNumber !== null && marker.rowNumber !== null) {
      const grid = findGridById(marker.gridId);
      return grid ? `${grid.name} (${marker.columnNumber}, ${marker.rowNumber})` : 'Unknown grid';
    } else if (marker.simpleStorageId && marker.simpleStorage) {
      return marker.simpleStorage.name;
    } else {
      return 'Not stored';
    }
  };

  // Handle edit button click
  const handleEditClick = () => {
    setIsEditing(true);
    setDeleteConfirmOpen(false);
  };
  
  // Handle marker update
  const handleMarkerUpdated = async () => {
    await fetchData();
    setIsEditing(false);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirmClick = () => {
    setDeleteConfirmOpen(true);
    setIsEditing(false);
  };
  
  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
  };
  
  // Confirm and process delete
  const handleConfirmDelete = async () => {
    if (!selectedMarker) return;
    
    try {
      const response = await fetch(`/api/markers/${selectedMarker.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete marker');
      }
      
      toast.success('Marker deleted successfully');
      await fetchData();
      setDeleteConfirmOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/markers/export');
      
      if (!response.ok) {
        throw new Error('Failed to export markers');
      }
      
      // Get the CSV content
      const csvContent = await response.text();
      
      // Create a download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `markers-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Markers exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error((error as Error).message || 'Failed to export markers');
    }
  };
  
  // Clear selected marker when changing color family
  const handleColorFamilyChange = (value: string | null) => {
    setColorFamilyFilter(value);
    setSelectedMarker(null); // Clear the selected marker when changing color family
    if (value) {
      fetchData(undefined, value);
    } else {
      fetchData();
    }
  };

  // Filter markers based on search input and color family
  const filteredMarkers = markers.filter(marker => {
    // First apply text filter if any
    if (filterValue) {
      const lowerFilter = filterValue.toLowerCase();
      
      const gridName = findGridById(marker.gridId || '')?.name?.toLowerCase() || '';
      const simpleStorageName = marker.simpleStorage?.name?.toLowerCase() || '';
      
      const matchesText = (
        marker.markerNumber.toLowerCase().includes(lowerFilter) ||
        marker.colorName.toLowerCase().includes(lowerFilter) ||
        marker.colorHex.toLowerCase().includes(lowerFilter) ||
        (marker.brand?.name && marker.brand.name.toLowerCase().includes(lowerFilter)) ||
        gridName.includes(lowerFilter) ||
        simpleStorageName.includes(lowerFilter)
      );
      
      if (!matchesText) return false;
    }
    
    // Color family filtering is now handled by the API endpoint
    // We don't need to do client-side filtering for color families anymore
    
    return true;
  });

  // Sort markers
  const sortedMarkers = [...filteredMarkers].sort((a, b) => {
    switch (sortBy) {
      case 'colorName':
        return a.colorName.localeCompare(b.colorName);
      case 'markerNumber':
        return a.markerNumber.localeCompare(b.markerNumber);
      case 'brand':
        const brandA = a.brand?.name || '';
        const brandB = b.brand?.name || '';
        return brandA.localeCompare(brandB);
      case 'grid':
        const gridA = findGridById(a.gridId || '')?.name || '';
        const gridB = findGridById(b.gridId || '')?.name || '';
        return gridA.localeCompare(gridB);
      case 'storage': 
        return getStorageLocationName(a).localeCompare(getStorageLocationName(b));
      default:
        return 0;
    }
  });

  return (
    <Layout>
      <div className="mb-8">
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold mb-2 text-primary-800">Marker Inventory</h1>
          <p className="text-gray-600">
            Browse, search, and manage your marker collection. Filter by color family or search for specific markers.
          </p>
        </motion.div>
        
        {/* Search and Filter Section */}
        <div className="mb-8">
          <SearchMarkers onMarkerEdit={(marker) => {
            setSelectedMarker(marker);
            handleEditClick();
          }} />
        </div>
        
        {/* Color family filter buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold mb-3 text-primary-800">Browse by Color Family</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
            {colorFamilies.map((family, index) => (
              <button 
                key={index}
                onClick={() => handleColorFamilyChange(family.value || null)}
                disabled={loading}
                className={`${family.bgClass} ${family.textClass} font-medium py-2 px-3 rounded-md transition-colors duration-200 ${
                  (colorFamilyFilter === family.value || (!colorFamilyFilter && !family.value)) ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                }`}
              >
                {family.name}
              </button>
            ))}
          </div>
          
          {/* Selected Marker Display - only show when a marker is actually selected */}
          {selectedMarker && !isEditing && !deleteConfirmOpen && (
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
                    <p className="text-sm mt-1">{selectedMarker.brand?.name || 'No brand'} ~ {getColorFamily(selectedMarker.colorHex)}</p>
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
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Browse by Color Family Markers List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-8"
        >
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center">
                  <h2 className="text-lg font-bold">Markers</h2>
                  <span className="text-sm bg-gray-100 text-gray-700 ml-2 px-2 py-0.5 rounded-full">
                    {filteredMarkers.length}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="markerNumber">Sort by Number</option>
                    <option value="colorName">Sort by Color</option>
                    <option value="brand">Sort by Brand</option>
                    <option value="storage">Sort by Storage</option>
                  </select>
                  
                  <button
                    onClick={handleExportCSV}
                    title="Export to CSV"
                    className="text-gray-500 hover:text-primary-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Filter list..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-[600px] divide-y divide-gray-100">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading markers...
                  </div>
                ) : sortedMarkers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No markers found matching your criteria
                  </div>
                ) : (
                  sortedMarkers.map(marker => (
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
                        <div>
                          <p className="font-medium">
                            {marker.colorName} - {marker.markerNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {marker.brand?.name || 'No brand'} ~ {getColorFamily(marker.colorHex)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getStorageLocationName(marker)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMarker(marker);
                            handleEditClick();
                          }}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
                          title="Edit marker"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        
                        {selectedMarker?.id === marker.id && (
                          <span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {isEditing && selectedMarker ? (
              <div className="mt-6">
                <MarkerEditForm 
                  marker={selectedMarker!} 
                  onCancel={handleCancelEdit}
                  onSaved={handleMarkerUpdated}
                  grids={grids}
                />
              </div>
            ) : deleteConfirmOpen && selectedMarker ? (
              <div className="mt-6 bg-white rounded-lg border border-red-200 overflow-hidden p-6">
                <h3 className="text-xl font-bold text-red-600 mb-4">Confirm Deletion</h3>
                <p className="mb-6">
                  Are you sure you want to delete this marker?
                  <br />
                  <span className="font-semibold">{selectedMarker.colorName} - {selectedMarker.markerNumber}</span>
                  <br />
                  <span>{selectedMarker.brand?.name || 'No brand'} ~ {getColorFamily(selectedMarker.colorHex)}</span>
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmDelete}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Delete Marker
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
        </motion.div>
      </div>
    </Layout>
  );
}

// Main page component with Suspense boundary
export default function MarkersPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="text-center py-10">
          <div className="animate-pulse">
            <h1 className="text-2xl font-bold mb-4">Loading markers...</h1>
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    }>
      <MarkerPageContent />
    </Suspense>
  );
}
