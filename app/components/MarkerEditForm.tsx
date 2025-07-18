import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Grid, Marker, Brand, SimpleStorage } from '../types/marker';
import { isColorInFamily } from '../utils/colorUtils';

interface MarkerEditFormProps {
  marker: Marker;
  onMarkerUpdated?: () => void; // Make it optional
  onSaved?: () => void; // Add this alternative prop
  onCancel: () => void;
  grids?: Grid[];
}

const MarkerEditForm: React.FC<MarkerEditFormProps> = ({ 
  marker, 
  onMarkerUpdated, 
  onSaved, // Add this new prop
  onCancel, 
  grids: providedGrids 
}) => {
  // Use either onMarkerUpdated or onSaved callback
  const handleUpdate = onMarkerUpdated || onSaved;

  const [grids, setGrids] = useState<Grid[]>(providedGrids || []);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [simpleStorages, setSimpleStorages] = useState<SimpleStorage[]>([]);
  const [originalColorHex, setOriginalColorHex] = useState(marker.colorHex); // Store original color hex
  
  // Color family options
  const colorFamilies = [
    { name: 'Auto (Detect from Color)', value: '' },
    { name: 'Red', value: 'red' },
    { name: 'Orange', value: 'orange' },
    { name: 'Yellow', value: 'yellow' },
    { name: 'Green', value: 'green' },
    { name: 'Cyan', value: 'cyan' },
    { name: 'Blue', value: 'blue' },
    { name: 'Purple', value: 'purple' },
    { name: 'Pink', value: 'pink' },
    { name: 'Brown', value: 'brown' },
    { name: 'Gray', value: 'gray' },
    { name: 'Black', value: 'black' },
    { name: 'White', value: 'white' }
  ];
  
  // Get auto-detected color family
  const getAutoColorFamily = (hex: string): string => {
    for (const family of colorFamilies.filter(f => f.value !== '')) {
      if (isColorInFamily(hex, family.value)) {
        return family.value;
      }
    }
    return 'unknown';
  };
  
  const [formData, setFormData] = useState({
    markerNumber: marker.markerNumber,
    colorName: marker.colorName,
    colorHex: marker.colorHex,
    colorFamily: marker.colorFamily || '', // Use stored color family or empty for auto
    brandId: marker.brandId || '', // Use brandId instead of brand
    storageType: marker.gridId ? 'grid' : 'simple',
    gridId: marker.gridId || '',
    columnNumber: String(marker.columnNumber || ''),
    rowNumber: String(marker.rowNumber || ''),
    simpleStorageId: marker.simpleStorageId || '',
  });
  
  // Get auto-detected color family for display
  const [autoColorFamily, setAutoColorFamily] = useState(getAutoColorFamily(formData.colorHex));

  // Update auto color family when hex changes
  useEffect(() => {
    setAutoColorFamily(getAutoColorFamily(formData.colorHex));
  }, [formData.colorHex]);
  
  const [loading, setLoading] = useState(false);
  const [loadingGrids, setLoadingGrids] = useState(!providedGrids);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingSimpleStorages, setLoadingSimpleStorages] = useState(true);

  // Fetch available grids if not provided
  useEffect(() => {
    if (providedGrids) {
      return;
    }
    
    const fetchGrids = async () => {
      try {
        const response = await fetch('/api/grids');
        if (!response.ok) {
          throw new Error('Failed to fetch grids');
        }
        const data = await response.json();
        setGrids(data);
      } catch (error) {
        console.error('Error fetching grids:', error);
        toast.error('Failed to load storage grids');
      } finally {
        setLoadingGrids(false);
      }
    };
    
    fetchGrids();
  }, [providedGrids]);

  // Fetch simple storage locations
  useEffect(() => {
    const fetchSimpleStorages = async () => {
      try {
        const response = await fetch('/api/simple-storages');
        if (!response.ok) {
          throw new Error('Failed to fetch simple storage locations');
        }
        const data = await response.json();
        setSimpleStorages(data);
      } catch (error) {
        console.error('Error fetching simple storage locations:', error);
        toast.error('Failed to load simple storage locations');
      } finally {
        setLoadingSimpleStorages(false);
      }
    };
    
    fetchSimpleStorages();
  }, []);

  // Fetch available brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands');
        if (!response.ok) {
          throw new Error('Failed to fetch brands');
        }
        const data = await response.json();
        setBrands(data);
      } catch (error) {
        console.error('Error fetching brands:', error);
        toast.error('Failed to load marker brands');
      } finally {
        setLoadingBrands(false);
      }
    };
    
    fetchBrands();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Update auto color family when hex color changes
    if (name === 'colorHex') {
      setAutoColorFamily(getAutoColorFamily(value));
    }
  };
  
  // Find current grid dimensions
  const currentGrid = grids.find(grid => grid.id === formData.gridId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Create a data object for API submission
    const apiData: any = {
      markerNumber: formData.markerNumber,
      colorName: formData.colorName,
      colorHex: formData.colorHex,
      colorFamily: formData.colorFamily || null, // Empty string will be sent as null for auto detection
      brandId: formData.brandId || undefined,
      storageType: formData.storageType,
    };
    
    if (formData.storageType === 'grid') {
      apiData.gridId = formData.gridId || undefined;
      apiData.columnNumber = parseInt(formData.columnNumber as string) || 1;
      apiData.rowNumber = parseInt(formData.rowNumber as string) || 1;
      apiData.simpleStorageId = null; // Clear simple storage when using grid
    } else {
      apiData.simpleStorageId = formData.simpleStorageId || undefined;
      apiData.gridId = null; // Clear grid data when using simple storage
      apiData.columnNumber = null;
      apiData.rowNumber = null;
    }
    
    const submitPromise = fetch(`/api/markers/${marker.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    })
    .then(async response => {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update marker');
      }
      
      // Update the original color hex after successful save
      setOriginalColorHex(formData.colorHex);
      
      handleUpdate?.();
      return 'Marker updated successfully!';
    })
    .finally(() => {
      setLoading(false);
    });
    
    // Show toast notification based on promise result
    toast.promise(submitPromise, {
      loading: 'Updating marker...',
      success: (message) => message,
      error: (err) => err.message,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow-lg border border-blue-100">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-blue-800 mb-1">Edit Marker</h2>
          <p className="text-gray-500 text-sm">Update the marker details below</p>
        </div>
        
        <div>
          <label htmlFor="markerNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Marker Number
          </label>
          <input
            type="text"
            id="markerNumber"
            name="markerNumber"
            value={formData.markerNumber}
            onChange={handleChange}
            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
            required
            placeholder="e.g. B328 or Y101"
          />
        </div>

        <div>
          <label htmlFor="colorName" className="block text-sm font-medium text-gray-700 mb-1">
            Color Name
          </label>
          <input
            type="text"
            id="colorName"
            name="colorName"
            value={formData.colorName}
            onChange={handleChange}
            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
            required
            placeholder="e.g. Light Prawn"
          />
        </div>

        {/* Color hex code */}
        <div>
          <label htmlFor="colorHex" className="block text-sm font-medium text-gray-700 mb-1">
            Color Hex Code
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="colorHex"
              name="colorHex"
              value={formData.colorHex}
              onChange={handleChange}
              className="h-10 w-10 rounded border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              name="colorHex"
              value={formData.colorHex}
              onChange={handleChange}
              className="block flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
              required
              placeholder="#FF0000"
              pattern="^#([A-Fa-f0-9]{6})$"
              title="Valid hex color code (e.g. #FF0000)"
            />
          </div>
          <div className="mt-1">
            <div className="flex items-center mt-2">
              <div 
                className="h-6 w-12 rounded-l" 
                style={{ backgroundColor: originalColorHex }}
              ></div>
              <div className="h-6 px-2 rounded-r bg-gray-100 text-xs flex items-center">
                <span className="font-medium">{formData.colorName}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Color Family Selection */}
        <div>
          <label htmlFor="colorFamily" className="block text-sm font-medium text-gray-700 mb-1">
            Color Family
          </label>
          <select
            id="colorFamily"
            name="colorFamily"
            value={formData.colorFamily}
            onChange={handleChange}
            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
          >
            {colorFamilies.map(family => (
              <option key={family.value} value={family.value}>
                {family.name}
              </option>
            ))}
          </select>
          {!formData.colorFamily && (
            <div className="mt-1 text-xs text-gray-500 flex items-center">
              <span>Auto-detected: </span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-white text-xs font-medium bg-blue-500">
                {autoColorFamily}
              </span>
            </div>
          )}
          {formData.colorFamily && (
            <div className="flex justify-end mt-1">
              <button 
                type="button" 
                onClick={() => setFormData({...formData, colorFamily: ''})}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Reset to auto-detection
              </button>
            </div>
          )}
        </div>

        {/* Brand field */}
        <div>
          <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          {loadingBrands ? (
            <div className="py-3 px-4 bg-gray-50 rounded-lg flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : brands.length === 0 ? (
            <div className="py-3 px-4 bg-secondary-50 text-red-700 rounded-lg border border-red-200">
              No brands available. Please create a brand first.
            </div>
          ) : (
            <div>
              <select
                id="brandId"
                name="brandId"
                value={formData.brandId}
                onChange={handleChange}
                className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
              >
                <option value="">Select a brand</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs text-blue-600">
                <a href="/brands" className="hover:underline">
                  Manage brands
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Storage Type Selection */}
        <div>
          <label htmlFor="storageType" className="block text-sm font-medium text-gray-700 mb-1">
            Storage Type
          </label>
          <select
            id="storageType"
            name="storageType"
            value={formData.storageType}
            onChange={handleChange}
            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
          >
            <option value="grid">Grid Storage</option>
            <option value="simple">Simple Storage</option>
          </select>
        </div>

        {formData.storageType === 'grid' ? (
          <>
            {/* Grid selection and position */}
            <div>
              <label htmlFor="gridId" className="block text-sm font-medium text-gray-700 mb-1">
                Storage Grid
              </label>
              {loadingGrids ? (
                <div className="py-3 px-4 bg-gray-50 rounded-lg flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : grids.length === 0 ? (
                <div className="py-3 px-4 bg-secondary-50 text-red-700 rounded-lg border border-red-200">
                  No storage grids available. Please create a grid first.
                </div>
              ) : (
                <select
                  id="gridId"
                  name="gridId"
                  value={formData.gridId}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  required={formData.storageType === 'grid'}
                >
                  <option value="">Select a grid</option>
                  {grids.map(grid => (
                    <option key={grid.id} value={grid.id}>
                      {grid.name} ({grid.columns}x{grid.rows})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="columnNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Column {currentGrid ? `(1-${currentGrid.columns})` : ''}
                </label>
                <input
                  type="number"
                  id="columnNumber"
                  name="columnNumber"
                  value={formData.columnNumber}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  required={formData.storageType === 'grid'}
                  min="1"
                  max={currentGrid?.columns || 15}
                />
              </div>

              <div>
                <label htmlFor="rowNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Row {currentGrid ? `(1-${currentGrid.rows})` : ''}
                </label>
                <input
                  type="number"
                  id="rowNumber"
                  name="rowNumber"
                  value={formData.rowNumber}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  required={formData.storageType === 'grid'}
                  min="1"
                  max={currentGrid?.rows || 12}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Simple Storage selection */}
            <div>
              <label htmlFor="simpleStorageId" className="block text-sm font-medium text-gray-700 mb-1">
                Simple Storage Location
              </label>
              {loadingSimpleStorages ? (
                <div className="py-3 px-4 bg-gray-50 rounded-lg flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : simpleStorages.length === 0 ? (
                <div className="py-3 px-4 bg-secondary-50 text-red-700 rounded-lg border border-red-200">
                  No simple storage locations available. Please create a simple storage location first.
                </div>
              ) : (
                <select
                  id="simpleStorageId"
                  name="simpleStorageId"
                  value={formData.simpleStorageId}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  required={formData.storageType === 'simple'}
                >
                  <option value="">Select a simple storage location</option>
                  {simpleStorages.map(storage => (
                    <option key={storage.id} value={storage.id}>
                      {storage.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </>
        )}

        {/* Color Family Selection */}
        <div>
          <label htmlFor="colorFamily" className="block text-sm font-medium text-gray-700 mb-1">
            Color Family
          </label>
          <select
            id="colorFamily"
            name="colorFamily"
            value={formData.colorFamily}
            onChange={handleChange}
            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
          >
            {colorFamilies.map(family => (
              <option key={family.value} value={family.value}>
                {family.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Auto-detected: <span className="font-medium text-gray-700">{autoColorFamily}</span>
          </p>
        </div>

        <div className="flex justify-between gap-4 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              'Update Marker'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default MarkerEditForm;
