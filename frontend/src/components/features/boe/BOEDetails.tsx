import React, { useState, useEffect, useMemo } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { boeVersionsApi, boeElementsApi, elementAllocationApi } from '../../../services/boeApi';
import BOECalculationService, { BOECalculationResult } from '../../../services/boeCalculationService';
import BOEForm from './BOEForm';
import BOEElementAllocationManager from './BOEElementAllocationManager';
import BOEElementModal from './BOEElementModal';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import { formatCurrency, safeNumber } from '../../../utils/currencyUtils';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { BOEElement, BOEElementAllocation } from '../../../store/boeStore';

interface BOEDetailsProps {
  programId: string;
}

interface BOETreeItemProps {
  element: BOEElement;
  level: number;
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onElementSelect: (element: BOEElement) => void;
  selectedElementId?: string;
  onEdit: (element: BOEElement) => void;
  onDelete: (element: BOEElement) => void;
  onAddChild: (parentId: string) => void;
  isReadOnly?: boolean;
  costCategories: any[];
  vendors: any[];
  elementAllocations: BOEElementAllocation[];
}

// Enhanced BOETreeItem with allocation status indicators
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
  costCategories,
  vendors,
  elementAllocations
}) => {
  const isExpanded = expandedItems.has(element.id);
  const hasChildren = element.childElements && element.childElements.length > 0;
  const isSelected = selectedElementId === element.id;

  // Check allocation status
  const elementAllocation = elementAllocations.find(allocation => allocation.boeElementId === element.id);
  const hasAllocation = !!elementAllocation;
  const isAllocationLocked = elementAllocation?.isLocked || false;

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpand(element.id);
    }
  };

  const handleSelect = () => {
    onElementSelect(element);
  };

  // Get cost category and vendor names
  const costCategory = costCategories.find(cat => cat.id === element.costCategoryId);
  const vendor = vendors.find(v => v.id === element.vendorId);

  // Allocation status indicator
  const getAllocationStatusIcon = () => {
    if (!hasAllocation) {
      return <div className="w-3 h-3 rounded-full bg-gray-300 border border-gray-400" title="No allocation" />;
    }
    if (isAllocationLocked) {
      return <CheckCircleIcon className="w-4 h-4 text-green-600" title="Allocation locked" />;
    }
    return <ClockIcon className="w-4 h-4 text-blue-600" title="Allocation active" />;
  };

  return (
    <div className="boe-tree-item">
      <div 
        className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer border-l-4 transition-colors ${
          isSelected 
            ? 'bg-blue-100 border-blue-500' 
            : 'border-transparent hover:border-gray-300'
        }`}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
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

        {/* Allocation Status Indicator */}
        <div className="mr-2">
          {getAllocationStatusIcon()}
        </div>

        {/* Element Code */}
        <span className="text-sm font-mono text-gray-600 mr-3 min-w-[60px]">
          {element.code}
        </span>

        {/* Element Name */}
        <span className="text-sm font-medium text-gray-900 flex-1">
          {element.name}
        </span>

        {/* Estimated Cost */}
        <span className="text-sm text-gray-600 mr-3 min-w-[80px] text-right">
          {formatCurrency(element.estimatedCost)}
        </span>

        {/* Cost Category */}
        <span className="text-xs text-gray-500 mr-3 min-w-[100px]">
          {costCategory?.name || 'Unassigned'}
        </span>

        {/* Vendor */}
        <span className="text-xs text-gray-500 mr-3 min-w-[100px]">
          {vendor?.name || 'Unassigned'}
        </span>

        {/* Actions */}
        {!isReadOnly && (
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(element);
              }}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900"
              title="Edit element"
            >
              <PencilIcon className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(element.id);
              }}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900"
              title="Add child element"
            >
              <PlusIcon className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(element);
              }}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-red-600"
              title="Delete element"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        <div className="ml-6">
          {element.childElements!.map((child) => (
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
              vendors={vendors}
              elementAllocations={elementAllocations}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BOEDetails: React.FC<BOEDetailsProps> = ({ programId }) => {
  const { 
    currentBOE, 
    elements, 
    setElements, 
    setElementsLoading, 
    setElementsError,
    setCurrentBOE,
    elementAllocations,
    setElementAllocations,
    setElementAllocationsLoading,
    setElementAllocationsError
  } = useBOEStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedElement, setSelectedElement] = useState<BOEElement | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [costCategories, setCostCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  
  // Modal state management
  const [modalOpen, setModalOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<BOEElement | null>(null);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [elementToDelete, setElementToDelete] = useState<BOEElement | null>(null);

  // Calculate real-time totals and breakdowns
  const calculationResult = useMemo((): BOECalculationResult => {
    if (!elements || elements.length === 0) {
      return {
        totalEstimatedCost: 0,
        totalActualCost: 0,
        totalVariance: 0,
        managementReserveAmount: 0,
        managementReservePercentage: 10,
        totalWithMR: 0,
        elementCount: 0,
        requiredElementCount: 0,
        optionalElementCount: 0,
        costCategoryBreakdown: [],
        levelBreakdown: []
      };
    }
    
    // Build hierarchical structure for calculations
    const hierarchicalElements = BOECalculationService.buildHierarchicalStructure(elements);
    return BOECalculationService.calculateBOETotals(hierarchicalElements, currentBOE?.managementReservePercentage || 10);
  }, [elements, currentBOE?.managementReservePercentage]);

  // Validate BOE structure
  const validationResult = useMemo(() => {
    if (!elements || elements.length === 0) {
      return { isValid: true, errors: [] };
    }
    // Build hierarchical structure for validation
    const hierarchicalElements = BOECalculationService.buildHierarchicalStructure(elements);
    return BOECalculationService.validateBOEStructure(hierarchicalElements);
  }, [elements]);

  // Update validation errors when validation result changes
  useEffect(() => {
    setValidationErrors(validationResult.errors);
  }, [validationResult]);

  // Load BOE data when component mounts
  useEffect(() => {
    loadBOEData();
  }, [programId]);

  // Load element allocations when BOE changes
  useEffect(() => {
    if (currentBOE?.id) {
      loadElementAllocations();
    }
  }, [currentBOE?.id]);

  const loadBOEData = async () => {
    try {
      setLoading(true);
      setElementsLoading(true);
      
      // Load current BOE for program
      const boeSummary = await boeVersionsApi.getCurrentBOE(programId);
      
      if (boeSummary.hasBOE && boeSummary.currentBOE) {
        setCurrentBOE(boeSummary.currentBOE);
        
        // Load BOE elements
        if (boeSummary.currentBOE.elements) {
          setElements(boeSummary.currentBOE.elements);
        }
      }
    } catch (error) {
      console.error('Error loading BOE data:', error);
      setElementsError('Failed to load BOE data');
    } finally {
      setLoading(false);
      setElementsLoading(false);
    }
  };

  const loadElementAllocations = async () => {
    if (!currentBOE?.id) return;

    try {
      setElementAllocationsLoading(true);
      setElementAllocationsError(null);
      
      const allocations = await elementAllocationApi.getElementAllocations(currentBOE.id);
      setElementAllocations(allocations);
    } catch (error) {
      console.error('Error loading element allocations:', error);
      setElementAllocationsError('Failed to load element allocations');
    } finally {
      setElementAllocationsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Save BOE elements
      await boeElementsApi.bulkUpdateElements(currentBOE!.id, elements);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving BOE:', error);
      setElementsError('Failed to save BOE');
    } finally {
      setLoading(false);
    }
  };

  const handleElementsChange = (newElements: any[]) => {
    setElements(newElements);
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

  const handleElementSelect = (element: BOEElement) => {
    setSelectedElement(element);
  };

  const handleEdit = (element: BOEElement) => {
    setEditingElement(element);
    setAddingToParentId(null);
    setModalOpen(true);
  };

  const handleDelete = (element: BOEElement) => {
    setElementToDelete(element);
    setDeleteConfirmOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setEditingElement(null);
    setAddingToParentId(parentId);
    setModalOpen(true);
  };

  const handleSaveElement = async (elementData: BOEElement) => {
    try {
      setLoading(true);
      
      if (editingElement) {
        // Update existing element
        const updatedElement = await boeElementsApi.updateElement(editingElement.id, elementData);
        
        // Update elements array
        const updateElementInArray = (elements: BOEElement[], updatedElement: BOEElement): BOEElement[] => {
          return elements.map(element => {
            if (element.id === updatedElement.id) {
              return updatedElement;
            }
            if (element.childElements) {
              element.childElements = updateElementInArray(element.childElements, updatedElement);
            }
            return element;
          });
        };
        
        const updatedElements = updateElementInArray(elements, updatedElement);
        setElements(updatedElements);
      } else {
        // Create new element
        const newElement = await boeElementsApi.createElement(currentBOE!.id, elementData);
        
        // Add to elements array
        if (addingToParentId) {
          // Add as child
          const addChildToParent = (elements: BOEElement[], parentId: string, newElement: BOEElement): BOEElement[] => {
            return elements.map(element => {
              if (element.id === parentId) {
                return {
                  ...element,
                  childElements: [...(element.childElements || []), newElement]
                };
              }
              if (element.childElements) {
                element.childElements = addChildToParent(element.childElements, parentId, newElement);
              }
              return element;
            });
          };
          
          const updatedElements = addChildToParent(elements, addingToParentId, newElement);
          setElements(updatedElements);
        } else {
          // Add as root element
          setElements([...elements, newElement]);
        }
      }
      
      setModalOpen(false);
      setEditingElement(null);
      setAddingToParentId(null);
    } catch (error) {
      console.error('Error saving element:', error);
      setElementsError('Failed to save element');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!elementToDelete) return;
    
    try {
      setLoading(true);
      
      // Delete from API
      await boeElementsApi.deleteElement(elementToDelete.id);
      
      // Remove from elements array
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
      
      const updatedElements = removeElementAndChildren(elements, elementToDelete.id);
      setElements(updatedElements);
      
      // Clear selection if deleted element was selected
      if (selectedElement?.id === elementToDelete.id) {
        setSelectedElement(null);
      }
      
      setDeleteConfirmOpen(false);
      setElementToDelete(null);
    } catch (error) {
      console.error('Error deleting element:', error);
      setElementsError('Failed to delete element');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelModal = () => {
    setModalOpen(false);
    setEditingElement(null);
    setAddingToParentId(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setElementToDelete(null);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
    if (variance < 0) return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
    return <CurrencyDollarIcon className="h-6 w-6 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading BOE details...</p>
        </div>
      </div>
    );
  }

  if (!currentBOE) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ChartBarIcon className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No BOE Found</h3>
          <p className="text-gray-500 mb-6">
            This program doesn't have a BOE yet. Create one to get started.
          </p>
          <Button
            onClick={() => {/* TODO: Navigate to BOE creation */}}
            variant="primary"
            size="md"
          >
            Create BOE
          </Button>
        </div>
      </div>
    );
  }

  // Build hierarchical structure for display
  const hierarchicalElements = BOECalculationService.buildHierarchicalStructure(elements);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">BOE Details</h3>
          <p className="text-sm text-gray-600">
            Version {currentBOE.versionNumber} • {currentBOE.status} • 
            Total: {formatCurrency(calculationResult.totalEstimatedCost)}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="secondary"
              size="sm"
            >
              Edit BOE
            </Button>
          )}
          
          {isEditing && (
            <>
              <Button
                onClick={() => setIsEditing(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                size="sm"
                disabled={loading || !validationResult.isValid}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Calculation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Estimated</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(calculationResult.totalEstimatedCost)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Actual</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(calculationResult.totalActualCost)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            {getVarianceIcon(calculationResult.totalVariance)}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Variance</p>
              <p className={`text-lg font-bold ${getVarianceColor(calculationResult.totalVariance)}`}>
                {formatCurrency(calculationResult.totalVariance)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Elements</p>
              <p className="text-lg font-bold text-gray-900">
                {calculationResult.elementCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: WBS Tree */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Work Breakdown Structure</h4>
            <p className="text-sm text-gray-600 mt-1">
              Click on an element to view its allocation details
            </p>
          </div>
          
          <div className="p-4">
            {/* WBS Tree Header */}
            <div className="flex items-center py-2 px-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="w-6 mr-2" />
              <div className="w-4 mr-2" /> {/* Allocation status */}
              <span className="mr-3 min-w-[60px]">Code</span>
              <span className="flex-1">Name</span>
              <span className="mr-3 min-w-[80px] text-right">Est. Cost</span>
              <span className="mr-3 min-w-[100px]">Category</span>
              <span className="mr-3 min-w-[100px]">Vendor</span>
            </div>

            {/* WBS Tree */}
            <div className="max-h-96 overflow-y-auto">
              {hierarchicalElements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No WBS elements found</p>
                </div>
              ) : (
                hierarchicalElements.map((element) => (
                  <BOETreeItem
                    key={element.id}
                    element={element}
                    level={0}
                    expandedItems={expandedItems}
                    onToggleExpand={handleToggleExpand}
                    onElementSelect={handleElementSelect}
                    selectedElementId={selectedElement?.id}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                    isReadOnly={!isEditing}
                    costCategories={costCategories}
                    vendors={vendors}
                    elementAllocations={elementAllocations}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Allocation Details */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Element Allocations</h4>
            <p className="text-sm text-gray-600 mt-1">
              {selectedElement ? `Allocation details for ${selectedElement.name}` : 'Select an element to view allocations'}
            </p>
          </div>
          
          <div className="p-4">
            {selectedElement ? (
              <BOEElementAllocationManager 
                boeVersionId={currentBOE.id}
                selectedElementId={selectedElement.id}
                selectedElementName={selectedElement.name}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ClockIcon className="mx-auto h-12 w-12 mb-4" />
                <p>Select a WBS element to view and manage its allocations</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost Category Breakdown */}
      {calculationResult.costCategoryBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Cost Category Breakdown</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Elements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calculationResult.costCategoryBreakdown.map((category) => (
                  <tr key={category.costCategoryId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.costCategoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.elementCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.estimatedCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.actualCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={getVarianceColor(category.variance)}>
                        {formatCurrency(category.variance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Level Breakdown */}
      {calculationResult.levelBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Level Breakdown</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Elements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calculationResult.levelBreakdown.map((level) => (
                  <tr key={level.level}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Level {level.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {level.elementCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(level.estimatedCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(level.actualCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={getVarianceColor(level.variance)}>
                        {formatCurrency(level.variance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Element Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={handleCancelModal}
          title={editingElement ? 'Edit Element' : 'Add Element'}
        >
          <BOEElementModal
            element={editingElement}
            parentId={addingToParentId}
            onSave={handleSaveElement}
            onCancel={handleCancelModal}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <Modal
          isOpen={deleteConfirmOpen}
          onClose={handleCancelDelete}
          title="Confirm Deletion"
        >
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{elementToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleCancelDelete}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant="danger"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BOEDetails; 