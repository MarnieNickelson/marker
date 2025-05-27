'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import MarkerForm from '../components/MarkerForm';
import Layout from '../components/Layout';
import { Grid } from '../types/marker';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

function AddMarkerPageContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchGrids = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/grids');
        if (!response.ok) {
          throw new Error('Failed to load grids');
        }
        const data = await response.json();
        setGrids(data);
      } catch (error) {
        console.error('Error loading grids:', error);
        toast.error('Failed to load storage grids');
      } finally {
        setLoading(false);
      }
    };

    fetchGrids();
  }, []);

  const handleMarkerAdded = () => {
    // Increment the key to refresh the component
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Add New Marker</h1>
      
      {searchParams.get('markerNumber') && (
        <div className="mb-6 p-4 bg-primary-50 border border-blue-200 rounded-lg">
          <h2 className="font-medium text-blue-800 mb-1">Adding Another Location</h2>
          <p className="text-sm text-blue-600">
            You&apos;re adding another location for marker <strong>{searchParams.get('markerNumber')}</strong> ({searchParams.get('colorName')}).
            The marker details have been pre-filled. Just select the grid and position.
          </p>
        </div>
      )}
      
      {!searchParams.get('markerNumber') && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 className="font-medium text-gray-800 mb-1">Organizing Your Markers</h2>
          <p className="text-sm text-gray-600">
            You can add the same marker (same marker number, color, and brand) in multiple locations. 
            The system will automatically track all instances as the same marker in different places.
          </p>
        </div>
      )}
      <div className="grid md:grid-cols-[1fr_330px] gap-6">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
            <p>Loading grid information...</p>
          </div>
        ) : (
          <MarkerForm 
            onMarkerAdded={handleMarkerAdded} 
            key={refreshKey} 
            grids={grids} 
            isAddingLocation={Boolean(searchParams.get('markerNumber'))}
          />
        )}
        
        <div className="order-first md:order-last">
          <motion.div 
            className="bg-white shadow-lg rounded-xl p-5 border border-primary-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-primary-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Storage Grid Info
            </h2>
            
            <div className="space-y-4">
              {loading ? (
                <p className="text-center py-4 text-gray-500">Loading grids...</p>
              ) : grids.length === 0 ? (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800">
                  <p>No storage grids have been created yet.</p>
                  <a href="/grids" className="underline font-medium text-primary-600 mt-2 block">Create storage grids</a>
                </div>
              ) : (
                <>
                  {grids.map((grid) => (
                    <div 
                      key={grid.id}
                      className="p-3 rounded-lg border border-gray-200 bg-primary-600"
                    >
                      <h3 className="font-medium text-white mb-1">{grid.name}</h3>
                      <div className="flex items-center text-sm text-white">
                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded mr-2">{grid.columns} columns</span> × 
                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded ml-2">{grid.rows} rows</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                    <p className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Enter the coordinates where the marker is stored.
                    </p>
                    <p className="ml-5 mt-1">Select a grid and specify the column and row number</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default function AddMarkerPage() {
  return (
    <Layout>
      <motion.div 
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Suspense fallback={
          <div className="p-8 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p>Loading page content...</p>
          </div>
        }>
          <AddMarkerPageContent />
        </Suspense>
      </motion.div>
    </Layout>
  );
}
