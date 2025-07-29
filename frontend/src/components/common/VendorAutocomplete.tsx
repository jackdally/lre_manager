import React, { useState, useEffect, useRef } from 'react';
import { Vendor } from '../../store/settingsStore';

interface VendorAutocompleteProps {
  vendors: Vendor[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

const VendorAutocomplete: React.FC<VendorAutocompleteProps> = ({
  vendors,
  value,
  onChange,
  placeholder = 'Search vendors...',
  disabled = false,
  className = '',
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter vendors based on input value
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredVendors(vendors.filter(v => v.isActive));
    } else {
      const filtered = vendors.filter(vendor => 
        vendor.isActive && 
        vendor.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredVendors(filtered);
    }
    setHighlightedIndex(-1);
  }, [inputValue, vendors]);

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
      
      {isOpen && filteredVendors.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredVendors.map((vendor, index) => (
            <div
              key={vendor.id}
              onClick={() => handleDropdownClick(vendor)}
              className={`
                px-3 py-2 cursor-pointer hover:bg-blue-50
                ${highlightedIndex === index ? 'bg-blue-100' : ''}
                ${index === 0 ? 'rounded-t-md' : ''}
                ${index === filteredVendors.length - 1 ? 'rounded-b-md' : ''}
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