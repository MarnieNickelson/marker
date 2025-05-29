'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import SearchMarkers from './components/SearchMarkers';
import Layout from './components/Layout';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <Layout>
      <div className="mb-8">
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <img src="/inkventory-icon.png" alt="Inkventory Logo" className="h-12" />
            <h1 className="text-3xl font-bold text-primary-800">Welcome to Inkventory</h1>
          </div>
          <p className="text-gray-600 max-w-3xl mb-4">
            Keep track of your markers and find them quickly in your storage grids. 
            This app helps you organize your markers by their number, color, brand, and exact storage location.
          </p>
        </motion.div>

        {isAuthenticated ? (
          <>
            <SearchMarkers />
          </>
        ) : (
          <motion.div
            className="mt-12 p-8 bg-white rounded-lg shadow-lg text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-primary-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to access the Inkventory features.
            </p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
