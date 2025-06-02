'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '../../../../utils/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PageItem {
  id: string;
  markerNumber: string;
  colorName: string;
  colorHex: string;
  brandName: string | null;
  gridName: string | null;
  columnNumber: number | null;
  rowNumber: number | null;
  orderIndex: number;
  markerId: string | null;
}

interface PageData {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  pageItems: PageItem[];
}

export default function EditPageView({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<PageItem[]>([]);

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth<PageData>(`/api/pages/${params.id}`);
      if (data) {
        setPage(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setItems(data.pageItems);
      }
    } catch (error) {
      setError('Failed to load page. It may have been deleted or you may not have access to it.');
      toast.error('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for your page');
      return;
    }

    if (items.length === 0) {
      toast.error('Your page must have at least one color');
      return;
    }

    try {
      setSaving(true);
      console.log('🎨 Saving page with data:', {
        title,
        description: description.trim() || null,
        items
      });
      await fetchWithAuth(`/api/pages/${params.id}`, {
        method: 'PUT',
        body: {
          title,
          description: description.trim() || null,
          items
        },
      });
      
      toast.success('Page updated successfully');
      router.push(`/color/pages/${params.id}`);
    } catch (error) {
      toast.error('Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === items.length - 1)) {
      return;
    }
    
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
  };

  // Function to determine contrasting text color based on background
  const getContrastingTextColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-lg shadow text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-red-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2 text-red-700">Page Not Found</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <Link
                href="/color/pages"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Back to Pages
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Edit Color Page</h1>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <Link
                    href={`/color/pages/${params.id}`}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="mb-6">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Page Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a title for your color page"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a description for this color page"
                  ></textarea>
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-4">Colors</h2>
              {items.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <p className="text-yellow-700 mb-4">
                    This page has no colors. Add colors using color collect.
                  </p>
                  <Link 
                    href="/color"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                  >
                    Go to Color Collect
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md">
                  {items.map((item, index) => (
                    <div 
                      key={`${item.id}-${index}`}
                      className="flex items-center p-4 border-b last:border-0"
                    >
                      <div 
                        className="w-12 h-12 mr-4 rounded"
                        style={{ backgroundColor: item.colorHex }}
                      ></div>
                      
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="font-semibold">{item.colorName}</h3>
                          <span className="ml-2 text-sm text-gray-500">{item.colorHex}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {item.brandName || 'No brand'} · #{item.markerNumber}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === items.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
