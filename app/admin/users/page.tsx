'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    grids: number;
    brands: number;
  };
};

type UserFormData = {
  name: string;
  role: string;
  isApproved: boolean;
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    role: 'user',
    isApproved: false
  });
  
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

  // Load users
  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'admin') {
      fetchUsers();
    }
  }, [status, session]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data: User[] = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        role: 'user',
        isApproved: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsDeleting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      return; // Should not happen
    }
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }
      
      toast.success('User updated');
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      
      toast.success('User deleted');
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  // Filter users based on search input
  const filteredUsers = users.filter(user => {
    if (!filterValue) return true;
    const lowerFilter = filterValue.toLowerCase();
    
    return (
      user.name.toLowerCase().includes(lowerFilter) ||
      user.email.toLowerCase().includes(lowerFilter) ||
      user.role.toLowerCase().includes(lowerFilter)
    );
  });

  // Get counts for user stats
  const pendingApprovalCount = users.filter(user => !user.isApproved).length;
  const adminCount = users.filter(user => user.role === 'admin').length;
  const regularUserCount = users.filter(user => user.role === 'user').length;
  
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
            <h1 className="text-3xl font-bold text-primary-800">User Management</h1>
            <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
          </div>
        </div>
        
        {/* User statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Total Users</h3>
              <span className="text-3xl font-bold text-primary-600">{users.length}</span>
            </div>
          </motion.div>
          
          <motion.div
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-amber-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Pending Approval</h3>
              <span className="text-3xl font-bold text-amber-600">{pendingApprovalCount}</span>
            </div>
          </motion.div>
          
          <motion.div
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Administrators</h3>
              <span className="text-3xl font-bold text-indigo-600">{adminCount}</span>
            </div>
          </motion.div>
        </div>
        
        {/* Search and filter controls */}
        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search users by name, email or role..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        
        {/* User list */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857M15 8a3 3 0 11-6 0 3 3 0 016 0zm6 2a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-xl text-gray-500 mb-4">No users found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        !user.isApproved ? 'bg-amber-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isApproved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {user.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleString() 
                            : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        {session?.user.id !== user.id && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleting(true);
                              setIsModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Edit User Modal */}
        <AnimatePresence>
          {isModalOpen && selectedUser && !isDeleting && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            >
              <motion.div 
                className="bg-white rounded-xl shadow-lg max-w-md w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Edit User: {selectedUser.name}
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={selectedUser.email}
                        className="block w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
                        disabled
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isApproved"
                          name="isApproved"
                          checked={formData.isApproved}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isApproved" className="ml-2 block text-sm text-gray-700">
                          Approved
                        </label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {/* Delete User Confirmation */}
          {isModalOpen && selectedUser && isDeleting && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            >
              <motion.div 
                className="bg-white rounded-xl shadow-lg max-w-md w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 text-red-600">
                    Delete User
                  </h2>
                  
                  <p className="mb-4">
                    Are you sure you want to delete <strong>{selectedUser.name}</strong>?
                  </p>
                  
                  <p className="mb-4 text-sm text-gray-500">
                    This action cannot be undone. All data associated with this user will be permanently removed.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete User
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}
