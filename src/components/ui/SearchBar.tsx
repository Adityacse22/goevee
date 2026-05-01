
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  value = '', 
  onChange, 
  onSubmit,
  isLoading = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit?.();
    }
  };

  return (
    <motion.div 
      className="relative w-full"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      whileHover={{ scale: 1.01 }}
    >
      <motion.input
        type="text"
        placeholder="Search for charging stations..."
        className="glass-input w-full pr-24"
        style={{ paddingLeft: '40px' }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        value={value}
        animate={{ 
          boxShadow: isFocused 
            ? "0 0 0 2px rgba(30, 174, 219, 0.5), 0 0 15px rgba(30, 174, 219, 0.3)" 
            : "none"
        }}
        transition={{ duration: 0.2 }}
      />
      
      <motion.div 
        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        animate={{ 
          x: isFocused ? 2 : 0,
          scale: isFocused ? 1.1 : 1,
          color: isFocused ? "rgb(30, 174, 219)" : "rgba(255, 255, 255, 0.7)"
        }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <svg className="h-4 w-4 text-ev-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.div>
        ) : (
          <Search className="h-5 w-5" />
        )}
      </motion.div>
      
      {/* Animated line under search input */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-ev-blue to-ev-green rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: isFocused ? "100%" : value ? "100%" : "0%" }}
        transition={{ type: "tween", duration: 0.3 }}
      />
      
      <motion.button
        type="button"
        className="absolute inset-y-0 right-10 flex items-center"
        onClick={() => onSubmit?.()}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="rounded-full bg-ev-blue/80 px-3 py-1 text-xs font-semibold text-white"
          animate={{
            opacity: value ? 1 : 0.7,
          }}
          transition={{ duration: 0.2 }}
        >
          Search
        </motion.div>
      </motion.button>

      {/* Clear button appears when there is text */}
      {value && (
        <motion.button
          className="absolute inset-y-0 right-3 flex items-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          onClick={() => onChange?.('')}
        >
          <motion.div
            className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
        </motion.button>
      )}
    </motion.div>
  );
};

export default SearchBar;
