'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type PendingUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function PendingApprovalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role !== 'admin') {
        toast.error('Admin access required');
        router.push('/');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  // Load pending approval users
  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'admin') {
      fetchPendingUsers();
    }
  }, [status, session]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      // Filter to only pending approval users
      const pending = data.filter((user: any) => !user.isApproved);
      setPendingUsers(pending);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isApproved: true
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve user');
      }
      
      toast.success('User approved successfully');
      // Remove from list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve user');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    setProcessingIds(prev => new Set(prev).add(userId));
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      
      toast.success('User rejected and deleted');
      // Remove from list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };
  
  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (status === 'authenticated' && session.user.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">You don't have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-800">Pending Approvals</h1>
            <p className="text-gray-600 mt-1">Approve or reject user registration requests</p>
          </div>
          <div>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back to Users
            </button>
          </div>
        </div>
        
        {pendingUsers.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-green-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Pending Approvals</h2>
            <p className="text-gray-500">All user registrations have been processed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingUsers.map(user => (
              <motion.div
                key={user.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-amber-200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-5 bg-amber-50 border-b border-amber-100">
                  <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-500 mb-4">
                    Registered on {new Date(user.createdAt).toLocaleDateString()} at {new Date(user.createdAt).toLocaleTimeString()}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={processingIds.has(user.id)}
                      className={`flex-1 py-2 px-4 rounded-lg flex justify-center items-center ${
                        processingIds.has(user.id)
                          ? 'bg-green-100 text-green-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {processingIds.has(user.id) ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing
                        </span>
                      ) : (
                        <span>Approve</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      disabled={processingIds.has(user.id)}
                      className={`flex-1 py-2 px-4 rounded-lg flex justify-center ${
                        processingIds.has(user.id)
                          ? 'bg-red-100 text-red-400 cursor-not-allowed'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {processingIds.has(user.id) ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing
                        </span>
                      ) : (
                        <span>Reject</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
