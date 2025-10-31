import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, DocumentArrowDownIcon, DocumentArrowUpIcon, CurrencyDollarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { BOEElement } from '../../../store/boeStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { wbsTemplateIntegrationApi } from '../../../services/boeApi';
import BOEElementModal from './BOEElementModal';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import { formatCurrency, safeNumber } from '../../../utils/currencyUtils';

interface BOEFormProps {
  programId: string;
  boeVersionId: string;
  elements: BOEElement[];
  onElementsChange: (elements: BOEElement[]) => void;
  onSave: () => void;
  isReadOnly?: boolean;
}

interface BOETreeItemProps {
  element: BOEElement;
  level: number;
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onElementSelect?: (element: BOEElement) => void;
  selectedElementId?: string;
  onEdit: (element: BOEElement) => void;
  onDelete: (element: BOEElement) => void;
  onAddChild: (parentId: string) => void;
  isReadOnly?: boolean;
  costCategories: any[];
}

interface WBSTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  structure: any[];
  elementCount: number;
  createdAt: string;
  updatedAt: string;
}

// Enhanced BOETreeItem without drag-and-drop
const BOETreeItem: React.FC<BOETreeItemProps> = ({
  element,
  level,
  expandedItems,
  onToggleExpand,
  onElementSelect,
  selectedElementId,
  onEdit,
  onDelete,
  onAddChild,
  isReadOnly,
  costCategories
}) => {
  const isExpanded = expandedItems.has(element.id);
  const hasChildren = element.childElements && element.childElements.length > 0;
  const isSelected = selectedElementId === element.id;

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpand(element.id);
    }
  };

  const handleSelect = () => {
    onElementSelect?.(element);
  };

  // Get cost category name
  const costCategory = costCategories.find(cat => cat.id === element.costCategoryId);

  return (
    <div className="boe-tree-item">
      <div 
        className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer border-l-4 transition-colors ${
          isSelected 
            ? 'bg-blue-100 border-blue-500' 
            : 'border-transparent hover:border-gray-300'
        }`}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-200 rounded mr-2"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-6 mr-2" />
        )}

        {/* Element info */}
        <div 
          className="flex-1 flex items-center"
          onClick={handleSelect}
        >
          <span className="font-mono text-sm text-gray-600 mr-3 min-w-[60px]">{element.code}</span>
          <div className="flex-1">
            <div className="text-sm font-medium">{element.name}</div>
            <div className="text-xs text-gray-500">{element.description}</div>
          </div>
          
          {/* Cost and vendor info */}
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            {costCategory && (
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                <span>{costCategory.name}</span>
              </div>
            )}
                                    <div className="text-sm font-mono text-gray-700 ml-2">
                          {formatCurrency(element.estimatedCost)}
                        </div>
          </div>
        </div>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={() => onAddChild(element.id)}
              className="p-1 hover:bg-blue-100 rounded text-blue-600"
              title="Add child element"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(element)}
              className="p-1 hover:bg-gray-100 rounded text-gray-600"
              title="Edit element"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(element)}
              className="p-1 hover:bg-red-100 rounded text-red-600"
              title="Delete element"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        <div className="ml-6">
          {element.childElements!.map(child => (
            <BOETreeItem
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
              isReadOnly={isReadOnly}
              costCategories={costCategories}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BOEForm: React.FC<BOEFormProps> = ({
  programId,
  boeVersionId,
  elements,
  onElementsChange,
  onSave,
  isReadOnly = false
}) => {
  const { costCategories, fetchCostCategories } = useSettingsStore();
  
  const [selectedElement, setSelectedElement] = useState<BOEElement | null>(null);
  const [editingElement, setEditingElement] = useState<BOEElement | null>(null);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [pushToProgramModalOpen, setPushToProgramModalOpen] = useState(false);
  const [wbsTemplates, setWbsTemplates] = useState<WBSTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load cost categories
  useEffect(() => {
    fetchCostCategories();
  }, [fetchCostCategories]);

  // Load WBS templates
  useEffect(() => {
    const loadWBSTemplates = async () => {
      try {
        const templates = await wbsTemplateIntegrationApi.getAvailableTemplates();
        setWbsTemplates(templates);
      } catch (error) {
        console.error('Error loading WBS templates:', error);
      }
    };
    loadWBSTemplates();
  }, []);

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleEdit = (element: BOEElement) => {
    setEditingElement(element);
    setAddingToParentId(null);
    setModalOpen(true);
  };

  const handleDelete = async (element: BOEElement) => {
    if (!window.confirm(`Are you sure you want to delete "${element.name}" and all its children?`)) {
      return;
    }

    const removeElementAndChildren = (elements: BOEElement[], elementId: string): BOEElement[] => {
      return elements.filter(element => {
        if (element.id === elementId) {
          return false;
        }
        if (element.childElements) {
          element.childElements = removeElementAndChildren(element.childElements, elementId);
        }
        return true;
      });
    };

    const updatedElements = removeElementAndChildren(elements, element.id);
    onElementsChange(updatedElements);
    
    if (selectedElement?.id === element.id) {
      setSelectedElement(null);
    }
  };

  const handleAddChild = (parentId: string) => {
    setEditingElement(null);
    setAddingToParentId(parentId);
    setModalOpen(true);
  };

  const handleAddRoot = () => {
    setEditingElement(null);
    setAddingToParentId(null);
    setModalOpen(true);
  };

  const handleModalSave = (element: BOEElement) => {
    if (editingElement) {
      // Update existing element
      const updateElementInArray = (elements: BOEElement[], elementId: string, updates: BOEElement): BOEElement[] => {
        return elements.map(element => {
          if (element.id === elementId) {
            return { ...element, ...updates };
          }
          if (element.childElements) {
            element.childElements = updateElementInArray(element.childElements, elementId, updates);
          }
          return element;
        });
      };

      const updatedElements = updateElementInArray(elements, editingElement.id, element);
      onElementsChange(updatedElements);
      
      if (selectedElement?.id === editingElement.id) {
        setSelectedElement(element);
      }
    } else {
      // Add new element
      const newElement = {
        ...element,
        id: `temp-${Date.now()}`,
        childElements: []
      };

      if (addingToParentId) {
        // Add as child to parent
        const addChildToElement = (elements: BOEElement[], parentId: string, child: BOEElement): BOEElement[] => {
          return elements.map(element => {
            if (element.id === parentId) {
              return {
                ...element,
                childElements: [...(element.childElements || []), child]
              };
            }
            if (element.childElements) {
              element.childElements = addChildToElement(element.childElements, parentId, child);
            }
            return element;
          });
        };

        const updatedElements = addChildToElement(elements, addingToParentId, newElement);
        onElementsChange(updatedElements);
        
        // Expand parent
        setExpandedItems(prev => new Set(Array.from(prev).concat([addingToParentId])));
      } else {
        // Add as root element
        onElementsChange([...elements, newElement]);
      }
    }

    setModalOpen(false);
    setEditingElement(null);
    setAddingToParentId(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingElement(null);
    setAddingToParentId(null);
  };

  const handleImportTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const result = await wbsTemplateIntegrationApi.importTemplate(programId, boeVersionId, templateId);
      
      if (result.success) {
        // Refresh elements
        // Note: This would typically come from the parent component
        // For now, we'll just close the modal
        setImportModalOpen(false);
        alert(`Successfully imported ${result.elementsCreated} elements from template`);
      }
    } catch (error) {
      console.error('Error importing template:', error);
      alert('Failed to import template');
    } finally {
      setLoading(false);
    }
  };

  const handlePushToProgram = async () => {
    try {
      setLoading(true);
      const result = await wbsTemplateIntegrationApi.pushToProgramWBS(programId, boeVersionId);
      
      if (result.success) {
        setPushToProgramModalOpen(false);
        alert(`Successfully pushed BOE to program: ${result.elementsCreated} new elements, ${result.elementsUpdated} updated`);
      }
    } catch (error) {
      console.error('Error pushing to program:', error);
      alert('Failed to push BOE to program');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = (elements: BOEElement[]): number => {
    return elements.reduce((total, element) => {
      const elementCost = safeNumber(element.estimatedCost);
      const childrenCost = element.childElements ? calculateTotalCost(element.childElements) : 0;
      return total + elementCost + childrenCost;
    }, 0);
  };

  const totalCost = calculateTotalCost(elements);

  // Build hierarchical structure and filter elements based on search query
  const buildHierarchicalElements = (elements: BOEElement[]): BOEElement[] => {
    const elementMap = new Map<string, BOEElement>();
    const rootElements: BOEElement[] = [];
    
    // First pass: create a map of all elements
    elements.forEach(element => {
      elementMap.set(element.id, { ...element, childElements: [] });
    });
    
    // Second pass: build parent-child relationships
    elements.forEach(element => {
      const mappedElement = elementMap.get(element.id)!;
      if (element.parentElementId) {
        const parent = elementMap.get(element.parentElementId);
        if (parent) {
          parent.childElements = parent.childElements || [];
          parent.childElements.push(mappedElement);
        }
      } else {
        rootElements.push(mappedElement);
      }
    });
    
    return rootElements;
  };

  const hierarchicalElements = buildHierarchicalElements(elements);
  
  // Filter elements based on search query (including children)
  const filterElementsRecursively = (elements: BOEElement[], query: string): BOEElement[] => {
    return elements.filter(element => {
      const matchesQuery = 
        element.code.toLowerCase().includes(query.toLowerCase()) ||
        element.name.toLowerCase().includes(query.toLowerCase()) ||
        element.description.toLowerCase().includes(query.toLowerCase());
      
      const childMatches = element.childElements 
        ? filterElementsRecursively(element.childElements, query).length > 0
        : false;
      
      return matchesQuery || childMatches;
    }).map(element => ({
      ...element,
      childElements: element.childElements 
        ? filterElementsRecursively(element.childElements, query)
        : []
    }));
  };

  const filteredElements = searchQuery
    ? filterElementsRecursively(hierarchicalElements, searchQuery)
    : hierarchicalElements;

  return (
    <div className="boe-form">
      {/* Header with actions */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">BOE WBS Structure</h3>
          <p className="text-sm text-gray-600">
            {elements.length} elements • Total: {formatCurrency(totalCost)}
          </p>
        </div>
        
        {!isReadOnly && (
          <div className="flex space-x-2">
            <Button
              onClick={() => setImportModalOpen(true)}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-1"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>Import WBS Template</span>
            </Button>
            
            <Button
              onClick={handleAddRoot}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Root Element</span>
            </Button>
            
            <Button
              onClick={() => setPushToProgramModalOpen(true)}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-1"
            >
              <DocumentArrowUpIcon className="h-4 w-4" />
              <span>Push to Program WBS</span>
            </Button>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code, name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tree structure */}
      <div className="border rounded-lg bg-white">
        <div className="max-h-96 overflow-y-auto">
          {filteredElements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">
                {searchQuery ? 'No elements match your search.' : 'No BOE elements found.'}
              </p>
              <p className="text-sm">
                {searchQuery 
                  ? 'Try adjusting your search terms.' 
                  : 'Import a WBS template or create your first element to get started.'
                }
              </p>
            </div>
          ) : (
            <div className="group">
              {filteredElements.map(element => (
                <BOETreeItem
                  key={element.id}
                  element={element}
                  level={0}
                  expandedItems={expandedItems}
                  onToggleExpand={handleToggleExpand}
                  onElementSelect={setSelectedElement}
                  selectedElementId={selectedElement?.id}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                  isReadOnly={isReadOnly}
                  costCategories={costCategories}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected element details */}
      {selectedElement && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Selected Element:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Code:</span> {selectedElement.code}
            </div>
            <div>
              <span className="font-medium">Name:</span> {selectedElement.name}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Description:</span> {selectedElement.description}
            </div>
            <div>
              <span className="font-medium">Level:</span> {selectedElement.level}
            </div>
            <div>
              <span className="font-medium">Estimated Cost:</span> ${selectedElement.estimatedCost?.toLocaleString() || '0'}
            </div>
            {costCategories.find(cat => cat.id === selectedElement.costCategoryId) && (
              <div>
                <span className="font-medium">Cost Category:</span> {costCategories.find(cat => cat.id === selectedElement.costCategoryId)?.name}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Element Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title={editingElement ? 'Edit BOE Element' : 'Add BOE Element'}
      >
        <BOEElementModal
          element={editingElement}
          parentId={addingToParentId}
          onSave={handleModalSave}
          onCancel={handleModalClose}
        />
      </Modal>

      {/* Import WBS Template Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import WBS Template"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a WBS template to import into your BOE. This will add all template elements as BOE elements.
          </p>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {wbsTemplates.map(template => (
              <div
                key={template.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleImportTemplate(template.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <p className="text-xs text-gray-500">{template.elementCount} elements</p>
                  </div>
                  {template.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Importing template...</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Push to Program WBS Modal */}
      <Modal
        isOpen={pushToProgramModalOpen}
        onClose={() => setPushToProgramModalOpen(false)}
        title="Push BOE WBS to Program"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important</h4>
            <p className="text-sm text-yellow-700">
              This action will push the current BOE WBS structure to the program's WBS settings. 
              Any existing program WBS elements with the same codes will be updated, and new elements will be created.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Summary</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {elements.length} BOE elements to push</li>
              <li>• Total estimated cost: ${totalCost.toLocaleString()}</li>
              <li>• Hierarchical structure will be preserved</li>
            </ul>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setPushToProgramModalOpen(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePushToProgram}
              variant="primary"
              size="sm"
              disabled={loading}
            >
              {loading ? 'Pushing...' : 'Push to Program WBS'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BOEForm; 