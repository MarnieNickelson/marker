'use client';

import { useState, useEffect } from 'react';
import { Marker } from '../types/marker';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { fetchWithAuth } from '../utils/api';

interface ColorHistoryItem {
  id: string;
  markerNumber: string;
  colorName: string;
  colorHex: string;
  brandName: string | null;
  gridId: string | null;
  gridName: string | null;
  columnNumber: number | null;
  rowNumber: number | null;
  timestamp: Date;
  isRandom: boolean; // To distinguish between random and picked colors
}

export default function ColorPage() {
  const [currentColor, setCurrentColor] = useState<Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [colorHistory, setColorHistory] = useState<ColorHistoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<Marker[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Load color history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('colorHistory');
    console.log('Loading color history from localStorage:', savedHistory);
    
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // Convert string dates back to Date objects
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        console.log('Loaded color history:', historyWithDates);
        setColorHistory(historyWithDates);
      } catch (error) {
        console.error('Failed to parse color history from localStorage:', error);
      }
    } else {
      console.log('No color history found in localStorage');
    }
  }, []);
  
  // Helper function to add a marker to history
  const addMarkerToHistory = (marker: Marker, isRandom: boolean) => {
    console.log('Adding marker to history:', marker, 'isRandom:', isRandom);
    setCurrentColor(marker);
    
    // Add to history
    const historyItem: ColorHistoryItem = {
      id: marker.id,
      markerNumber: marker.markerNumber,
      colorName: marker.colorName,
      colorHex: marker.colorHex,
      brandName: marker.brand?.name || null,
      gridId: marker.gridId,
      gridName: marker.grid?.name || null,
      columnNumber: marker.columnNumber,
      rowNumber: marker.rowNumber,
      timestamp: new Date(),
      isRandom: isRandom
    };
    
    const updatedHistory = [historyItem, ...colorHistory];
    console.log('Updated history will be:', updatedHistory);
    setColorHistory(updatedHistory);
    
    // Save to localStorage
    localStorage.setItem('colorHistory', JSON.stringify(updatedHistory));
    console.log('Saved to localStorage');
    
    const actionType = isRandom ? 'Random' : 'Selected';
    toast.success(`${actionType} color: ${marker.colorName}`);
  };

  // Get a random color from the user's inventory
  const getRandomColor = async () => {
    try {
      setLoading(true);
      
      // Get the IDs of markers already in history to exclude them
      const existingIds = colorHistory.map(item => item.id);
      const excludeParam = existingIds.length > 0 
        ? `?exclude=${encodeURIComponent(existingIds.join(','))}` 
        : '';
      
      const marker = await fetchWithAuth<Marker>(`/api/markers/random${excludeParam}`);
      
      if (marker) {
        addMarkerToHistory(marker, true);
      }
    } catch (error) {
      toast.error('Failed to get random color. Check if you have markers in your inventory.');
    } finally {
      setLoading(false);
    }
  };
  
  // Pick a color by its number or name
  const pickColorByNumber = async () => {
    const inputElement = document.getElementById('colorNumberInput') as HTMLInputElement;
    const searchTerm = inputElement?.value;
    
    if (!searchTerm || searchTerm.trim() === '') {
      toast.error('Please enter a color number or name');
      return;
    }
    
    try {
      setSearchLoading(true);
      const searchParams = new URLSearchParams({ 
        q: searchTerm.trim(),
        includeGrid: 'true'
      });
      const markers = await fetchWithAuth<Marker[]>(`/api/markers/search?${searchParams}`);
      
      if (!markers || markers.length === 0) {
        toast.error(`No markers found matching "${searchTerm}"`);
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      
      if (markers.length === 1) {
        // Use the single match directly
        const marker = markers[0];
        addMarkerToHistory(marker, false);
        
        // Clear the input and search results
        inputElement.value = '';
        setSearchResults([]);
        setShowSearchResults(false);
        
        toast.success(`Found and added: ${marker.colorName}`);
      } else {
        // Show multiple results for user to choose from
        setSearchResults(markers);
        setShowSearchResults(true);
        toast.success(`Found ${markers.length} matches. Select one to add.`);
      }
      
    } catch (error) {
      toast.error('Failed to search for colors');
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  // Select a marker from search results
  const selectMarkerFromResults = (marker: Marker) => {
    addMarkerToHistory(marker, false);
    
    // Clear the input and search results
    const inputElement = document.getElementById('colorNumberInput') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
    setSearchResults([]);
    setShowSearchResults(false);
    
    toast.success(`Added: ${marker.colorName}`);
  };

  // Cancel color selection
  const cancelColorSelection = () => {
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Clear color history
  const clearHistory = () => {
    setColorHistory([]);
    // Also clear from localStorage
    localStorage.removeItem('colorHistory');
    toast.success('Color history cleared');
  };

  // Save page dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [savingPage, setSavingPage] = useState(false);
  
  // Open save page dialog
  const openSavePageDialog = () => {
    if (colorHistory.length === 0) {
      toast.error('Add colors to your history before saving a page');
      return;
    }
    setSaveDialogOpen(true);
    setPageTitle('');
    setPageDescription('');
  };
  
  // Close save page dialog
  const closeSavePageDialog = () => {
    setSaveDialogOpen(false);
  };
  
  // Save the current color history as a page
  const savePage = async () => {
    if (!pageTitle.trim()) {
      toast.error('Please enter a title for your page');
      return;
    }
    
    // Debug: Check what we're sending
    console.log('Saving page with data:', {
      title: pageTitle,
      description: pageDescription.trim() || null,
      items: colorHistory,
      itemsLength: colorHistory.length
    });
    
    if (colorHistory.length === 0) {
      toast.error('No colors in history to save. Please pick some colors first.');
      return;
    }
    
    try {
      setSavingPage(true);
      
      const requestData = {
        title: pageTitle,
        description: pageDescription.trim() || null,
        items: colorHistory
      };
      
      console.log('Request data:', requestData);
      
      const response = await fetchWithAuth('/api/pages', {
        method: 'POST',
        body: requestData  // Don't stringify here - fetchWithAuth will do it
      });
      
      toast.success('Page saved successfully!');
      closeSavePageDialog();
      
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Failed to save page');
    } finally {
      setSavingPage(false);
    }
  };

  // Determine text color based on background color for readability
  const getContrastingTextColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  // Function to determine color family from hex code
  const getColorFamily = (hex: string): string => {
    // Remove # if present and validate hex format
    hex = hex.replace(/^#/, '');
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return 'unknown';
    }

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Find max and min values for RGB
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Calculate lightness
    const lightness = (max + min) / 2;
    
    // Calculate saturation
    let saturation = 0;
    if (max !== min) {
      saturation = lightness > 0.5 
        ? (max - min) / (2 - max - min) 
        : (max - min) / (max + min);
    }
    
    // Calculate hue
    let hue = 0;
    if (max !== min) {
      if (max === r) {
        hue = (g - b) / (max - min) + (g < b ? 6 : 0);
      } else if (max === g) {
        hue = (b - r) / (max - min) + 2;
      } else {
        hue = (r - g) / (max - min) + 4;
      }
      hue *= 60;
    }
    
    // Determine color family based on hue, saturation, and lightness
    if (saturation < 0.1) {
      if (lightness < 0.15) return 'black';
      if (lightness > 0.85) return 'white';
      return 'gray';
    }
    
    // Color families based on hue ranges
    if (hue < 15) return 'red';
    if (hue < 45) return 'orange';
    if (hue < 75) return 'yellow';
    if (hue < 165) return 'green';
    if (hue < 195) return 'cyan';
    if (hue < 255) return 'blue';
    if (hue < 285) return 'purple';
    if (hue < 345) return 'pink';
    return 'red'; // 345-360 is red again
  };

  // Get a random color from a specific color family
  const getRandomColorByFamily = async (family: string) => {
    try {
      setLoading(true);
      
      // Get the IDs of markers already in history to exclude them
      const existingIds = colorHistory.map(item => item.id);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (existingIds.length > 0) {
        params.append('exclude', existingIds.join(','));
      }
      params.append('colorFamily', family);
      
      const marker = await fetchWithAuth<Marker>(`/api/markers/random?${params.toString()}`);
      
      if (marker) {
        addMarkerToHistory(marker, true);
        toast.success(`Random ${family} color: ${marker.colorName}`);
      } else {
        toast.error(`No ${family} colors found in your inventory`);
      }
    } catch (error) {
      toast.error(`Failed to get random ${family} color. Check your inventory.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold mb-6">Color</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Color Picker</h2>
            <p className="mb-4 text-gray-600">
              Search for a specific color by number or name, or get a random color from your marker inventory.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-grow">
                    <input 
                      type="text" 
                      placeholder="Search by color number or name (e.g., Y3, Canary Yellow)..."
                      id="colorNumberInput"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          pickColorByNumber();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <button 
                      onClick={pickColorByNumber}
                      disabled={searchLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-400"
                    >
                      {searchLoading ? 'Searching...' : 'Search & Add'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="md:w-1/3">
                <button 
                  onClick={getRandomColor}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-400"
                >
                  {loading ? 'Selecting...' : 'Random Color'}
                </button>
              </div>
            </div>
            
            {/* Color Family Random Buttons */}
            <div className="mt-4">
              <h3 className="text-md font-medium mb-3">Random Color by Family:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
                <button 
                  onClick={() => getRandomColorByFamily('red')}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Red
                </button>
                <button 
                  onClick={() => getRandomColorByFamily('orange')}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Orange
                </button>
                <button 
                  onClick={() => getRandomColorByFamily('yellow')}
                  disabled={loading}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Yellow
                </button>
                <button 
                  onClick={() => getRandomColorByFamily('green')}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Green
                </button>
                <button 
                  onClick={() => getRandomColorByFamily('cyan')}
                  disabled={loading}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Cyan
                </button>
                <button 
                  onClick={() => getRandomColorByFamily('blue')}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Blue
                </button>
                <button 
                  onClick={() => getRandomColorByFamily('purple')}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Purple
                </button>
                <button 
                  onClick={() => getRandomColorByFamily('pink')}
                  disabled={loading}
                  className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Pink
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                <button 
                  onClick={() => getRandomColorByFamily('gray')}
                  disabled={loading}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Gray
                </button>
                <button 
                  onClick={() => getRandomColorByFamily('black')}
                  disabled={loading}
                  className="bg-black hover:bg-gray-900 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Black
                </button>
                <button 
                  onClick={() => getRandomColorByFamily('white')}
                  disabled={loading}
                  className="bg-white hover:bg-gray-100 text-black border border-gray-300 font-medium py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  White
                </button>
              </div>
            </div>
            </div>
            
            {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <motion.div 
              className="bg-white rounded-lg shadow-md p-6 mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Select a Color</h3>
                <button 
                  onClick={cancelColorSelection}
                  className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Found {searchResults.length} matches. Click "Add" to select one:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((marker) => (
                  <motion.div
                    key={marker.id}
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div 
                      className="h-16 w-full"
                      style={{ 
                        backgroundColor: marker.colorHex,
                        color: getContrastingTextColor(marker.colorHex)
                      }}
                    >
                      <div className="h-full flex items-center justify-center">
                        <p className="font-bold text-sm">{marker.markerNumber}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-gray-800">{marker.colorName}</p>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {marker.brand?.name || 'No brand'}
                      </p>
                      <button
                        onClick={() => selectMarkerFromResults(marker)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Current Color Display - only show when not showing search results */}
          {currentColor && !showSearchResults && (
            <AnimatePresence>
              <motion.div 
                className="mb-8 bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-semibold mb-3">Selected Color</h3>
                <div 
                  className="w-full h-32 rounded-lg flex items-center justify-center mb-4"
                  style={{ 
                    backgroundColor: currentColor.colorHex,
                    color: getContrastingTextColor(currentColor.colorHex)
                  }}
                >                    <div className="text-center">
                    <p className="text-xl font-bold">{currentColor.colorName}</p>
                    <p className="text-sm mt-1">{currentColor.brand?.name || 'No brand'} {currentColor.markerNumber}</p>
                    {currentColor.gridId && (
                      <p className="text-sm mt-2">
                        Location: {currentColor.grid?.name || 'Unknown grid'} 
                        {currentColor.columnNumber !== null && currentColor.rowNumber !== null && 
                          ` (Column: ${currentColor.columnNumber}, Row: ${currentColor.rowNumber})`
                        }
                      </p>
                    )}
                    {currentColor.simpleStorageId && !currentColor.gridId && (
                      <p className="text-sm mt-2">
                        Location: {currentColor.simpleStorage?.name || 'Simple storage'}
                      </p>
                    )}
                    {!currentColor.gridId && !currentColor.simpleStorageId && (
                      <p className="text-sm mt-2 text-gray-500 italic">
                        Not stored in any location
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
          
          {/* Color History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Color History</h2>
              <div className="flex gap-2">
                {colorHistory.length > 0 && (
                  <>
                    <button 
                      onClick={openSavePageDialog}
                      className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Save as Page
                    </button>
                    <button 
                      onClick={clearHistory}
                      className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Clear History
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {colorHistory.length === 0 ? (
              <p className="text-gray-500 italic">No colors have been selected yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colorHistory.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div 
                      className="h-16 w-full"
                      style={{ backgroundColor: item.colorHex }}
                    ></div>
                    <div className="p-3">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold">{item.colorName}</p>
                        {item.isRandom ? (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Random</span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Picked</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                        <span>{item.brandName || 'No brand'} {item.markerNumber}</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <p className="font-medium text-gray-700">Location:</p>
                        <p className="text-gray-600">
                          {item.gridName ? (
                            <>
                              <a 
                                href={`/grids/overview?gridId=${item.gridId}`} 
                                className="underline hover:text-black transition-colors"
                              >
                                {item.gridName}
                              </a> • 
                              Column {item.columnNumber} • 
                              Row {item.rowNumber}
                            </>
                          ) : (
                            'No grid assigned'
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Save Page Dialog */}
      {saveDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Save Color Page</h2>
              
              <div className="mb-4">
                <label htmlFor="pageTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Page Title *
                </label>
                <input
                  type="text"
                  id="pageTitle"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a title for your color page"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="pageDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="pageDescription"
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a description for this color page"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeSavePageDialog}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePage}
                  disabled={savingPage || !pageTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {savingPage ? 'Saving...' : 'Save Page'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
