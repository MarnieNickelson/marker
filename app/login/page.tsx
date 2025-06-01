'use client';

import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center p-4 text-gray-700">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const isPending = searchParams.get('pending') === 'true';

  // Show pending approval message if redirected from registration
  React.useEffect(() => {
    if (isPending) {
      toast.success("Registration successful! Your account is pending approval.");
    }
  }, [isPending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });
      
      if (!result?.ok) {
        // Check specific error messages
        if (result?.error && result.error.includes('pending approval')) {
          // Set pending approval state
          setPendingApproval(true);
          
          // Show a more detailed and helpful message for pending approval
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col`}
            >
              <div className="flex-1 p-4 border-t border-gray-200">
                <div className="flex items-start">
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-red-600">Account Not Yet Approved</p>
                    <p className="mt-1 text-sm text-gray-700">
                      Oops! It looks like your account is still pending approval. Our admin team will review your request soon and grant you access. Please check back later or contact support if you need immediate assistance.
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-b-lg px-4 py-3 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
                >
                  Got it
                </button>
              </div>
            </div>
          ), { duration: 8000 });
        } else {
          throw new Error(result?.error || 'Login failed');
        }
      }
      
      toast.success('Login successful!');
      setTimeout(() => {
        router.push(callbackUrl);
      }, 1000);
      router.refresh(); // Refresh to update authentication state
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      // Reset pending approval state if it's a different error
      setPendingApproval(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg"
      >
        <div className="flex flex-col items-center">
          <img
            src="/api/assets/logo"
            alt="Inkventory Logo"
            className="h-24 mb-6"
          />
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${pendingApproval ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary-600 hover:bg-primary-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing in...' : pendingApproval ? 'Account Pending Approval' : 'Sign in'}
            </button>
          </div>
          
          {pendingApproval && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-300 rounded-md">
              <h3 className="text-sm font-medium text-orange-800">Account Pending Approval</h3>
              <p className="mt-2 text-sm text-orange-700">
                Your account is awaiting administrator approval. You'll receive access once your account has been approved. 
                Please check back later or contact support if you need immediate assistance.
              </p>
            </div>
          )}
        </form>
        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-gray-600 hover:text-primary-500">
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
