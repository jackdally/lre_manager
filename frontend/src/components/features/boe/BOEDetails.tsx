import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { useSettingsStore } from '../../../store/settingsStore';
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
  TrashIcon,
  ArrowsPointingOutIcon
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
  elementAllocations: BOEElementAllocation[];
}

// Utility function to calculate recursive allocation status for parent elements
const calculateElementAllocationStatus = (
  element: BOEElement, 
  elementAllocations: BOEElementAllocation[]
): {
  hasAllocation: boolean;
  isAllocationLocked: boolean;
  isParent: boolean;
  childStatus: {
    total: number;
    allocated: number;
    locked: number;
    notAllocated: number;
  };
  aggregatedStatus: 'all-allocated' | 'partially-allocated' | 'not-allocated' | 'mixed';
} => {
  // Check if this element has children
  const hasChildren = element.childElements && element.childElements.length > 0;
  
  if (!hasChildren) {
    // Leaf element - check direct allocation
    const elementAllocation = elementAllocations.find(allocation => allocation.boeElementId === element.id);
    const hasAllocation = !!elementAllocation;
    const isAllocationLocked = elementAllocation?.isLocked || false;
    
    return {
      hasAllocation,
      isAllocationLocked,
      isParent: false,
      childStatus: {
        total: 1,
        allocated: hasAllocation ? 1 : 0,
        locked: isAllocationLocked ? 1 : 0,
        notAllocated: hasAllocation ? 0 : 1
      },
      aggregatedStatus: hasAllocation ? (isAllocationLocked ? 'all-allocated' : 'partially-allocated') : 'not-allocated'
    };
  }
  
  // Parent element - calculate aggregated status from children
  let totalChildren = 0;
  let allocatedChildren = 0;
  let lockedChildren = 0;
  let notAllocatedChildren = 0;
  
  const processChildren = (children: BOEElement[]) => {
    children.forEach(child => {
      const childStatus = calculateElementAllocationStatus(child, elementAllocations);
      totalChildren += childStatus.childStatus.total;
      allocatedChildren += childStatus.childStatus.allocated;
      lockedChildren += childStatus.childStatus.locked;
      notAllocatedChildren += childStatus.childStatus.notAllocated;
    });
  };
  
  processChildren(element.childElements!);
  
  // Determine aggregated status
  let aggregatedStatus: 'all-allocated' | 'partially-allocated' | 'not-allocated' | 'mixed';
  if (lockedChildren === totalChildren) {
    aggregatedStatus = 'all-allocated';
  } else if (notAllocatedChildren === totalChildren) {
    aggregatedStatus = 'not-allocated';
  } else if (allocatedChildren > 0 && notAllocatedChildren > 0) {
    aggregatedStatus = 'mixed';
  } else {
    aggregatedStatus = 'partially-allocated';
  }
  
  return {
    hasAllocation: allocatedChildren > 0,
    isAllocationLocked: lockedChildren === totalChildren,
    isParent: true,
    childStatus: {
      total: totalChildren,
      allocated: allocatedChildren,
      locked: lockedChildren,
      notAllocated: notAllocatedChildren
    },
    aggregatedStatus
  };
};

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
  elementAllocations
}) => {
  const isExpanded = expandedItems.has(element.id);
  const hasChildren = element.childElements && element.childElements.length > 0;
  const isSelected = selectedElementId === element.id;

  // Calculate allocation status (recursive for parent elements)
  const allocationStatus = calculateElementAllocationStatus(element, elementAllocations);

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpand(element.id);
    }
  };

  const handleSelect = () => {
    onElementSelect(element);
  };

  // Get cost category name
  const costCategory = costCategories.find(cat => cat.id === element.costCategoryId);

  // Enhanced allocation status indicator with parent aggregation
  const getAllocationStatusIcon = () => {
    if (allocationStatus.isParent) {
      // Parent element - show aggregated status
      const { total, allocated, locked, notAllocated } = allocationStatus.childStatus;
      
      switch (allocationStatus.aggregatedStatus) {
        case 'all-allocated':
          return (
            <div className="flex items-center space-x-1" title={`All ${total} children allocated and locked`}>
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">{total}</span>
            </div>
          );
        case 'partially-allocated':
          return (
            <div className="flex items-center space-x-1" title={`${allocated} of ${total} children allocated`}>
              <ClockIcon className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">{allocated}/{total}</span>
            </div>
          );
        case 'mixed':
          return (
            <div className="flex items-center space-x-1" title={`${allocated} allocated, ${locked} locked, ${notAllocated} not allocated`}>
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-600 font-medium">{allocated}/{total}</span>
            </div>
          );
        case 'not-allocated':
          return (
            <div className="flex items-center space-x-1" title={`None of ${total} children allocated`}>
              <div className="w-4 h-4 rounded-full bg-gray-300 border border-gray-400" />
              <span className="text-xs text-gray-500 font-medium">{total}</span>
            </div>
          );
      }
    } else {
      // Leaf element - show individual status
      if (!allocationStatus.hasAllocation) {
        return <div className="w-4 h-4 rounded-full bg-gray-300 border border-gray-400" title="No allocation" />;
      }
      if (allocationStatus.isAllocationLocked) {
        return <CheckCircleIcon className="w-4 h-4 text-green-600" title="Allocation locked" />;
      }
      return <ClockIcon className="w-4 h-4 text-blue-600" title="Allocation active" />;
    }
  };

  // Status summary for parent elements
  const getStatusSummary = () => {
    if (!allocationStatus.isParent) return null;
    
    const { total, allocated, locked, notAllocated } = allocationStatus.childStatus;
    const parts = [];
    
    if (locked > 0) parts.push(`${locked} locked`);
    if (allocated - locked > 0) parts.push(`${allocated - locked} active`);
    if (notAllocated > 0) parts.push(`${notAllocated} not allocated`);
    
    return (
      <div className="text-xs text-gray-500 ml-2">
        ({parts.join(', ')})
      </div>
    );
  };

  return (
    <div className="boe-tree-item">
      <div 
        className={`flex items-center py-2 px-3 hover:bg-blue-50 cursor-pointer border-l-4 transition-all duration-200 group ${
          isSelected 
            ? 'bg-blue-100 border-blue-500 shadow-sm' 
            : 'border-transparent hover:border-blue-300 hover:shadow-sm'
        } ${allocationStatus.isParent ? 'font-medium' : ''}`}
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
        <div className="mr-2 w-16 flex justify-center">
          {getAllocationStatusIcon()}
        </div>

        {/* Element Code */}
        <span className="text-sm font-mono text-gray-600 mr-3 min-w-[60px]">
          {element.code}
        </span>

        {/* Element Name with Status Summary */}
        <div className="flex-1 flex items-center">
          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
            {element.name}
          </span>
          {getStatusSummary()}
        </div>

        {/* Estimated Cost - show actual estimated cost (not allocation-based), aggregated for parents */}
        <span className="text-sm text-gray-600 mr-4 min-w-[100px] text-right">
          {(() => {
            if (hasChildren) {
              // Parent: sum estimated costs from all leaf descendants
              let total = 0;
              const sumLeafEstimates = (children: BOEElement[]) => {
                children.forEach(child => {
                  const isLeaf = !child.childElements || child.childElements.length === 0;
                  if (isLeaf) {
                    total += safeNumber(child.estimatedCost);
                  } else {
                    sumLeafEstimates(child.childElements!);
                  }
                });
              };
              sumLeafEstimates(element.childElements!);
              return (
                <>
                  {formatCurrency(total)}
                  <span className="ml-1 text-gray-400" aria-label="Sum of children" title="Sum of children">
                    Σ
                  </span>
                </>
              );
            }
            return formatCurrency(element.estimatedCost || 0);
          })()}
        </span>

        {/* Allocated Cost - sum of allocations, aggregated for parents */}
        <span className="text-sm text-gray-600 mr-4 min-w-[100px] text-right">
          {(() => {
            // Calculate allocated cost for this element
            const getElementAllocatedCost = (el: BOEElement): number => {
              const hasChildren = el.childElements && el.childElements.length > 0;
              
              if (!hasChildren) {
                // Leaf: sum allocations for this element
                const elementAllocs = elementAllocations.filter(a => a.boeElementId === el.id);
                return elementAllocs.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
              }
              
              // Parent: sum allocated costs from all leaf descendants
              let total = 0;
              const sumLeafAllocations = (children: BOEElement[]) => {
                children.forEach(child => {
                  const isLeaf = !child.childElements || child.childElements.length === 0;
                  if (isLeaf) {
                    const childAllocs = elementAllocations.filter(a => a.boeElementId === child.id);
                    total += childAllocs.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
                  } else {
                    sumLeafAllocations(child.childElements!);
                  }
                });
              };
              sumLeafAllocations(el.childElements!);
              return total;
            };
            
            const allocated = getElementAllocatedCost(element);
            if (allocated > 0) {
              return (
                <>
                  {formatCurrency(allocated)}
                  {hasChildren && (
                    <span className="ml-1 text-gray-400" aria-label="Sum of allocated children" title="Sum of allocated children">
                      Σ
                    </span>
                  )}
                </>
              );
            }
            return <span className="text-gray-400">—</span>;
          })()}
        </span>

        {/* Cost Category */}
        <span className="text-xs text-gray-500 mr-4 min-w-[120px]">
          {hasChildren 
            ? <span className="text-gray-400">N/A</span>
            : (costCategory?.name || 'Unassigned')
          }
        </span>

        {/* Click indicator */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

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
  
  // Load cost categories from settings store
  const { costCategories, fetchCostCategories } = useSettingsStore();
  
  // Modal state management
  const [modalOpen, setModalOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<BOEElement | null>(null);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [elementToDelete, setElementToDelete] = useState<BOEElement | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Default to 700px, but check saved value first
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      // Use saved width if it's reasonable (between 300 and 1200)
      if (width >= 300 && width <= 1200) {
        return width;
      }
    }
    return 700; // Default to 700px
  });
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<string>>(new Set(['cost-category'])); // Default to cost category expanded
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Calculate real-time totals and breakdowns
  const calculationResult = useMemo((): BOECalculationResult => {
    if (!elements || elements.length === 0) {
      return {
        totalEstimatedCost: 0,
        totalAllocatedCost: 0,
        managementReserveAmount: 0,
        managementReservePercentage: 10,
        totalWithMR: 0,
        elementCount: 0,
        requiredElementCount: 0,
        optionalElementCount: 0,
        costCategoryBreakdown: [],
        levelBreakdown: [],
        reconciliationIssues: []
      };
    }
    
    // Build hierarchical structure for calculations
    const hierarchicalElements = BOECalculationService.buildHierarchicalStructure(elements);
    return BOECalculationService.calculateBOETotals(
      hierarchicalElements, 
      currentBOE?.managementReservePercentage || 10,
      elementAllocations || []
    );
  }, [elements, currentBOE?.managementReservePercentage, elementAllocations]);

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

  // Load cost categories on mount
  useEffect(() => {
    fetchCostCategories();
  }, [fetchCostCategories]);

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

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const currentMinWidth = screenWidth >= 1024 ? 350 : 300;
      const currentMaxWidth = Math.max(screenWidth * 0.9, 1200); // Allow up to 90% of screen or 1200px, whichever is larger
      
      // Adjust sidebar width if it's outside the new bounds
      if (sidebarWidth < currentMinWidth) {
        setSidebarWidth(currentMinWidth);
      } else if (sidebarWidth > currentMaxWidth) {
        setSidebarWidth(currentMaxWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarWidth]);

  // Note: Sidebar width initialization now happens in useState above

  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

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
      setHasUnsavedChanges(false);
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
    setSidebarOpen(true);
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
        setHasUnsavedChanges(true);
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
          setHasUnsavedChanges(true);
        } else {
          // Add as root element
          setElements([...elements, newElement]);
          setHasUnsavedChanges(true);
        }
      }
      
      setModalOpen(false);
      setEditingElement(null);
      setAddingToParentId(null);
      
      // Reload BOE data to ensure cost categories and vendors are reflected
      await loadBOEData();
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
        setHasUnsavedChanges(true);
      
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




  const toggleBreakdown = (breakdownId: string) => {
    const newExpanded = new Set(expandedBreakdowns);
    if (newExpanded.has(breakdownId)) {
      newExpanded.delete(breakdownId);
    } else {
      newExpanded.add(breakdownId);
    }
    setExpandedBreakdowns(newExpanded);
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
            <>
              <Button
                onClick={() => setIsEditing(true)}
                variant="secondary"
                size="sm"
              >
                Edit BOE
              </Button>
            </>
          )}
          
          {isEditing && (
            <>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setHasUnsavedChanges(false);
                }}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Saving...' : hasUnsavedChanges ? 'Save Changes*' : 'Save Changes'}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Estimated Total
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(calculationResult.totalEstimatedCost)}
              </p>
              {calculationResult.totalAllocatedCost > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {calculationResult.reconciliationIssues.length > 0 && (
                    <span className="text-yellow-600">
                      {calculationResult.reconciliationIssues.length} reconciliation issue{calculationResult.reconciliationIssues.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              )}
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

        {calculationResult.totalAllocatedCost > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Allocations Total</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(calculationResult.totalAllocatedCost)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reconciliation Issues Alert */}
      {calculationResult.reconciliationIssues.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Reconciliation Issues</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Some elements have allocation totals that differ from their initial estimates:
              </p>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                {calculationResult.reconciliationIssues.slice(0, 5).map((issue, index) => (
                  <li key={index}>
                    <strong>{issue.elementCode} {issue.elementName}</strong>: 
                    {' '}Est. {formatCurrency(issue.estimatedCost)} → 
                    {' '}Allocated {formatCurrency(issue.allocatedTotal)} 
                    ({issue.difference > 0 ? '+' : ''}{formatCurrency(issue.difference)})
                  </li>
                ))}
                {calculationResult.reconciliationIssues.length > 5 && (
                  <li className="text-yellow-600 italic">
                    ...and {calculationResult.reconciliationIssues.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* WBS Section */}
      <div className="mb-8">
        {/* Section Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
            <span>Work Breakdown Structure</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Hierarchical project structure with allocation status indicators
          </p>
        </div>

        {/* Full-Width WBS Tree with Slide-out Sidebar */}
        <div className="relative">
          {/* Main WBS Tree */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">WBS Elements</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Click on any element to view and manage its allocations in the sidebar
                  </p>
                </div>
                {selectedElement && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Selected: <span className="font-medium text-gray-900">{selectedElement.name}</span>
                    </span>
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {sidebarOpen ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          
          <div className="p-4">
            {/* WBS Tree Header */}
            <div className="flex items-center py-2 px-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="w-6 mr-2" />
              <div className="w-16 mr-2 text-center">Status</div>
              <span className="mr-4 min-w-[60px]">Code</span>
              <span className="flex-1 min-w-[200px]">Name</span>
              <span className="mr-4 min-w-[100px] text-right">Est. Cost</span>
              <span className="mr-4 min-w-[100px] text-right">Allocated</span>
              <span className="mr-4 min-w-[120px]">Category</span>
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
                    elementAllocations={elementAllocations}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Slide-out Sidebar */}
        <div 
          className={`fixed inset-y-0 right-0 z-50 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ width: `${sidebarWidth}px` }}
          ref={sidebarRef}
        >
          {/* Drag Handle for Resizing */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors duration-200"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = sidebarWidth;
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = startX - moveEvent.clientX;
                const screenWidth = window.innerWidth;
                const minWidth = screenWidth >= 1024 ? 350 : 300;
                const maxWidth = Math.max(screenWidth * 0.9, 1200); // Allow up to 90% of screen or 1200px, whichever is larger
                const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
                setSidebarWidth(newWidth);
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
            title="Drag to resize sidebar"
          >
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-400 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200" />
          </div>

          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-medium text-gray-900 truncate">Element Allocations</h4>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                {/* Resize Indicator */}
                <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                  {sidebarWidth}px
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 p-1"
                  title="Close sidebar"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Sidebar Content - Optimized Layout */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedElement ? (
                <div className="flex-1 overflow-hidden">
                  <BOEElementAllocationManager 
                    boeVersionId={currentBOE.id}
                    selectedElementId={selectedElement.id}
                    selectedElementName={selectedElement.name}
                    selectedElement={selectedElement}
                    sidebarWidth={sidebarWidth}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center text-gray-500">
                    <ClockIcon className="mx-auto h-12 w-12 mb-4" />
                    <p className="text-sm">Select a WBS element to view and manage its allocations</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-25 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>

      {/* Cost Breakdown Section */}
      {(calculationResult.costCategoryBreakdown.length > 0 || calculationResult.levelBreakdown.length > 0) && (
        <div className="mt-8">
          {/* Section Header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              <span>Cost Breakdown</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Detailed cost analysis by category and WBS level
            </p>
          </div>

          {/* Cost Breakdowns - Collapsible Sections */}
          <div className="space-y-4">
            {/* Cost Category Breakdown */}
            {calculationResult.costCategoryBreakdown.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleBreakdown('cost-category')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <ChartBarIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-medium text-gray-900">Cost Category Breakdown</h4>
                    <span className="text-sm text-gray-500">
                      ({calculationResult.costCategoryBreakdown.length} categories)
                    </span>
                  </div>
                  {expandedBreakdowns.has('cost-category') ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {expandedBreakdowns.has('cost-category') && (
                  <div className="px-6 pb-6">
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
                              Estimated Costs
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Allocated
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {calculationResult.costCategoryBreakdown.map((category) => {
                            // Look up the actual category name from costCategories
                            const actualCategory = costCategories.find(cat => cat.id === category.costCategoryId);
                            const displayName = actualCategory 
                              ? actualCategory.name 
                              : category.costCategoryId === 'uncategorized' 
                                ? 'Uncategorized' 
                                : category.costCategoryName;
                            
                            return (
                              <tr key={category.costCategoryId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {displayName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {category.elementCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(category.estimatedCost)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {category.allocatedCost > 0 
                                    ? formatCurrency(category.allocatedCost)
                                    : <span className="text-gray-400">—</span>
                                  }
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Level Breakdown */}
            {calculationResult.levelBreakdown.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleBreakdown('level')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <UserGroupIcon className="h-5 w-5 text-green-600" />
                    <h4 className="text-lg font-medium text-gray-900">Level Breakdown</h4>
                    <span className="text-sm text-gray-500">
                      ({calculationResult.levelBreakdown.length} levels)
                    </span>
                  </div>
                  {expandedBreakdowns.has('level') ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {expandedBreakdowns.has('level') && (
                  <div className="px-6 pb-6">
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
                              Estimated Costs
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Allocated
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {level.allocatedCost > 0 
                                  ? formatCurrency(level.allocatedCost)
                                  : <span className="text-gray-400">—</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
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