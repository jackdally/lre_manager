import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

export interface WbsElement {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  parentId?: string;
  children?: WbsElement[];
}

interface HierarchicalWbsDropdownProps {
  programId: string;
  value?: string;
  onChange: (elementId: string | null, element?: WbsElement) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showCode?: boolean;
}

const HierarchicalWbsDropdown: React.FC<HierarchicalWbsDropdownProps> = ({
  programId,
  value,
  onChange,
  placeholder = "Select WBS Element",
  className = "",
  disabled = false,
  showCode = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [elements, setElements] = useState<WbsElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElement, setSelectedElement] = useState<WbsElement | null>(null);
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch WBS elements
  useEffect(() => {
    const fetchElements = async () => {
      if (!programId) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`/api/programs/${programId}/wbs-elements`);
        const flatElements = response.data as WbsElement[];
        
        // Convert flat structure to hierarchical
        const hierarchicalElements = buildHierarchy(flatElements);
        setElements(hierarchicalElements);
        
        // Find and set selected element if value is provided
        if (value) {
          const found = flatElements.find(el => el.id === value);
          if (found) {
            setSelectedElement(found);
          }
        }
      } catch (error) {
        console.error('Failed to fetch WBS elements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchElements();
  }, [programId, value]);

  // Build hierarchical structure from flat array
  const buildHierarchy = (flatElements: WbsElement[]): WbsElement[] => {
    const elementMap = new Map<string, WbsElement>();
    const rootElements: WbsElement[] = [];

    // Create map of all elements
    flatElements.forEach(element => {
      elementMap.set(element.id, { ...element, children: [] });
    });

    // Build hierarchy
    flatElements.forEach(element => {
      const elementWithChildren = elementMap.get(element.id)!;
      
      if (element.parentId) {
        const parent = elementMap.get(element.parentId);
        if (parent) {
          parent.children!.push(elementWithChildren);
        }
      } else {
        rootElements.push(elementWithChildren);
      }
    });

    return rootElements;
  };

  // Filter elements based on search term
  const filterElements = (elements: WbsElement[], term: string): WbsElement[] => {
    if (!term) return elements;
    
    return elements.filter(element => {
      const matchesSearch = 
        element.code.toLowerCase().includes(term.toLowerCase()) ||
        element.name.toLowerCase().includes(term.toLowerCase()) ||
        element.description.toLowerCase().includes(term.toLowerCase());
      
      const childrenMatch = element.children ? 
        filterElements(element.children, term).length > 0 : false;
      
      return matchesSearch || childrenMatch;
    }).map(element => ({
      ...element,
      children: element.children ? filterElements(element.children, term) : []
    }));
  };

  // Toggle element expansion
  const toggleExpansion = (elementId: string) => {
    setExpandedElements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) {
        newSet.delete(elementId);
      } else {
        newSet.add(elementId);
      }
      return newSet;
    });
  };

  // Handle element selection
  const handleElementSelect = (element: WbsElement) => {
    setSelectedElement(element);
    onChange(element.id, element);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Get breadcrumb path for an element
  const getBreadcrumbPath = (elementId: string): WbsElement[] => {
    const path: WbsElement[] = [];
    const findPath = (elements: WbsElement[], targetId: string): boolean => {
      for (const element of elements) {
        if (element.id === targetId) {
          path.unshift(element);
          return true;
        }
        if (element.children && findPath(element.children, targetId)) {
          path.unshift(element);
          return true;
        }
      }
      return false;
    };
    
    findPath(elements, elementId);
    return path;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredElements = filterElements(elements, searchTerm);
  const breadcrumbPath = selectedElement ? getBreadcrumbPath(selectedElement.id) : [];

  const renderElement = (element: WbsElement, depth: number = 0) => {
    const hasChildren = element.children && element.children.length > 0;
    const isExpanded = expandedElements.has(element.id);
    const isSelected = selectedElement?.id === element.id;

    return (
      <div key={element.id}>
        <div
          className={`
            flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors
            ${isSelected ? 'bg-blue-50 text-blue-700' : ''}
            ${depth > 0 ? 'ml-4' : ''}
          `}
          onClick={() => handleElementSelect(element)}
        >
          {/* Expand/collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion(element.id);
              }}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          {/* Element content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {showCode && (
                <span className="font-mono text-sm text-gray-600 bg-gray-100 px-1 rounded">
                  {element.code}
                </span>
              )}
              <span className="font-medium truncate">{element.name}</span>
            </div>
            <div className="text-sm text-gray-500 truncate">{element.description}</div>
          </div>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {element.children!.map(child => renderElement(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected value display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'}
        `}
      >
        {loading ? (
          <span className="text-gray-500">Loading...</span>
        ) : selectedElement ? (
          <div>
            <div className="flex items-center gap-2">
              {showCode && (
                <span className="font-mono text-sm text-gray-600 bg-gray-100 px-1 rounded">
                  {selectedElement.code}
                </span>
              )}
              <span className="font-medium">{selectedElement.name}</span>
            </div>
            {breadcrumbPath.length > 1 && (
              <div className="text-xs text-gray-500 mt-1">
                {breadcrumbPath.slice(0, -1).map((el, index) => (
                  <span key={el.id}>
                    {index > 0 && ' > '}
                    {el.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search WBS elements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Elements list */}
          <div className="overflow-y-auto max-h-80">
            {filteredElements.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500">
                {searchTerm ? 'No elements found' : 'No WBS elements available'}
              </div>
            ) : (
              filteredElements.map(element => renderElement(element))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalWbsDropdown; 