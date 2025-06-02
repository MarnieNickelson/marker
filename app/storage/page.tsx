'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { fetchWithAuth } from '../utils/api';

interface SimpleStorage {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export default function StoragePage() {
  const router = useRouter();
  const [storages, setStorages] = useState<SimpleStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStorage, setEditingStorage] = useState<SimpleStorage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Fetch storages
  useEffect(() => {
    fetchStorages();
  }, []);

  const fetchStorages = async () => {
    try {
      const data = await fetchWithAuth<SimpleStorage[]>('/api/simple-storages');
      if (data) {
        setStorages(data);
      }
    } catch (error) {
      console.error('Error fetching storages:', error);
      toast.error('Failed to load simple storages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const data = await fetchWithAuth('/api/simple-storages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: formData,
      });

      if (data) {
        toast.success('Simple storage created successfully!');
        setFormData({ name: '', description: '' });
        setShowForm(false);
        fetchStorages(); // Refresh the list
      } else {
        throw new Error('Failed to create storage');
      }
    } catch (error: any) {
      console.error('Error creating storage:', error);
      toast.error(error.message || 'Failed to create storage');
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (storage: SimpleStorage) => {
    setEditingStorage(storage);
    setFormData({
      name: storage.name,
      description: storage.description || '',
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingStorage(null);
    setFormData({ name: '', description: '' });
    setShowForm(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStorage) return;
    
    setEditing(true);

    try {
      const data = await fetchWithAuth('/api/simple-storages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          id: editingStorage.id,
          ...formData,
        },
      });

      if (data) {
        toast.success('Simple storage updated successfully!');
        handleCancelEdit();
        fetchStorages(); // Refresh the list
      } else {
        throw new Error('Failed to update storage');
      }
    } catch (error: any) {
      console.error('Error updating storage:', error);
      toast.error(error.message || 'Failed to update storage');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (storage: SimpleStorage) => {
    if (!confirm(`Are you sure you want to delete "${storage.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(storage.id);

    try {
      const data = await fetchWithAuth(`/api/simple-storages?id=${storage.id}`, {
        method: 'DELETE',
      });

      if (data) {
        toast.success('Simple storage deleted successfully!');
        fetchStorages(); // Refresh the list
      } else {
        throw new Error('Failed to delete storage');
      }
    } catch (error: any) {
      console.error('Error deleting storage:', error);
      toast.error(error.message || 'Failed to delete storage');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto p-6"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simple Storage</h1>
          <p className="text-gray-600">
            Manage your simple storage locations for markers that don't need specific grid coordinates.
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showForm ? 'Cancel' : 'Add New Storage'}
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <form onSubmit={editingStorage ? handleUpdate : handleSubmit} className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-xl font-semibold mb-4">
                {editingStorage ? 'Edit Simple Storage' : 'Create New Simple Storage'}
              </h2>
              
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="e.g., Drawer A, Storage Box 1"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Additional details about this storage location"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating || editing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {editingStorage 
                    ? (editing ? 'Updating...' : 'Update Storage')
                    : (creating ? 'Creating...' : 'Create Storage')
                  }
                </button>
                <button
                  type="button"
                  onClick={editingStorage ? handleCancelEdit : () => setShowForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="space-y-4">
          {storages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Simple Storages</h3>
              <p className="text-gray-500 mb-4">
                You haven't created any simple storage locations yet.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create Your First Storage
              </button>
            </div>
          ) : (
            storages.map((storage) => (
              <motion.div
                key={storage.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{storage.name}</h3>
                    {storage.description && (
                      <p className="text-gray-600 mb-3">{storage.description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Created: {new Date(storage.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/storage/${storage.id}`)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(storage)}
                      disabled={deleting === storage.id}
                      className="text-blue-600 hover:text-blue-800 disabled:text-blue-400 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(storage)}
                      disabled={deleting === storage.id}
                      className="text-red-600 hover:text-red-800 disabled:text-red-400 text-sm font-medium"
                    >
                      {deleting === storage.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
