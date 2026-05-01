import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearch } from '@/controllers/useSearchController';
import PlacesAutocompleteInput from './PlacesAutocompleteInput';

const SearchBar = () => {
  const [input, setInput] = useState('');
  const { triggerSearch, isSearching, searchError } = useSearch();

  return (
    <div className="relative w-full">
      <motion.div
        className="relative w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <PlacesAutocompleteInput
          value={input}
          onValueChange={setInput}
          onManualSearch={(query) => {
            void triggerSearch(query);
          }}
          disabled={isSearching}
          error={searchError}
          placeholder="Search any place..."
          inputClassName="glass-input w-full !pl-11 pr-28 py-3 text-sm"
          wrapperClassName="relative w-full"
          iconClassName="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 z-10"
          searchButtonClassName="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-ev-blue/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg transition hover:bg-ev-blue z-10"
          clearButtonClassName="absolute inset-y-0 right-[88px] flex items-center text-white/40 hover:text-white transition-colors z-10"
          errorClassName="absolute left-0 top-full mt-1 rounded bg-[#1a1a1a] px-2 py-1 text-xs text-[#ff4d4d]"
        />
      </motion.div>
    </div>
  );
};

export default SearchBar;
