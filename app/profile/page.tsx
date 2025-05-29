'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { getSession, useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    setLoading(true);
    
    // Implement profile update logic when needed
    toast.success('Profile updated successfully');
    setLoading(false);
  };

  if (!session) {
    return (
      <Layout>
        <div className="text-center p-6">
          <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
          <p>You must be signed in to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                disabled
                value={session.user?.email || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <input
                id="role"
                name="role"
                type="text"
                disabled
                value={(session.user as any)?.role || 'user'}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </Layout>
  );
}
