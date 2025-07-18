import React from 'react';
import { motion } from 'framer-motion';
import { Marker, Grid as GridType } from '../types/marker';

// Helper function to determine if text should be white or black based on background color
const getContrastingTextColor = (hexColor: string): string => {
  // Remove the hash if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Calculate luminance - using the formula for perceived brightness
  // See: https://www.w3.org/TR/AERT/#color-contrast
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

interface GridProps {
  grid: GridType;
  highlightedMarker?: Marker;
  highlightedPosition?: {
    columnNumber: number;
    rowNumber: number;
  };
  // Support the old way of passing highlight position
  highlight?: {
    column: number;
    row: number;
  };
  // Support direct passing of highlight coordinates
  highlightColumn?: number;
  highlightRow?: number;
  // Support size options
  size?: 'small' | 'medium' | 'large';
}

const Grid: React.FC<GridProps> = ({ 
  grid, 
  highlightedMarker, 
  highlightedPosition, 
  highlight,
  highlightColumn,
  highlightRow,
  size = 'medium'
}) => {
  // Determine the actual highlight position from various props
  const effectiveHighlight = {
    columnNumber: highlightColumn || highlight?.column || highlightedPosition?.columnNumber || 
                 (highlightedMarker?.columnNumber !== undefined ? highlightedMarker.columnNumber : null),
    rowNumber: highlightRow || highlight?.row || highlightedPosition?.rowNumber || 
              (highlightedMarker?.rowNumber !== undefined ? highlightedMarker.rowNumber : null)
  };

  const columns = Array.from({ length: grid.columns }, (_, i) => i + 1);
  const rows = Array.from({ length: grid.rows }, (_, i) => i + 1);
  
  // Determine if this is an odd or even grid to alternate colors
  const isEven = grid.id.charCodeAt(0) % 2 === 0;

  const gridColor = {
    bg: isEven ? 'bg-primary-50' : 'bg-accent-50',
    border: isEven ? 'border-primary-200' : 'border-accent-200',
    header: isEven ? 'bg-primary-600 text-white' : 'bg-accent-600 text-white',
    highlight: isEven ? 'bg-primary-400 shadow-lg shadow-primary-100' : 'bg-accent-400 shadow-lg shadow-accent-100',
  };

  // Size-specific styles
  const sizeClasses = {
    small: {
      container: 'text-xs',
      cell: 'h-7 w-7 min-w-7',
      header: 'h-7 min-w-7',
    },
    medium: {
      container: 'text-sm',
      cell: 'h-9 w-9 min-w-9',
      header: 'h-9 min-w-9',
    },
    large: {
      container: 'text-base',
      cell: 'h-11 w-11 min-w-11',
      header: 'h-11 min-w-11',
    }
  };

  const sizeClass = sizeClasses[size];

  // Create grid template columns style that adapts to container width
  const gridTemplateColumns = `auto repeat(${grid.columns}, minmax(32px, 1fr))`;

  return (
    <motion.div 
      className={`mt-4 rounded-xl overflow-hidden border ${gridColor.border} shadow-md`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className={`text-lg font-semibold text-white py-2 px-4 ${gridColor.header}`}>
        {grid.name}
      </h3>
      <div className="p-2">
        <div 
          className={`grid ${gridColor.bg} rounded-lg w-full`}
          style={{ gridTemplateColumns }}
        >
          {/* Column headers */}
          <div className={`h-10 flex items-center justify-center font-bold ${sizeClass.header}`}></div>
          {columns.map((col) => (
            <div 
              key={col} 
              className={`h-10 flex items-center justify-center font-medium border-b-2 border-gray-300 ${sizeClass.header}`}
            >
              {col}
            </div>
          ))}

          {/* Grid cells */}
          {rows.map((row) => (
            <React.Fragment key={row}>
              {/* Row headers */}
              <div className={`h-10 flex items-center justify-center font-medium border-r-2 border-gray-300 ${sizeClass.header}`}>
                {row}
              </div>
              
              {/* Cells */}
              {columns.map((col) => {
                const isHighlighted = 
                  effectiveHighlight.columnNumber === col && 
                  effectiveHighlight.rowNumber === row;
                
                return (
                  <div 
                    key={`${row}-${col}`}
                    className={`h-8 w-8 min-w-[2rem] border border-gray-200 flex items-center justify-center rounded-md m-0.5 transition-all tooltip-container ${
                      isHighlighted ? `${gridColor.highlight}` : 'hover:bg-gray-100'
                    }`}
                  >
                    {isHighlighted && (
                      <motion.div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs relative"
                        style={{ 
                          backgroundColor: highlightedMarker?.colorHex || 'white',
                          color: getContrastingTextColor(highlightedMarker?.colorHex || '#FFFFFF')
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                      >
                        <motion.span 
                          className="absolute inset-0 rounded-full opacity-50 z-0"
                          style={{ backgroundColor: highlightedMarker?.colorHex || 'white' }}
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.7, 0.2, 0.7]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        />
                        {highlightedMarker && (
                          <span className="z-10 relative">{highlightedMarker.markerNumber}</span>
                        )}
                      </motion.div>
                    )}
                    {/* Always show tooltip on hover */}
                    <div className="tooltip">
                      {isHighlighted && highlightedMarker ? 
                        `${highlightedMarker.markerNumber} - ${highlightedMarker.colorName} (${highlightedMarker.brand?.name || 'No brand'})` : 
                        `Position: ${col}, ${row}`
                      }
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* Grid dimensions indicator */}
      <div className="p-2 text-xs text-gray-500 flex items-center justify-center border-t border-gray-100">
        <span className="mr-1">{grid.columns}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="ml-1">{grid.rows}</span> grid
      </div>
    </motion.div>
  );
};

export default Grid;
