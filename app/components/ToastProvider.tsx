'use client';

import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#fff',
          color: '#333',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '12px',
          borderRadius: '8px',
        },
        success: {
          style: {
            border: '1px solid rgba(14, 165, 233, 0.3)',
            background: 'rgba(224, 242, 254, 0.9)',
          },
          iconTheme: {
            primary: '#0ea5e9',
            secondary: '#fff',
          },
        },
        error: {
          style: {
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(254, 226, 226, 0.9)',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

export default ToastProvider;
