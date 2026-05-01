import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useSearch } from '@/controllers/useSearchController';
import { searchLocationSuggestions, type SearchSuggestion } from '@/services/googleMapsService';

interface PlacesAutocompleteInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onManualSearch: (query: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  inputClassName: string;
  wrapperClassName?: string;
  searchButtonClassName: string;
  clearButtonClassName: string;
  errorClassName?: string;
  iconClassName?: string;
  showSearchButton?: boolean;
}

const PlacesAutocompleteInput = ({
  value,
  onValueChange,
  onManualSearch,
  disabled = false,
  error,
  placeholder = 'Search for a place...',
  inputClassName,
  wrapperClassName,
  searchButtonClassName,
  clearButtonClassName,
  errorClassName,
  iconClassName,
  showSearchButton = true,
}: PlacesAutocompleteInputProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { resolveSelectedLocation, clearSearchError } = useSearch();

  useEffect(() => {
    if (disabled) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      setIsLoadingSuggestions(false);
      return;
    }

    const query = value.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      setIsLoadingSuggestions(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setIsLoadingSuggestions(true);

      void searchLocationSuggestions(query).then((results) => {
        if (cancelled) {
          return;
        }

        setSuggestions(results);
        setIsDropdownOpen(results.length > 0);
        setIsLoadingSuggestions(false);
      }).catch((searchError) => {
        if (cancelled) {
          return;
        }

        console.error('[AutocompleteInput] suggestion lookup failed', searchError);
        setSuggestions([]);
        setIsDropdownOpen(false);
        setIsLoadingSuggestions(false);
      });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [disabled, value]);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    const nextLabel = suggestion.name || suggestion.address || value;
    onValueChange(nextLabel);
    clearSearchError();
    resolveSelectedLocation(suggestion);
    setSuggestions([]);
    setIsDropdownOpen(false);
  };

  const handleManualSearch = () => {
    const query = value.trim();
    if (!query) {
      return;
    }

    setIsDropdownOpen(false);
    setSuggestions([]);
    clearSearchError();
    onManualSearch(query);
  };

  return (
    <div className={wrapperClassName ?? 'relative w-full'}>
      <Search className={iconClassName ?? 'pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70'} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onFocus={() => {
          if (suggestions.length > 0) {
            setIsDropdownOpen(true);
          }
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setIsDropdownOpen(false);
          }, 120);
        }}
        onChange={(event) => {
          onValueChange(event.target.value);
          if (error) {
            clearSearchError();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleManualSearch();
          }

          if (event.key === 'Escape') {
            setIsDropdownOpen(false);
          }
        }}
        disabled={disabled}
        className={inputClassName}
      />
      {showSearchButton && (
        <button
          onClick={handleManualSearch}
          disabled={disabled}
          className={searchButtonClassName}
          type="button"
        >
          Search
        </button>
      )}
      {value && (
        <button
          className={clearButtonClassName}
          onClick={() => {
            onValueChange('');
            clearSearchError();
            setSuggestions([]);
            setIsDropdownOpen(false);
          }}
          type="button"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
            <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </button>
      )}
      {isDropdownOpen && (suggestions.length > 0 || isLoadingSuggestions) && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
          {isLoadingSuggestions && (
            <div className="px-4 py-3 text-sm text-white/60">
              Searching places...
            </div>
          )}
          {!isLoadingSuggestions && suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className="flex w-full flex-col items-start gap-1 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 last:border-b-0"
              onMouseDown={(event) => {
                event.preventDefault();
                handleSelectSuggestion(suggestion);
              }}
            >
              <span className="text-sm font-medium text-white">
                {suggestion.name}
              </span>
              {suggestion.address && (
                <span className="text-xs text-white/50">
                  {suggestion.address}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className={errorClassName ?? 'absolute left-0 top-full mt-1 rounded bg-[#1a1a1a] px-2 py-1 text-xs text-[#ff4d4d]'}>
          {error}
        </p>
      )}
    </div>
  );
};

export default PlacesAutocompleteInput;
