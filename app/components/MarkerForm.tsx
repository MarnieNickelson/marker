import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Grid, Brand } from '../types/marker';
import { useSearchParams } from 'next/navigation';
import { fetchWithAuth } from '../utils/api';
import { isColorInFamily } from '../utils/colorUtils';

interface SimpleStorage {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

interface MarkerFormProps {
  onMarkerAdded: () => void;
  grids?: Grid[];
  isAddingLocation?: boolean; // When true, only location fields are editable
}

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

const MarkerForm: React.FC<MarkerFormProps> = ({ onMarkerAdded, grids: providedGrids, isAddingLocation = false }) => {
  const searchParams = useSearchParams();
  const [grids, setGrids] = useState<Grid[]>(providedGrids || []);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [simpleStorages, setSimpleStorages] = useState<SimpleStorage[]>([]);
  const [formData, setFormData] = useState({
    markerNumber: searchParams.get('markerNumber') || '',
    colorName: searchParams.get('colorName') || '',
    colorHex: searchParams.get('colorHex') || '#000000',
    colorFamily: '', // Empty string means auto-detection
    brandId: searchParams.get('brandId') || '', // Changed from brand to brandId
    storageType: 'grid', // 'grid' or 'simple'
    gridId: '',
    columnNumber: '',
    rowNumber: '',
    simpleStorageId: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingGrids, setLoadingGrids] = useState(!providedGrids);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingSimpleStorages, setLoadingSimpleStorages] = useState(true);
  
  // Get auto-detected color family
  const getAutoColorFamily = (hex: string): string => {
    for (const family of colorFamilies.filter(f => f.value !== '')) {
      if (isColorInFamily(hex, family.value)) {
        return family.value;
      }
    }
    return 'unknown';
  };
  
  // State for displaying auto-detected color family
  const [autoColorFamily, setAutoColorFamily] = useState(getAutoColorFamily(formData.colorHex));

  // Update auto color family when hex changes
  useEffect(() => {
    setAutoColorFamily(getAutoColorFamily(formData.colorHex));
  }, [formData.colorHex]);

  // Fetch available grids if not provided
  useEffect(() => {
    if (providedGrids) {
      if (providedGrids.length > 0) {
        setFormData(prev => ({ ...prev, gridId: providedGrids[0].id }));
      }
      return;
    }
    
    const fetchGrids = async () => {
      try {
        const data = await fetchWithAuth<Grid[]>('/api/grids');
        if (data) {
          setGrids(data);
          
          // Set default gridId if available
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, gridId: data[0].id }));
          }
        }
      } catch (error) {
        console.error('Error fetching grids:', error);
        toast.error('Failed to load storage grids');
      } finally {
        setLoadingGrids(false);
      }
    };
    
    fetchGrids();
  }, [providedGrids]);

  // Fetch available brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await fetchWithAuth<Brand[]>('/api/brands');
        if (data) {
          setBrands(data);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
        toast.error('Failed to load marker brands');
      } finally {
        setLoadingBrands(false);
      }
    };
    
    fetchBrands();
  }, []);

  // Fetch available simple storages
  useEffect(() => {
    const fetchSimpleStorages = async () => {
      try {
        const data = await fetchWithAuth<SimpleStorage[]>('/api/simple-storages');
        if (data) {
          setSimpleStorages(data);
          
          // Set default simpleStorageId if available and storageType is simple
          if (data.length > 0 && formData.storageType === 'simple') {
            setFormData(prev => ({ ...prev, simpleStorageId: data[0].id }));
          }
        }
      } catch (error) {
        console.error('Error fetching simple storages:', error);
        toast.error('Failed to load simple storages');
      } finally {
        setLoadingSimpleStorages(false);
      }
    };
    
    fetchSimpleStorages();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value,
      // Clear storage-specific fields when switching storage types
      ...(name === 'storageType' && value === 'grid' ? { simpleStorageId: '', gridId: grids.length > 0 ? grids[0].id : '' } : {}),
      ...(name === 'storageType' && value === 'simple' ? { gridId: '', columnNumber: '', rowNumber: '', simpleStorageId: simpleStorages.length > 0 ? simpleStorages[0].id : '' } : {}),
    }));
  };
  
  // Find current grid dimensions
  const currentGrid = grids.find(grid => grid.id === formData.gridId);

  // Auto-detect color family based on color hex
  useEffect(() => {
    if (formData.colorHex && formData.colorFamily === '') {
      const detectedFamily = colorFamilies.find(family => isColorInFamily(formData.colorHex, family.value));
      setFormData(prev => ({ ...prev, colorFamily: detectedFamily ? detectedFamily.value : '' }));
    }
  }, [formData.colorHex, formData.colorFamily]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Prepare the submission data based on storage type
    let submissionData: any = {
      markerNumber: formData.markerNumber,
      colorName: formData.colorName,
      colorHex: formData.colorHex,
      brandId: formData.brandId,
      storageType: formData.storageType,
    };

    if (formData.storageType === 'grid') {
      submissionData = {
        ...submissionData,
        gridId: formData.gridId,
        columnNumber: parseInt(formData.columnNumber) || 1,
        rowNumber: parseInt(formData.rowNumber) || 1,
      };
    } else if (formData.storageType === 'simple') {
      submissionData = {
        ...submissionData,
        simpleStorageId: formData.simpleStorageId,
      };
    }
    
    const submitPromise = fetchWithAuth('/api/markers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: submissionData, // Don't JSON.stringify here - fetchWithAuth will do it
    })
    .then(data => {
      if (!data) {
        throw new Error('Failed to add marker');
      }
      
      // Reset form but keep the grid selection and marker details if adding location
      const currentGridId = formData.gridId;
      const currentStorageType = formData.storageType;
      const currentSimpleStorageId = formData.simpleStorageId;
      
      if (isAddingLocation) {
        // When adding a location, keep the marker details but clear the position
        setFormData(prev => ({
          ...prev,
          columnNumber: '',
          rowNumber: '',
        }));
      } else {
        // When adding a new marker, reset all fields except storage selection
        setFormData({
          markerNumber: '',
          colorName: '',
          colorHex: '#000000',
          colorFamily: '', // Reset to auto-detection
          brandId: '', 
          storageType: currentStorageType,
          gridId: currentStorageType === 'grid' ? currentGridId : '',
          columnNumber: '',
          rowNumber: '',
          simpleStorageId: currentStorageType === 'simple' ? currentSimpleStorageId : '',
        });
      }
      
      onMarkerAdded();
      return isAddingLocation ? 'New location added!' : 'Marker added successfully!';
    })
    .finally(() => {
      setLoading(false);
    });
    
    // Show toast notification based on promise result
    toast.promise(submitPromise, {
      loading: isAddingLocation ? 'Adding location...' : 'Adding marker...',
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
          <h2 className="text-xl font-semibold text-blue-800 mb-1">
            {isAddingLocation ? 'Add New Location' : 'Add New Marker'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isAddingLocation ? 'Choose a storage location for this marker' : 'Enter the marker details below'}
          </p>
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
            disabled={isAddingLocation}
            className={`block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors ${
              isAddingLocation ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
            }`}
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
            disabled={isAddingLocation}
            className={`block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors ${
              isAddingLocation ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
            }`}
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
              disabled={isAddingLocation}
              className={`h-10 w-10 rounded border border-gray-200 ${isAddingLocation ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            />
            <input
              type="text"
              name="colorHex"
              value={formData.colorHex}
              onChange={handleChange}
              disabled={isAddingLocation}
              className={`block flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors ${
                isAddingLocation ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
              }`}
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
                style={{ backgroundColor: formData.colorHex }}
              ></div>
              <div className="h-6 px-2 rounded-r bg-gray-100 text-xs flex items-center">
                {formData.colorName || "Preview"}
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
            disabled={isAddingLocation}
            className={`block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors ${
              isAddingLocation ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
            }`}
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
              <span className="ml-1 px-2 py-0.5 rounded-full text-white text-xs font-medium bg-primary-500">
                {autoColorFamily}
              </span>
            </div>
          )}
        </div>

        {/* Brand dropdown */}
        <div>
          <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          {loadingBrands ? (
            <div className="py-3 px-4 bg-gray-50 rounded-lg flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="relative">
              <select
                id="brandId"
                name="brandId"
                value={formData.brandId}
                onChange={handleChange}
                disabled={isAddingLocation}
                className={`block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors ${
                  isAddingLocation ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select a brand</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {!isAddingLocation && (
                <div className="mt-1 text-xs text-blue-600">
                  <a href="/brands" className="hover:underline">
                    Manage brands
                  </a>
                </div>
              )}
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
            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
          >
            <option value="grid">Grid Storage</option>
            <option value="simple">Simple Storage</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {formData.storageType === 'grid' 
              ? 'Store marker in a specific grid position (column/row)'
              : 'Store marker in a simple storage location without specific positioning'
            }
          </p>
        </div>

        {/* Conditional Storage Options */}
        {formData.storageType === 'grid' ? (
          // Grid Storage UI
          <>
            <div>
              <label htmlFor="gridId" className="block text-sm font-medium text-gray-700 mb-1">
                Storage Grid
              </label>
              {loadingGrids ? (
                <div className="py-3 px-4 bg-gray-50 rounded-lg flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                  required
                >
                  {grids.map(grid => (
                    <option key={grid.id} value={grid.id}>
                      {grid.name} ({grid.columns}x{grid.rows})
                    </option>
                  ))}
                </select>
              )}
              <div className="mt-1 text-xs text-blue-600">
                <a href="/grids" className="hover:underline">
                  Manage grids
                </a>
              </div>
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
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                  required
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
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                  required
                  min="1"
                  max={currentGrid?.rows || 12}
                />
              </div>
            </div>
          </>
        ) : (
          // Simple Storage UI
          <div>
            <label htmlFor="simpleStorageId" className="block text-sm font-medium text-gray-700 mb-1">
              Simple Storage Location
            </label>
            {loadingSimpleStorages ? (
              <div className="py-3 px-4 bg-gray-50 rounded-lg flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : simpleStorages.length === 0 ? (
              <div className="py-3 px-4 bg-secondary-50 text-red-700 rounded-lg border border-red-200">
                No simple storage locations available. Please create a storage location first.
              </div>
            ) : (
              <select
                id="simpleStorageId"
                name="simpleStorageId"
                value={formData.simpleStorageId}
                onChange={handleChange}
                className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                required
              >
                <option value="">Select a storage location</option>
                {simpleStorages.map(storage => (
                  <option key={storage.id} value={storage.id}>
                    {storage.name}
                    {storage.description ? ` - ${storage.description}` : ''}
                  </option>
                ))}
              </select>
            )}
            <div className="mt-1 text-xs text-blue-600">
              <a href="/storage" className="hover:underline">
                Manage storage locations
              </a>
            </div>
          </div>
        )}

        <div className="pt-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isAddingLocation ? 'Adding location...' : 'Adding marker...'}
              </>
            ) : (
              isAddingLocation ? 'Add Location' : 'Add Marker'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default MarkerForm;
