import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Vendor } from '../../store/settingsStore';
import { settingsApi } from '../../services/settingsApi';

interface VendorAutocompleteProps {
  vendors?: Vendor[]; // Optional - if not provided, will fetch with pagination
  value: string;
  onChange: (value: string) => void;
  onVendorSelect?: (vendor: Vendor | null) => void; // Optional callback with full vendor object
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

const VendorAutocomplete: React.FC<VendorAutocompleteProps> = ({
  vendors: providedVendors,
  value,
  onChange,
  onVendorSelect,
  placeholder = 'Search vendors...',
  disabled = false,
  className = '',
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 50;

  // Load vendors with pagination
  const loadVendors = useCallback(async (page: number = 1, search: string = '', reset: boolean = true) => {
    if (providedVendors) {
      // If vendors are provided, use client-side filtering (backward compatibility)
      if (!search.trim()) {
        setFilteredVendors(providedVendors.filter(v => v.isActive));
      } else {
        const filtered = providedVendors.filter(vendor => 
          vendor.isActive && 
          vendor.name.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredVendors(filtered);
      }
      setHasMore(false);
      return;
    }

    // Otherwise, fetch from API with pagination
    setLoading(true);
    try {
      const response = await settingsApi.getVendorsPaginated({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        isActive: true
      });

      if (reset) {
        setFilteredVendors(response.vendors);
      } else {
        setFilteredVendors(prev => [...prev, ...response.vendors]);
      }

      setHasMore(page < response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  }, [providedVendors]);

  // Initial load when dropdown opens
  useEffect(() => {
    if (isOpen && filteredVendors.length === 0 && !loading) {
      loadVendors(1, searchQuery, true);
    }
  }, [isOpen, loadVendors, searchQuery, filteredVendors.length, loading]);

  // Filter vendors based on input value (with debounce for API calls)
  useEffect(() => {
    const search = inputValue.trim();
    setSearchQuery(search);
    
    if (providedVendors) {
      // Client-side filtering for provided vendors
      if (!search) {
        setFilteredVendors(providedVendors.filter(v => v.isActive));
      } else {
        const filtered = providedVendors.filter(vendor => 
          vendor.isActive && 
          vendor.name.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredVendors(filtered);
      }
      setHighlightedIndex(-1);
    } else {
      // API-based search with debounce
      const timeoutId = setTimeout(() => {
        if (isOpen) {
          loadVendors(1, search, true);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [inputValue, providedVendors, loadVendors, isOpen]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!isOpen || providedVendors || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadVendors(currentPage + 1, searchQuery, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isOpen, hasMore, loading, currentPage, searchQuery, loadVendors, providedVendors]);

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredVendors.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredVendors.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredVendors[highlightedIndex]) {
          selectVendor(filteredVendors[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectVendor = (vendor: Vendor) => {
    setInputValue(vendor.name);
    onChange(vendor.name);
    if (onVendorSelect) {
      onVendorSelect(vendor);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for clicks on dropdown items
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  const handleDropdownClick = (vendor: Vendor) => {
    selectVendor(vendor);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto"
        >
          {filteredVendors.length > 0 ? (
            <>
              {filteredVendors.map((vendor, index) => (
                <div
                  key={vendor.id}
                  onClick={() => handleDropdownClick(vendor)}
                  className={`
                    px-3 py-2 cursor-pointer hover:bg-blue-50
                    ${highlightedIndex === index ? 'bg-blue-100' : ''}
                    ${index === 0 ? 'rounded-t-md' : ''}
                    ${index === filteredVendors.length - 1 && !hasMore && !loading ? 'rounded-b-md' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{vendor.name}</span>
                    {!vendor.isActive && (
                      <span className="text-xs text-gray-500">(Inactive)</span>
                    )}
                  </div>
                </div>
              ))}
              {/* Loading indicator for infinite scroll */}
              {hasMore && (
                <div ref={loadMoreRef} className="px-3 py-2 text-center text-sm text-gray-500">
                  {loading ? 'Loading...' : ''}
                </div>
              )}
              {loading && (
                <div className="px-3 py-2 text-center text-sm text-gray-500">
                  Loading more vendors...
                </div>
              )}
            </>
          ) : loading ? (
            <div className="px-3 py-2 text-center text-sm text-gray-500">
              Loading vendors...
            </div>
          ) : null}
        </div>
      )}
      
      {isOpen && filteredVendors.length === 0 && inputValue.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-sm text-gray-500">
            No vendors found matching "{inputValue}"
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorAutocomplete; 