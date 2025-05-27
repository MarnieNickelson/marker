'use client';

import { useState, useEffect } from 'react';

export default function TestBrandsPage() {
  interface Brand {
    id: string;
    name: string;
  }

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrands() {
      try {
        setLoading(true);
        const response = await fetch('/api/brands');
        if (!response.ok) {
          throw new Error(`Failed to fetch brands: ${response.status}`);
        }
        const data = await response.json();
        setBrands(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching brands:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Brands API</h1>

      {loading && <p>Loading brands...</p>}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Brands ({brands.length})</h2>
          {brands.length === 0 ? (
            <p className="text-gray-500">No brands found</p>
          ) : (
            <ul className="space-y-2">
              {brands.map(brand => (
                <li key={brand.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{brand.name}</p>
                  <p className="text-xs text-gray-500">ID: {brand.id}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
