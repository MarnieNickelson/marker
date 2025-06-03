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

interface Marker {
  id: string;
  markerNumber: string;
  colorName: string;
  colorHex: string;
  brand?: {
    id: string;
    name: string;
  } | null;
  gridId?: string | null;
  grid?: {
    id: string;
    name: string;
  } | null;
  columnNumber?: number | null;
  rowNumber?: number | null;
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
  
  // New states for marker search and random colors
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Marker[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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

  // New function to handle marker search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const results = await fetchWithAuth<Marker[]>(`/api/markers/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(results || []);
      
      if (!results || results.length === 0) {
        toast.error('No markers found matching your search');
      }
    } catch (error) {
      toast.error('Failed to search markers');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Generate random colors
  const generateRandomColors = (count: number): PageItem[] => {
    const randomColors: PageItem[] = [];
    
    // Color name helper function
    const generateColorName = (hex: string): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      // Calculate HSL values for better naming
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const delta = max - min;
      
      // Calculate lightness
      const lightness = (max + min) / 2;
      let lightnessName = '';
      if (lightness < 0.2) lightnessName = 'Dark';
      else if (lightness > 0.8) lightnessName = 'Light';
      else if (lightness > 0.6) lightnessName = 'Bright';
      else if (lightness < 0.4) lightnessName = 'Deep';
      
      // Calculate hue
      let hue = 0;
      if (delta !== 0) {
        if (max === r / 255) {
          hue = ((g / 255 - b / 255) / delta) % 6;
        } else if (max === g / 255) {
          hue = (b / 255 - r / 255) / delta + 2;
        } else {
          hue = (r / 255 - g / 255) / delta + 4;
        }
      }
      hue = Math.round(hue * 60);
      if (hue < 0) hue += 360;
      
      // Determine color category based on hue
      let colorCategory = '';
      if (delta < 0.1) {
        colorCategory = lightness > 0.8 ? 'White' : lightness < 0.2 ? 'Black' : 'Gray';
      } else if (hue >= 0 && hue < 30) colorCategory = 'Red';
      else if (hue >= 30 && hue < 60) colorCategory = 'Orange';
      else if (hue >= 60 && hue < 90) colorCategory = 'Yellow';
      else if (hue >= 90 && hue < 150) colorCategory = 'Green';
      else if (hue >= 150 && hue < 210) colorCategory = 'Cyan';
      else if (hue >= 210 && hue < 270) colorCategory = 'Blue';
      else if (hue >= 270 && hue < 330) colorCategory = 'Purple';
      else colorCategory = 'Pink';
      
      return `${lightnessName} ${colorCategory}`.trim();
    };
    
    for (let i = 0; i < count; i++) {
      // Generate a random hex color
      const hexColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const colorName = generateColorName(hexColor);
      
      randomColors.push({
        id: `random-${Date.now()}-${i}`,
        markerNumber: `R${String(i + 1).padStart(3, '0')}`,
        colorName: colorName,
        colorHex: hexColor,
        brandName: 'Random',
        gridName: null,
        columnNumber: null,
        rowNumber: null,
        orderIndex: items.length + i,
        markerId: null
      });
    }
    
    return randomColors;
  };
  
  // Add random colors to the page
  const handleAddRandomColors = (count: number) => {
    const randomColors = generateRandomColors(count);
    setItems([...items, ...randomColors]);
    toast.success(`Added ${count} random colors`);
  };
  
  // Add a marker from search results to the page
  const handleAddMarker = (marker: Marker) => {
    const newItem: PageItem = {
      id: `new-${Date.now()}-${marker.id}`,
      markerNumber: marker.markerNumber,
      colorName: marker.colorName,
      colorHex: marker.colorHex,
      brandName: marker.brand?.name || null,
      gridName: marker.grid?.name || null,
      columnNumber: marker.columnNumber || null,
      rowNumber: marker.rowNumber || null,
      orderIndex: items.length,
      markerId: marker.id
    };
    
    setItems([...items, newItem]);
    toast.success(`Added ${marker.colorName}`);
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
              
              {/* Add colors actions */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {showSearch ? 'Hide Search' : 'Search Colors'}
                  </button>
                  <button
                    onClick={() => handleAddRandomColors(1)}
                    className="inline-flex items-center px-4 py-2 border border-purple-500 text-purple-500 rounded-md hover:bg-purple-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Add Random Color
                  </button>
                  <button
                    onClick={() => handleAddRandomColors(5)}
                    className="inline-flex items-center px-4 py-2 border border-indigo-500 text-indigo-500 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Add 5 Random Colors
                  </button>
                </div>
                
                {/* Search interface */}
                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-700 mb-2">Search for colors to add</h3>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search by name, number, hex color..."
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                              onClick={handleSearch}
                              disabled={isSearching}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                            >
                              {isSearching ? 'Searching...' : 'Search'}
                            </button>
                          </div>
                        </div>
                        
                        {searchResults.length > 0 ? (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium text-gray-600">Found {searchResults.length} markers</h4>
                              <span className="text-xs text-gray-500">Click on a color to add it</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto bg-gray-50 p-2 rounded-md">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {searchResults.map((marker) => (
                                  <div
                                    key={marker.id}
                                    className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                                    onClick={() => handleAddMarker(marker)}
                                  >
                                    <div
                                      className="w-10 h-10 mr-3 rounded-md shadow-sm"
                                      style={{ 
                                        backgroundColor: marker.colorHex,
                                        border: '1px solid rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      <div 
                                        className="w-full h-full flex items-center justify-center text-xs font-mono"
                                        style={{ color: getContrastingTextColor(marker.colorHex) }}
                                      >
                                        {marker.markerNumber}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center">
                                        <h4 className="font-bold text-gray-900 truncate">{marker.colorName}</h4>
                                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Picked</span>
                                      </div>
                                      <p className="text-sm text-gray-500 truncate">
                                        {marker.brand?.name || 'No brand'} · {marker.markerNumber}
                                        {marker.grid?.name && ` · ${marker.grid.name} ${marker.columnNumber},${marker.rowNumber}`}
                                      </p>
                                    </div>
                                    <button className="p-1 text-blue-500 hover:text-blue-700" title="Add to page">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          searchQuery && !isSearching && (
                            <div className="text-center py-4 bg-gray-50 rounded-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-gray-500">No markers found matching your search</p>
                              <p className="text-sm text-gray-400 mt-1">Try a different search term or add a random color</p>
                            </div>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
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
                      className="flex items-center p-4 border-b last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div 
                        className="w-12 h-12 mr-4 rounded-md shadow-inner"
                        style={{ 
                          backgroundColor: item.colorHex,
                          border: '1px solid rgba(0,0,0,0.1)'
                        }}
                      >
                        <div
                          className="w-full h-full flex items-center justify-center text-xs font-mono"
                          style={{ color: getContrastingTextColor(item.colorHex) }}
                        >
                          {item.markerNumber}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="font-bold">{item.colorName}</h3>
                          {item.markerId ? (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Picked</span>
                          ) : (
                            <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">Random</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {item.brandName || 'No brand'} · {item.markerNumber}
                          {item.gridName && ` · ${item.gridName} ${item.columnNumber},${item.rowNumber}`}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          title="Move up"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === items.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          title="Move down"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Remove color"
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
