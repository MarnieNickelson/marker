'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Grid } from '../types/marker';

export default function GridsManagementPage() {
  const [grids, setGrids] = useState<Grid[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGrid, setEditingGrid] = useState<Grid | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    columns: '15',
    rows: '12'
  });

  useEffect(() => {
    fetchGrids();
  }, []);

  const fetchGrids = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/grids');
      if (!response.ok) {
        throw new Error('Failed to fetch grids');
      }
      const data = await response.json();
      setGrids(data);
    } catch (error) {
      console.error('Error fetching grids:', error);
      toast.error('Failed to load grids');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (grid?: Grid) => {
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
      fetchGrids();
      toast.success(editingGrid ? 'Grid updated' : 'Grid created');
    } catch (error) {
      console.error('Error saving grid:', error);
      toast.error((error as Error).message);
    }
  };

  const handleDeleteGrid = async (grid: Grid) => {
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
      
      fetchGrids();
      toast.success('Grid deleted');
    } catch (error) {
      console.error('Error deleting grid:', error);
      toast.error((error as Error).message);
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-800">Storage Grids</h1>
            <div className="flex mt-2 space-x-4">
              <a href="/grids" className="text-blue-600 font-medium border-b-2 border-blue-600">List View</a>
              <a href="/grids/overview" className="text-gray-500 font-medium hover:text-blue-600">Grid Overview</a>
            </div>
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
            <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : grids.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {grids.map(grid => (
              <motion.div
                key={grid.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`p-4 ${grid.id.charCodeAt(0) % 2 === 0 ? 'bg-primary-600' : 'bg-accent-600'} text-white flex justify-between items-center`}>
                  <h3 className="text-lg font-semibold text-white">{grid.name}</h3>
                  <span className="text-sm bg-white/20 px-2 py-0.5 rounded">
                    {grid.columns} x {grid.rows}
                  </span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(18px,1fr))] gap-1 mb-4">
                    {Array.from({ length: Math.min(grid.columns * grid.rows, 36) }).map((_, i) => (
                      <div key={i} className="w-[18px] h-[18px] bg-gray-100 rounded-sm"></div>
                    ))}
                    {grid.columns * grid.rows > 36 && (
                      <div className="w-full text-center text-xs text-gray-400 pt-2">
                        + {grid.columns * grid.rows - 36} more cells
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4 flex justify-between">
                    <div className="text-sm text-gray-500">
                      Created on {new Date(grid.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenModal(grid)}
                        className="p-1 text-gray-400 hover:text-primary-600"
                        title="Edit grid"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteGrid(grid)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete grid"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Grid Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            >
              <motion.div 
                className="bg-white rounded-xl shadow-lg max-w-md w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">
                    {editingGrid ? `Edit Grid: ${editingGrid.name}` : 'Create New Grid'}
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Grid Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                        required
                        placeholder="e.g. Left Shelf, Drawer 1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="columns" className="block text-sm font-medium text-gray-700 mb-1">
                          Columns
                        </label>
                        <input
                          type="number"
                          id="columns"
                          name="columns"
                          value={formData.columns}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                          required
                          min="1"
                          max="30"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="rows" className="block text-sm font-medium text-gray-700 mb-1">
                          Rows
                        </label>
                        <input
                          type="number"
                          id="rows"
                          name="rows"
                          value={formData.rows}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                          required
                          min="1"
                          max="30"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
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
