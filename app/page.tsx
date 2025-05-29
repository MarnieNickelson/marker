'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
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
          <h1 className="text-3xl font-bold text-primary-800 mb-4">Welcome to Marker Tracker</h1>
          <p className="text-gray-600 max-w-3xl mb-4">
            Keep track of your markers and find them quickly in your storage grids. 
            This app helps you organize your markers by their number, color, brand, and exact storage location.
          </p>
        </motion.div>

        {isAuthenticated ? (
          <>
            <motion.div 
              className="flex flex-wrap gap-4 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Link
                href="/add"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Marker</span>
              </Link>
              <Link
                href="/markers"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>View Markers</span>
              </Link>
              <Link
                href="/grids"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Manage Storage Grids</span>
              </Link>
              <Link
                href="/import"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Bulk Import</span>
              </Link>
            </motion.div>

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
              You need to sign in to access the Marker Tracker features.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors shadow-md"
              >
                Register
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
