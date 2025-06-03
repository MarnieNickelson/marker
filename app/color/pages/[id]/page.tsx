'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '../../../utils/api';
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

export default function PageView({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth<PageData>(`/api/pages/${params.id}`);
      if (data) {
        setPage(data);
      }
    } catch (error) {
      setError('Failed to load page. It may have been deleted or you may not have access to it.');
      toast.error('Failed to load page');
    } finally {
      setLoading(false);
    }
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
          ) : page ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{page.title}</h1>
                  {page.description && (
                    <p className="text-gray-600 mt-2">{page.description}</p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Link
                    href={`/color/pages/${page.id}/edit`}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Edit Page
                  </Link>
                  <Link
                    href="/color/pages"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Back to Pages
                  </Link>
                </div>
              </div>

              {page.pageItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-500">This page has no colors yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  <AnimatePresence>
                    {page.pageItems.map((item) => (
                      <motion.div
                        key={item.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div 
                          className="relative w-full" 
                          style={{ 
                            backgroundColor: item.colorHex,
                            padding: "2rem 1rem"
                          }}
                        >
                          <div className="text-center"
                            style={{ 
                              color: getContrastingTextColor(item.colorHex)
                            }}
                          >
                            <h3 className="font-bold text-lg mb-1">{item.colorName}</h3>
                            <p className="text-sm">
                              {item.brandName || 'No brand'} · {item.markerNumber}
                            </p>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium text-gray-700">Location:</p>
                            {item.markerId ? (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Picked</span>
                            ) : (
                              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">Random</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {item.gridName 
                              ? `${item.gridName} · Column ${item.columnNumber} · Row ${item.rowNumber}`
                              : 'No location information'
                            }
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          ) : null}
        </motion.div>
      </div>
    </Layout>
  );
}
