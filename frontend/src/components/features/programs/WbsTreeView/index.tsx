import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { WbsElement, WbsElementFormData, WbsSearchResult } from '../../../../types/wbs';
import axios from 'axios';
import WbsElementModal from './WbsElementModal';

interface WbsTreeViewProps {
  programId: string;
  onElementSelect?: (element: WbsElement) => void;
  selectedElementId?: string;
}

interface WbsTreeItemProps {
  element: WbsElement;
  level: number;
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onElementSelect?: (element: WbsElement) => void;
  selectedElementId?: string;
  onEdit: (element: WbsElement) => void;
  onDelete: (element: WbsElement) => void;
  onAddChild: (parentId: string) => void;
}

const WbsTreeItem: React.FC<WbsTreeItemProps> = ({
  element,
  level,
  expandedItems,
  onToggleExpand,
  onElementSelect,
  selectedElementId,
  onEdit,
  onDelete,
  onAddChild
}) => {
  const isExpanded = expandedItems.has(element.id);
  const hasChildren = element.children && element.children.length > 0;
  const isSelected = selectedElementId === element.id;

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpand(element.id);
    }
  };

  const handleSelect = () => {
    onElementSelect?.(element);
  };

  return (
    <div className="wbs-tree-item">
      <div 
        className={`flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-100' : ''}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-200 rounded mr-1"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-6 mr-1" />
        )}

        {/* Element info */}
        <div 
          className="flex-1 flex items-center"
          onClick={handleSelect}
        >
          <span className="font-mono text-sm text-gray-600 mr-2">{element.code}</span>
          <span className="text-sm">{element.name}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddChild(element.id)}
            className="p-1 hover:bg-gray-200 rounded"
            title="Add child element"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(element)}
            className="p-1 hover:bg-gray-200 rounded"
            title="Edit element"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(element)}
            className="p-1 hover:bg-gray-200 rounded text-red-600"
            title="Delete element"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {element.children.map(child => (
            <WbsTreeItem
              key={child.id}
              element={child}
              level={level + 1}
              expandedItems={expandedItems}
              onToggleExpand={onToggleExpand}
              onElementSelect={onElementSelect}
              selectedElementId={selectedElementId}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const WbsTreeView: React.FC<WbsTreeViewProps> = ({
  programId,
  onElementSelect,
  selectedElementId
}) => {
  const [elements, setElements] = useState<WbsElement[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WbsSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<WbsElement | null>(null);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);

  // Load WBS elements
  useEffect(() => {
    loadElements();
  }, [programId]);

  const loadElements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<WbsElement[]>(`/api/programs/${programId}/wbs-elements`);
      setElements(response.data);
      
      // Auto-expand root level items
      const rootIds = response.data.map((el: WbsElement) => el.id);
      setExpandedItems(new Set(rootIds));
    } catch (err: any) {
      setError('Failed to load WBS elements');
      console.error('Error loading WBS elements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search WBS elements
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await axios.get<WbsSearchResult[]>(`/api/programs/${programId}/wbs-elements/search`, {
        params: { query }
      });
      setSearchResults(response.data);
    } catch (err: any) {
      console.error('Error searching WBS elements:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleEdit = (element: WbsElement) => {
    setEditingElement(element);
    setAddingToParentId(null);
    setModalOpen(true);
  };

  const handleDelete = async (element: WbsElement) => {
    if (!window.confirm(`Are you sure you want to delete "${element.name}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/programs/wbs-elements/${element.id}`);
      await loadElements(); // Reload the tree
    } catch (err: any) {
      alert('Failed to delete WBS element');
      console.error('Error deleting WBS element:', err);
    }
  };

  const handleAddChild = (parentId: string) => {
    setAddingToParentId(parentId);
    setEditingElement(null);
    setModalOpen(true);
  };

  const handleAddRoot = () => {
    setAddingToParentId(null);
    setEditingElement(null);
    setModalOpen(true);
  };

  const handleModalSave = (element: WbsElement) => {
    loadElements(); // Reload the tree to show the new/updated element
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingElement(null);
    setAddingToParentId(null);
  };

  const handleSearchResultClick = (result: WbsSearchResult) => {
    // Expand the path to this element
    const newExpanded = new Set(expandedItems);
    newExpanded.add(result.id);
    if (result.parentId) {
      newExpanded.add(result.parentId);
    }
    setExpandedItems(newExpanded);
    
    // Select the element
    const element = findElementById(elements, result.id);
    if (element) {
      onElementSelect?.(element);
    }
  };

  const findElementById = (elements: WbsElement[], id: string): WbsElement | null => {
    for (const element of elements) {
      if (element.id === id) return element;
      if (element.children) {
        const found = findElementById(element.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  if (loading) {
    return <div className="p-4 text-center">Loading WBS structure...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="wbs-tree-view border rounded-lg">
      {/* Search bar */}
      <div className="p-3 border-b bg-gray-50">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Search results */}
        {searchQuery && (
          <div className="mt-2 max-h-40 overflow-y-auto">
            {searching ? (
              <div className="text-sm text-gray-500">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map(result => (
                  <div
                    key={result.id}
                    onClick={() => handleSearchResultClick(result)}
                    className="p-2 hover:bg-gray-100 cursor-pointer rounded text-sm"
                  >
                    <div className="font-mono text-xs text-gray-600">{result.code}</div>
                    <div>{result.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No results found</div>
            )}
          </div>
        )}
      </div>

      {/* Tree structure */}
      <div className="max-h-96 overflow-y-auto">
        {elements.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No WBS elements found. Create the first element to get started.
          </div>
        ) : (
          <div className="group">
            {elements.map(element => (
              <WbsTreeItem
                key={element.id}
                element={element}
                level={0}
                expandedItems={expandedItems}
                onToggleExpand={handleToggleExpand}
                onElementSelect={onElementSelect}
                selectedElementId={selectedElementId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Root Element Button */}
      <div className="p-3 border-t bg-gray-50">
        <button
          onClick={handleAddRoot}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Root Element
        </button>
      </div>

      {/* Modal */}
      <WbsElementModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        programId={programId}
        element={editingElement}
        parentId={addingToParentId || undefined}
        parentElements={elements}
      />
    </div>
  );
};

export default WbsTreeView; 