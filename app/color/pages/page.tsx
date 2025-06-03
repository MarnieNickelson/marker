'use client';

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '../../utils/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PageItem {
  colorHex: string;
  markerNumber: string;
}

interface Page {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    pageItems: number;
  };
  pageItems: PageItem[];
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean, text: string, x: number, y: number }>({
    visible: false,
    text: '',
    x: 0,
    y: 0
  });

  // Function to determine contrasting text color based on background
  const getContrastingTextColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth<Page[]>('/api/pages');
      if (data) {
        setPages(data);
      }
    } catch (error) {
      toast.error('Failed to fetch color pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await fetchWithAuth(`/api/pages/${id}`, {
        method: 'DELETE',
      });
      
      setPages(pages.filter(page => page.id !== id));
      toast.success('Page deleted successfully');
    } catch (error) {
      toast.error('Failed to delete page');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Shared tooltip for color swatches */}
        {tooltip.visible && (
          <div 
            className="fixed px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md pointer-events-none z-50"
            style={{ 
              left: `${tooltip.x}px`, 
              top: `${tooltip.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            {tooltip.text}
          </div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Color Pages</h1>
            <Link 
              href="/color"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Create New Page
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : pages.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2">No Color Pages Yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first color page by selecting colors and saving them as a collection.
              </p>
              <Link
                href="/color"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Go to Color Collect
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {pages.map((page) => (
                  <motion.div
                    key={page.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link href={`/color/pages/${page.id}`} className="block">
                      <div className="p-6 cursor-pointer">
                        <h3 className="text-xl font-semibold mb-2">{page.title}</h3>
                        {page.description && (
                          <p className="text-gray-600 mb-3 line-clamp-2">{page.description}</p>
                        )}
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{page._count?.pageItems || 0} colors</span>
                          <span>
                            {new Date(page.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Color Swatches */}
                        {page.pageItems && page.pageItems.length > 0 && (
                          <div className="mt-3 w-full">
                            {/* Using inline-block elements for more predictable layout */}
                            <div 
                              style={{
                                width: "100%",
                                lineHeight: 0, /* Remove space between rows */
                                fontSize: 0, /* Remove space between inline blocks */
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "1px" // Tiny gap between swatches
                              }}
                            >
                              {page.pageItems.map((item, index) => (
                                <div 
                                  key={index}
                                  style={{ 
                                    backgroundColor: item.colorHex,
                                    width: "8px", // Increased width to 8px
                                    height: "16px", // Increased height to 16px
                                    position: "relative"
                                  }}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltip({
                                      visible: true,
                                      text: item.markerNumber, // Remove the # symbol
                                      x: rect.left + window.scrollX + 4, // Center on the swatch
                                      y: rect.top + window.scrollY - 25
                                    });
                                  }}
                                  onMouseLeave={() => {
                                    setTooltip(prev => ({ ...prev, visible: false }));
                                  }}
                                >
                                  <div 
                                    style={{
                                      position: "absolute",
                                      inset: 0,
                                      opacity: 0,
                                      transition: "opacity 0.15s ease"
                                    }}
                                    className="hover:opacity-100 ring-1 ring-white z-10"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2 border-t">
                      <Link
                        href={`/color/pages/${page.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(page.id)}
                        disabled={deletingId === page.id}
                        className="text-red-600 hover:text-red-800 font-medium text-sm disabled:opacity-50"
                      >
                        {deletingId === page.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
