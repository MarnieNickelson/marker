'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Brand } from '../types/marker';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBrandName, setNewBrandName] = useState('');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch brands on component mount
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/brands');
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newBrandName.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create brand');
      }
      
      toast.success('Brand added successfully');
      setNewBrandName('');
      fetchBrands(); // Refresh the list
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editedName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editedName.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update brand');
      }
      
      toast.success('Brand updated successfully');
      setEditingBrand(null);
      fetchBrands(); // Refresh the list
    } catch (error) {
      console.error('Error updating brand:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startDelete = (brand: Brand) => {
    setDeletingId(brand.id);
    setShowConfirmDelete(true);
    setDeleteError('');
  };

  const cancelDelete = () => {
    setDeletingId(null);
    setShowConfirmDelete(false);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/brands/${deletingId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.markersCount) {
          setDeleteError(`Cannot delete: ${data.markersCount} marker(s) are using this brand.`);
          return;
        }
        throw new Error(data.error || 'Failed to delete brand');
      }
      
      toast.success('Brand deleted successfully');
      setShowConfirmDelete(false);
      setDeletingId(null);
      fetchBrands(); // Refresh the list
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setEditedName(brand.name);
  };

  const cancelEdit = () => {
    setEditingBrand(null);
  };

  return (
    <Layout>
      <motion.div 
        className="max-w-4xl mx-auto p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-primary-800 mb-6">Manage Brands</h1>
        
        {/* Add new brand form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Add New Brand</h2>
          <form onSubmit={handleCreateBrand} className="flex gap-4">
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Enter brand name"
              className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !newBrandName.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Brand'}
            </button>
          </form>
        </div>
        
        {/* Brands list */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Brand List</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : brands.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No brands added yet.</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {brands.map((brand) => (
                <div key={brand.id} className="py-4">
                  {editingBrand?.id === brand.id ? (
                    <form onSubmit={handleUpdateBrand} className="flex gap-2">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                        required
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSubmitting || !editedName.trim()}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSubmitting}
                          className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{brand.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(brand)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => startDelete(brand)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this brand? This action cannot be undone.
              </p>
              
              {deleteError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {deleteError}
                </div>
              )}
              
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isSubmitting || Boolean(deleteError)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
