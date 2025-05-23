'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Marker, Grid as GridType } from '../types/marker';
import GridComponent from '../components/Grid';
import Layout from '../components/Layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import MarkerEditForm from '../components/MarkerEditForm';

// Helper function to determine if text should be white or black based on background color
const getContrastingTextColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export default function MarkersPage() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [grids, setGrids] = useState<GridType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState<'markerNumber' | 'colorName' | 'gridId' | 'brand'>('markerNumber');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sameMarkers, setSameMarkers] = useState<Marker[]>([]);
  const [loadingSameMarkers, setLoadingSameMarkers] = useState(false);

  // Fetch markers and grids
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch grids
      const gridsResponse = await fetch('/api/grids');
      if (!gridsResponse.ok) {
        throw new Error('Failed to fetch grids');
      }
      const gridsData = await gridsResponse.json();
      setGrids(gridsData);
      
      // Fetch markers with grid data
      const markersResponse = await fetch('/api/markers?includeGrid=true');
      if (!markersResponse.ok) {
        throw new Error('Failed to fetch markers');
      }
      const markersData = await markersResponse.json();
      
      setMarkers(markersData);
      if (markersData.length > 0) {
        // Set the first marker as selected
        const firstMarker = markersData[0];
        setSelectedMarker(firstMarker);
        
        // Also fetch its locations
        fetchMarkerLocations(firstMarker);
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
      const response = await fetch(`/api/markers/locations?markerNumber=${encodeURIComponent(marker.markerNumber)}&colorName=${encodeURIComponent(marker.colorName)}&brand=${encodeURIComponent(marker.brand || '')}`);
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
  const findGridById = (gridId: string) => {
    return grids.find(grid => grid.id === gridId);
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

  // Filter markers based on search input
  const filteredMarkers = markers.filter(marker => {
    if (!filterValue) return true;
    const lowerFilter = filterValue.toLowerCase();
    
    const gridName = findGridById(marker.gridId)?.name?.toLowerCase() || '';
    
    return (
      marker.markerNumber.toLowerCase().includes(lowerFilter) ||
      marker.colorName.toLowerCase().includes(lowerFilter) ||
      marker.brand.toLowerCase().includes(lowerFilter) ||
      gridName.includes(lowerFilter)
    );
  });

  // Sort markers based on selected sort option
  const sortedMarkers = [...filteredMarkers].sort((a, b) => {
    if (sortBy === 'markerNumber') {
      return a.markerNumber.localeCompare(b.markerNumber);
    } else if (sortBy === 'colorName') {
      return a.colorName.localeCompare(b.colorName);
    } else if (sortBy === 'brand') {
      return a.brand.localeCompare(b.brand);
    } else {
      // Sort by grid name for gridId
      const gridNameA = findGridById(a.gridId)?.name || '';
      const gridNameB = findGridById(b.gridId)?.name || '';
      return gridNameA.localeCompare(gridNameB);
    }
  });
  
  // Custom color based on marker color name
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
    
    return 'bg-primary-100 text-primary-800 border-primary-200';
  };

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-between items-center mb-6">
          <motion.h1 
            className="text-3xl font-bold text-blue-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Markers
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Link
              href="/add"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Marker</span>
            </Link>
          </motion.div>
        </div>
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              className="flex justify-center items-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </motion.div>
          ) : markers.length === 0 ? (
            <motion.div 
              key="empty"
              className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-xl text-gray-600 mb-4">No markers found</p>
              <p className="text-gray-500 mb-6">Start by adding your first marker</p>
              <Link 
                href="/add" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Your First Marker</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter markers..."
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-500">
                      {filteredMarkers.length} {filteredMarkers.length === 1 ? 'marker' : 'markers'}
                    </p>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Sort by:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="text-sm border border-gray-200 rounded py-1 px-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                      >
                        <option value="markerNumber">Marker Number</option>
                        <option value="colorName">Color</option>
                        <option value="gridId">Grid</option>
                        <option value="brand">Brand</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[60vh] overflow-auto pr-1 space-y-2">
                  <AnimatePresence>
                    {sortedMarkers.map((marker) => (
                      <motion.div
                        key={marker.id}
                        className={`p-3 mt-1 mb-1 ml-1 cursor-pointer rounded-lg border transition-all ${
                          selectedMarker?.id === marker.id 
                            ? 'ring-2 ring-blue-500 border-blue-300 bg-primary-50' 
                            : 'hover:bg-gray-50 border-gray-50'
                        }`}
                        onClick={() => handleSelectMarker(marker)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.2 }}
                        layout
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-800">{marker.markerNumber}</p>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ 
                                backgroundColor: marker.colorHex,
                                border: '1px solid #e5e7eb'
                              }}
                            />
                            <span className="text-xs text-gray-600">
                              {marker.colorName}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs">
                          <span className="text-gray-500">
                            {findGridById(marker.gridId)?.name || 'Unknown grid'} ({marker.columnNumber}, {marker.rowNumber})
                          </span>
                          {marker.brand && (
                            <span className="text-gray-500 italic">{marker.brand}</span>
                          )}
                        </div>
                        {/* Quantity is now calculated from the number of same marker instances */}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {filteredMarkers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No markers match your filter</p>
                      <button 
                        onClick={() => setFilterValue('')}
                        className="text-blue-600 hover:text-blue-700 mt-2 text-sm"
                      >
                        Clear filter
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <AnimatePresence mode="wait">
                  {isEditing && selectedMarker ? (
                    <MarkerEditForm 
                      marker={selectedMarker}
                      onMarkerUpdated={handleMarkerUpdated}
                      onCancel={handleCancelEdit}
                      grids={grids}
                    />
                  ) : deleteConfirmOpen && selectedMarker ? (
                    <motion.div
                      key="delete-confirm"
                      className="bg-white p-6 rounded-xl shadow-lg border border-red-100"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-center">
                        <div className="bg-secondary-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Marker</h3>
                        <p className="text-gray-600 mb-1">Are you sure you want to delete marker:</p>
                        <p className="text-lg font-medium text-blue-700 mb-4">{selectedMarker.markerNumber} ({selectedMarker.colorName})</p>
                        <div className="flex justify-center gap-3 mt-6">
                          <button
                            onClick={handleCancelDelete}
                            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : selectedMarker ? (
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
                              />
                              <span className="text-gray-600">{selectedMarker.colorName}</span>
                            </div>
                            {selectedMarker.brand && (
                              <p className="mt-1 text-sm text-gray-500">Brand: {selectedMarker.brand}</p>
                            )}
                            <p className="text-sm text-blue-600 mt-2 font-medium">
                              Total Markers: {sameMarkers.length} {sameMarkers.length > 1 ? 'locations' : 'location'}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                            <p className="text-sm font-medium text-gray-800 mb-2">
                              Locations ({loadingSameMarkers ? '...' : sameMarkers.length})
                            </p>
                            
                            {loadingSameMarkers ? (
                              <div className="flex justify-center py-2">
                                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {sameMarkers.map((sameMarker) => (
                                  <div 
                                    key={sameMarker.id} 
                                    className={`text-xs p-1.5 rounded border ${selectedMarker?.id === sameMarker.id ? 'bg-primary-50 border-blue-200' : 'bg-white border-gray-100'}`}
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
                        <div className="mt-4 text-sm text-gray-500">
                          <p>Added: {new Date(selectedMarker.createdAt).toLocaleDateString()}</p>
                          <p>Last updated: {new Date(selectedMarker.updatedAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="mt-4 flex gap-2 pt-2">
                          <Link 
                            href={`/add?markerNumber=${encodeURIComponent(selectedMarker.markerNumber)}&colorName=${encodeURIComponent(selectedMarker.colorName)}&colorHex=${encodeURIComponent(selectedMarker.colorHex)}&brand=${encodeURIComponent(selectedMarker.brand || '')}`}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Another Location
                          </Link>
                          
                          <button 
                            onClick={handleEditClick}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-primary-50 border border-blue-200 rounded-md hover:bg-primary-100 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Marker
                          </button>
                          
                          <button 
                            onClick={handleDeleteConfirmClick}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-secondary-50 border border-red-200 rounded-md hover:bg-secondary-100 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-gray-600 mb-4 flex items-center text-gray-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          Primary Location
                        </h4>
                        
                        <div>
                          {selectedMarker && findGridById(selectedMarker.gridId) && (
                            <GridComponent
                              grid={findGridById(selectedMarker.gridId)!}
                              highlightedMarker={selectedMarker}
                              highlightedPosition={{
                                columnNumber: selectedMarker.columnNumber,
                                rowNumber: selectedMarker.rowNumber,
                              }}
                            />
                          )}
                        </div>
                        
                        {/* Show other locations if there are any */}
                        {sameMarkers.length > 1 && (
                          <div className="mt-6">
                            <h4 className="text-lg font-semibold text-gray-600 mb-4 flex items-center text-gray-800">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                    className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-primary-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedMarker(marker)}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-blue-800">{findGridById(marker.gridId)?.name || 'Unknown grid'}</span>
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
                      key="empty-selection"
                      className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center justify-center min-h-[300px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <p className="text-lg text-gray-500">Select a marker to view details</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}
