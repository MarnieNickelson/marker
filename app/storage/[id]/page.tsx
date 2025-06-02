'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Marker, SimpleStorage } from '../../types/marker';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

export default function StorageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storageId = params.id as string;
  
  const [storage, setStorage] = useState<SimpleStorage | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState<'markerNumber' | 'colorName' | 'brand'>('markerNumber');

  useEffect(() => {
    if (storageId) {
      fetchStorageData();
    }
  }, [storageId]);

  const fetchStorageData = async () => {
    try {
      setLoading(true);
      
      // Fetch storage details using raw query via existing API
      const storageResponse = await fetch(`/api/simple-storages/${storageId}`);
      if (!storageResponse.ok) {
        if (storageResponse.status === 404) {
          toast.error('Storage location not found');
          router.push('/storage');
          return;
        }
        throw new Error('Failed to fetch storage details');
      }
      const storageData = await storageResponse.json();
      setStorage(storageData);
      
      // Fetch markers in this storage directly from the API with filtering
      const markersResponse = await fetch(`/api/markers?simpleStorageId=${encodeURIComponent(storageId)}&includeGrid=true`);
      if (!markersResponse.ok) {
        throw new Error('Failed to fetch markers');
      }
      const storageMarkers = await markersResponse.json();
      setMarkers(storageMarkers);
      
    } catch (error) {
      console.error('Error fetching storage data:', error);
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Filter markers based on search input
  const filteredMarkers = markers.filter(marker => {
    if (!filterValue) return true;
    const lowerFilter = filterValue.toLowerCase();
    
    return (
      marker.markerNumber.toLowerCase().includes(lowerFilter) ||
      marker.colorName.toLowerCase().includes(lowerFilter) ||
      marker.brand?.name.toLowerCase().includes(lowerFilter)
    );
  });

  // Sort markers based on selected sort option
  const sortedMarkers = [...filteredMarkers].sort((a, b) => {
    if (sortBy === 'markerNumber') {
      return a.markerNumber.localeCompare(b.markerNumber);
    } else if (sortBy === 'colorName') {
      return a.colorName.localeCompare(b.colorName);
    } else if (sortBy === 'brand') {
      const brandNameA = a.brand?.name || '';
      const brandNameB = b.brand?.name || '';
      return brandNameA.localeCompare(brandNameB);
    }
    return 0;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!storage) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center min-h-screen">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Storage Not Found</h1>
          <button
            onClick={() => router.push('/storage')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Storage
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{storage.name}</h1>
              {storage.description && (
                <p className="text-gray-600 mt-2">{storage.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {markers.length} {markers.length === 1 ? 'marker' : 'markers'} stored here
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/storage')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Storage
              </button>
              <button
                onClick={() => router.push(`/add?simpleStorageId=${storageId}`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Marker Here
              </button>
            </div>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search markers by number, color, or brand..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="markerNumber">Marker Number</option>
                <option value="colorName">Color Name</option>
                <option value="brand">Brand</option>
              </select>
            </div>
          </div>
        </div>

        {/* Markers Grid */}
        {sortedMarkers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filterValue ? 'No matching markers found' : 'No markers in this storage'}
              </h3>
              <p className="text-gray-500 mb-6">
                {filterValue 
                  ? 'Try adjusting your search terms'
                  : 'Start by adding some markers to this storage location'
                }
              </p>
              {!filterValue && (
                <button
                  onClick={() => router.push(`/add?simpleStorageId=${storageId}`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add First Marker
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {sortedMarkers.map((marker) => (
                <motion.div
                  key={marker.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/markers?selected=${marker.id}`)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: marker.colorHex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {marker.markerNumber}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {marker.colorName}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">
                      Qty: {marker.quantity}
                    </span>
                    {marker.brand && (
                      <span className="text-gray-500 italic truncate ml-2">
                        {marker.brand.name}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  );
}
