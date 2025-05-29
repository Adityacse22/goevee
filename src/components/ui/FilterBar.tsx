import React from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  onFilterChange: (filters: {
    minRating?: number;
    maxPrice?: number;
    availableOnly?: boolean;
  }) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = React.useState({
    minRating: 0,
    maxPrice: 100,
    availableOnly: false
  });

  const handleFilterChange = (key: keyof typeof filters, value: number | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-md p-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <span className="font-medium">Filters</span>
        </div>

        <div className="flex-1 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Min Rating:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filters.minRating}
              onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
            >
              <option value="0">Any</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Max Price:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
            >
              <option value="100">Any</option>
              <option value="50">₹50/kWh</option>
              <option value="30">₹30/kWh</option>
              <option value="20">₹20/kWh</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Availability:</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={filters.availableOnly}
                onChange={(e) => handleFilterChange('availableOnly', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Available Only</span>
            </label>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FilterBar;
