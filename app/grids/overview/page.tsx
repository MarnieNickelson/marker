'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/Layout';
import Grid from '../../components/Grid';
import toast from 'react-hot-toast';
import { Grid as GridType, Marker } from '../../types/marker';

export default function GridOverviewPage() {
  const [grids, setGrids] = useState<GridType[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrid, setSelectedGrid] = useState<string | null>(null);
  const [editingGrid, setEditingGrid] = useState<GridType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    columns: '15',
    rows: '12'
  });

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

  const handleOpenModal = (grid?: GridType) => {
    if (grid) {
      setEditingGrid(grid);
      setFormData({
        name: grid.name,
        columns: grid.columns.toString(),
        rows: grid.rows.toString()
      });
    } else {
      setEditingGrid(null);
      setFormData({
        name: '',
        columns: '15',
        rows: '12'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingGrid 
        ? `/api/grids/${editingGrid.id}` 
        : '/api/grids';
      
      const method = editingGrid ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save grid');
      }
      
      handleCloseModal();
      fetchData();
      toast.success(editingGrid ? 'Grid updated' : 'Grid created');
    } catch (error) {
      console.error('Error saving grid:', error);
      toast.error((error as Error).message);
    }
  };

  const handleDeleteGrid = async (grid: GridType) => {
    if (!confirm(`Are you sure you want to delete the grid "${grid.name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/grids/${grid.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete grid');
      }
      
      fetchData();
      toast.success('Grid deleted');
      
      // If the deleted grid was selected, select another grid if available
      if (selectedGrid === grid.id) {
        const remainingGrids = grids.filter(g => g.id !== grid.id);
        if (remainingGrids.length > 0) {
          setSelectedGrid(remainingGrids[0].id);
        } else {
          setSelectedGrid(null);
        }
      }
    } catch (error) {
      console.error('Error deleting grid:', error);
      toast.error((error as Error).message);
    }
  };

  // Group markers by their gridId
  const markersByGrid = markers.reduce((acc, marker) => {
    const gridId = marker.gridId;
    if (gridId && !acc[gridId]) {
      acc[gridId] = [];
    }
    if (gridId) {
      acc[gridId].push(marker);
    }
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
            <h1 className="text-3xl font-bold text-primary-800">Storage Grids</h1>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Grid
          </button>
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
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Your First Grid
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            {/* Grid selection sidebar */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 bg-primary-600 text-white">
                <h2 className="text-lg font-semibold">Grids</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {grids.map((grid) => {
                  const stats = getGridStats(grid.id);
                  return (
                    <div key={grid.id} className={`p-4 hover:bg-primary-50 transition-colors ${
                        selectedGrid === grid.id ? 'bg-primary-100 border-l-4 border-primary-600' : ''
                      }`}>
                      <div onClick={() => setSelectedGrid(grid.id)} className="cursor-pointer">
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
                      </div>
                      
                      {/* Action buttons */}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(grid);
                          }} 
                          className="p-1 text-gray-400 hover:text-primary-600"
                          title="Edit grid"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGrid(grid);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete grid"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
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

        {/* Edit Grid Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="fixed inset-0 bg-black opacity-30" onClick={handleCloseModal}></div>
              <motion.div
                className="bg-white rounded-lg shadow-lg max-w-sm w-full z-10"
                initial={{ y: "-30px", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-30px", opacity: 0 }}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingGrid ? 'Edit Grid' : 'Create New Grid'}
                  </h3>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grid Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Columns
                        </label>
                        <input
                          type="number"
                          name="columns"
                          value={formData.columns}
                          onChange={handleChange}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                          min="1"
                          max="24"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rows
                        </label>
                        <input
                          type="number"
                          name="rows"
                          value={formData.rows}
                          onChange={handleChange}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                          min="1"
                          max="24"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        {editingGrid ? 'Update Grid' : 'Create Grid'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
    header: isEven ? 'bg-primary-600 text-white' : 'bg-accent-600 text-white',
  };

  // Create grid template columns style - make it more responsive
  const gridTemplateColumns = `auto repeat(${grid.columns}, minmax(40px, 60px))`;

  return (
    <motion.div 
      className={`mt-4 rounded-xl overflow-hidden border ${gridColor.border} shadow-md`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className={`text-lg font-semibold text-white py-2 px-4 ${gridColor.header}`}>
        {grid.name}
      </h3>
      <div className="p-2">
        <div 
          className={`grid ${gridColor.bg} rounded-lg`}
          style={{ 
            gridTemplateColumns,
            maxWidth: '100%',
            minWidth: 'fit-content'
          }}
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
                    className={`h-12 w-12 border border-gray-200 flex items-center justify-center rounded-md m-0.5 transition-all hover:scale-105 tooltip-container`}
                  >
                    {marker ? (
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs relative"
                        style={{ 
                          backgroundColor: marker.colorHex,
                          color: getContrastTextColor(marker.colorHex)
                        }}
                      >
                        <span className="z-10 relative">{marker.markerNumber}</span>
                      </div>
                    ) : null}
                    <div className="tooltip">
                      {marker ? 
                        `${marker.markerNumber} - ${marker.colorName} (${marker.brand?.name || 'No brand'})` : 
                        `Position: ${col}, ${row}`
                      }
                    </div>
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