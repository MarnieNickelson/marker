// Helper functions for API requests that handle authentication redirects
import { toast } from 'react-hot-toast';

// Type for API request options
interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
}

/**
 * Makes an API request and handles authentication errors
 * @param url The URL to make the request to
 * @param options Request options
 * @returns Response data or null if error
 */
export async function fetchWithAuth<T = any>(url: string, options: ApiOptions = {}): Promise<T | null> {
  try {
    // Set default options
    const defaultOptions: ApiOptions = {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Merge with provided options
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      }
    };
    
    // Add body if provided
    if (options.body) {
      requestOptions.body = JSON.stringify(options.body);
    }
    
    // Make the request
    const response = await fetch(url, requestOptions as RequestInit);
    
    // Check if we're being redirected to login page
    if (response.redirected && response.url.includes('/login')) {
      // We've been redirected to login - handle auth error
      toast.error('Please log in to continue');
      
      // Force reload to the login page if we're not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return null;
    }
    
    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }
    
    // Parse and return the data
    const data = await response.json() as T;
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to complete request');
    return null;
  }
}
