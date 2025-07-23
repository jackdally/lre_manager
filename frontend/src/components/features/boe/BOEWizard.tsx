import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import BOETemplateSelector from './BOETemplateSelector';
import { BOETemplate, BOEElementAllocation, BOEElement } from '../../../store/boeStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import BOEElementModal from './BOEElementModal';
import { useSettingsStore } from '../../../store/settingsStore';
import Modal from '../../common/Modal';

interface BOEWizardProps {
  programId: string;
  onComplete: (boeData: any) => void;
  onCancel: () => void;
  sourceBOE?: any; // BOE to copy from
  currentBOE?: any; // Current BOE for copy option
}

interface WizardData {
  template?: BOETemplate;
  basicInfo: {
    name: string;
    description: string;
    versionNumber: string;
  };
  wbsStructure: any[];
  costEstimates: any[];
  allocations: BOEElementAllocation[];
  review: boolean;
}

interface AllocationSetupData {
  elementId: string;
  elementName: string;
  estimatedCost: number;
  allocationType: 'Linear' | 'Front-Loaded' | 'Back-Loaded' | 'Custom';
  startDate: string;
  endDate: string;
  totalAmount: number;
  notes: string;
}



// WBS Tree Item Component for Wizard
interface WBSWizardTreeItemProps {
  element: BOEElement;
  level: number;
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (element: BOEElement) => void;
  onDelete: (element: BOEElement) => void;
  onAddChild: (parentId: string) => void;
  costCategories: any[];
  vendors: any[];
}

const WBSWizardTreeItem: React.FC<WBSWizardTreeItemProps> = ({
  element,
  level,
  expandedItems,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild,
  costCategories,
  vendors
}) => {
  const isExpanded = expandedItems.has(element.id);
  const hasChildren = element.childElements && element.childElements.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpand(element.id);
    }
  };

  // Get cost category and vendor names
  const costCategory = costCategories.find(cat => cat.id === element.costCategoryId);
  const vendor = vendors.find(v => v.id === element.vendorId);

  return (
    <div className="boe-tree-item">
      <div 
        className="flex items-center py-2 px-3 hover:bg-blue-50 cursor-pointer border-l-4 transition-all duration-200 group border-transparent hover:border-blue-300 hover:shadow-sm"
        style={{ paddingLeft: `${level * 24 + 8}px` }}
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

        {/* Element Code */}
        <span className="text-sm font-mono text-gray-600 mr-3 min-w-[60px]">
          {element.code}
        </span>

        {/* Element Name */}
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
            {element.name}
          </span>
        </div>

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
      </div>

      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        <div className="ml-6">
          {element.childElements!.map((child) => (
            <WBSWizardTreeItem
              key={child.id}
              element={child}
              level={level + 1}
              expandedItems={expandedItems}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              costCategories={costCategories}
              vendors={vendors}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BOEWizard: React.FC<BOEWizardProps> = ({ programId, onComplete, onCancel, sourceBOE, currentBOE }) => {
  const { wizardStep, wizardData, setWizardStep, setWizardData } = useBOEStore();
  

  

  
  const [currentData, setCurrentData] = useState<WizardData>(() => {
    if (sourceBOE) {
      // Pre-populate with source BOE data
      return {
        template: sourceBOE.template,
        basicInfo: {
          name: `${sourceBOE.name} (Copy)`,
          description: `${sourceBOE.description} - Copy`,
          versionNumber: `${parseFloat(sourceBOE.versionNumber) + 0.1}`.replace(/\.0$/, ''),
        },
        wbsStructure: sourceBOE.elements || [],
        costEstimates: sourceBOE.elements || [],
        allocations: sourceBOE.elementAllocations || [],
        review: false,
      };
    }
    
    return {
    basicInfo: {
      name: '',
      description: '',
      versionNumber: '1.0',
    },
    wbsStructure: [],
    costEstimates: [],
    allocations: [],
    review: false,
    };
  });

  const [allocationSetup, setAllocationSetup] = useState<AllocationSetupData[]>([]);
  const [allocationExpandedItems, setAllocationExpandedItems] = useState<Set<string>>(new Set());
  const [creationMethod, setCreationMethod] = useState<'template' | 'copy' | 'manual' | null>(null);
  
  // WBS Tree state
  const [expandedWBSItems, setExpandedWBSItems] = useState<Set<string>>(new Set());
  const [showWBSElementModal, setShowWBSElementModal] = useState(false);
  const [editingWBSElement, setEditingWBSElement] = useState<BOEElement | null>(null);
  const [editingWBSElementParentId, setEditingWBSElementParentId] = useState<string | null>(null);
  
  // Settings store for cost categories and vendors
  const { costCategories, vendors, fetchCostCategories, fetchVendors } = useSettingsStore();

  // Load cost categories and vendors on mount
  useEffect(() => {
    fetchCostCategories();
    fetchVendors();
  }, [fetchCostCategories, fetchVendors]);

  // Initialize WBS structure based on creation method
  useEffect(() => {
    if (creationMethod === 'copy' && currentBOE) {
      // Copy WBS structure from current BOE
      setCurrentData(prev => ({
        ...prev,
        wbsStructure: currentBOE.elements || []
      }));
    } else if (creationMethod === 'template' && currentData.template) {
      // Initialize with template structure (placeholder - would need template WBS data)
      setCurrentData(prev => ({
        ...prev,
        wbsStructure: []
      }));
    } else if (creationMethod === 'manual') {
      // Start with empty structure
      setCurrentData(prev => ({
        ...prev,
        wbsStructure: []
      }));
    }
  }, [creationMethod, currentBOE, currentData.template]);

  const steps = [
    { id: 0, title: 'Creation Method', description: 'Choose how to create your BOE' },
    { id: 1, title: 'Template Selection', description: 'Choose a BOE template' },
    { id: 2, title: 'Basic Information', description: 'Enter BOE details' },
    { id: 3, title: 'WBS Structure', description: 'Define work breakdown structure' },
    { id: 4, title: 'Cost Verification', description: 'Review and verify costs' },
    { id: 5, title: 'Allocation Planning', description: 'Plan monthly allocations' },
    { id: 6, title: 'Review & Create', description: 'Review and create BOE' },
  ];

  const handleTemplateSelect = (template: BOETemplate) => {
    setCurrentData(prev => ({ ...prev, template }));
  };

  const handleBasicInfoChange = (field: keyof typeof currentData.basicInfo, value: string) => {
    setCurrentData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value }
    }));
  };

  const handleAllocationChange = (elementId: string, field: keyof AllocationSetupData, value: any, allocationIndex: number) => {
    setAllocationSetup(prev => {
      const elementAllocations = prev.filter(a => a.elementId === elementId);
      const otherAllocations = prev.filter(a => a.elementId !== elementId);
      
      if (allocationIndex < elementAllocations.length) {
        const updatedAllocation = { ...elementAllocations[allocationIndex], [field]: value };
        const updatedElementAllocations = [...elementAllocations];
        updatedElementAllocations[allocationIndex] = updatedAllocation;
        return [...otherAllocations, ...updatedElementAllocations];
      }
      
      return prev;
    });
  };

  // WBS Tree functions
  const handleAddWBSRoot = () => {
    setEditingWBSElement(null);
    setEditingWBSElementParentId(null);
    setShowWBSElementModal(true);
  };

  const handleToggleWBSExpand = (id: string) => {
    setExpandedWBSItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEditWBSElement = (element: BOEElement) => {
    setEditingWBSElement(element);
    setEditingWBSElementParentId(element.parentElementId || null);
    setShowWBSElementModal(true);
  };

  const handleDeleteWBSElement = (element: BOEElement) => {
    const removeElementAndChildren = (elements: BOEElement[], elementId: string): BOEElement[] => {
      return elements.filter(el => {
        if (el.id === elementId) return false;
        if (el.childElements) {
          el.childElements = removeElementAndChildren(el.childElements, elementId);
        }
        return true;
      });
    };
    
    setCurrentData(prev => ({
      ...prev,
      wbsStructure: removeElementAndChildren(prev.wbsStructure, element.id)
    }));
  };

  const handleAddWBSChild = (parentId: string) => {
    setEditingWBSElement(null);
    setEditingWBSElementParentId(parentId);
    setShowWBSElementModal(true);
  };

  // Cost verification helper functions
  const calculateTotalCost = (): number => {
    const calculateElementCost = (elements: BOEElement[]): number => {
      return elements.reduce((total, element) => {
        const elementCost = element.estimatedCost || 0;
        const childCost = element.childElements ? calculateElementCost(element.childElements) : 0;
        return total + elementCost + childCost;
      }, 0);
    };
    
    return calculateElementCost(currentData.wbsStructure);
  };

  const getCostBreakdownByCategory = (): Array<{ name: string; total: number }> => {
    const categoryTotals: Record<string, number> = {};
    
    const processElements = (elements: BOEElement[]) => {
      elements.forEach(element => {
        const categoryName = costCategories.find(cat => cat.id === element.costCategoryId)?.name || 'Unassigned';
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + (element.estimatedCost || 0);
        
        if (element.childElements) {
          processElements(element.childElements);
        }
      });
    };
    
    processElements(currentData.wbsStructure);
    
    return Object.entries(categoryTotals).map(([name, total]) => ({ name, total }));
  };

  const getElementsWithCosts = (): number => {
    const countElementsWithCosts = (elements: BOEElement[]): number => {
      return elements.reduce((count, element) => {
        const hasCost = (element.estimatedCost || 0) > 0;
        const childCount = element.childElements ? countElementsWithCosts(element.childElements) : 0;
        return count + (hasCost ? 1 : 0) + childCount;
      }, 0);
    };
    
    return countElementsWithCosts(currentData.wbsStructure);
  };

  const getElementsMissingCosts = (): number => {
    const countElementsMissingCosts = (elements: BOEElement[]): number => {
      return elements.reduce((count, element) => {
        const missingCost = (element.estimatedCost || 0) === 0;
        const childCount = element.childElements ? countElementsMissingCosts(element.childElements) : 0;
        return count + (missingCost ? 1 : 0) + childCount;
      }, 0);
    };
    
    return countElementsMissingCosts(currentData.wbsStructure);
  };

  // Allocation planning helper functions
  const getAllocatedElementsCount = (): number => {
    return allocationSetup.filter(a => a.startDate && a.endDate && a.totalAmount > 0).length;
  };

  const getTotalElementsCount = (): number => {
    const countElements = (elements: BOEElement[]): number => {
      return elements.reduce((count, element) => {
        return count + 1 + (element.childElements ? countElements(element.childElements) : 0);
      }, 0);
    };
    return countElements(currentData.wbsStructure);
  };

  const getTotalAllocatedAmount = (): number => {
    return allocationSetup.reduce((total, allocation) => {
      return total + (allocation.totalAmount || 0);
    }, 0);
  };

  const handleAutoAllocateAll = () => {
    const autoAllocateElement = (element: BOEElement, startDate: string = '') => {
      const elementAllocations = allocationSetup.filter(a => a.elementId === element.id);
      if (element.estimatedCost > 0) {
        // Create new allocation if none exists
        if (elementAllocations.length === 0) {
          handleAddAllocation(element.id);
        }
        
        // Update the first allocation (or newly created one)
        const allocationIndex = 0;
        const endDate = new Date(startDate || new Date());
        endDate.setMonth(endDate.getMonth() + 3); // Default 3-month duration
        
        handleAllocationChange(element.id, 'startDate', startDate || new Date().toISOString().split('T')[0], allocationIndex);
        handleAllocationChange(element.id, 'endDate', endDate.toISOString().split('T')[0], allocationIndex);
        handleAllocationChange(element.id, 'totalAmount', element.estimatedCost, allocationIndex);
        handleAllocationChange(element.id, 'allocationType', 'Linear', allocationIndex);
      }
      
      // Process children with staggered start dates
      if (element.childElements) {
        element.childElements.forEach((child, index) => {
          const childStartDate = new Date(startDate || new Date());
          childStartDate.setMonth(childStartDate.getMonth() + index);
          autoAllocateElement(child, childStartDate.toISOString().split('T')[0]);
        });
      }
    };
    
    currentData.wbsStructure.forEach((element, index) => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + index);
      autoAllocateElement(element, startDate.toISOString().split('T')[0]);
    });
  };

  const handleToggleAllocationExpand = (elementId: string) => {
    setAllocationExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) {
        newSet.delete(elementId);
      } else {
        newSet.add(elementId);
      }
      return newSet;
    });
  };

  const handleAddAllocation = (elementId: string) => {
    const element = findElementById(currentData.wbsStructure, elementId);
    if (element && element.estimatedCost > 0) {
      // Create new allocation with unique ID
      const newAllocation: AllocationSetupData = {
        elementId,
        elementName: element.name,
        estimatedCost: element.estimatedCost,
        allocationType: 'Linear',
        startDate: '',
        endDate: '',
        totalAmount: element.estimatedCost,
        notes: ''
      };
      setAllocationSetup(prev => [...prev, newAllocation]);
      
      // Expand the element to show the allocation form
      setAllocationExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(elementId);
        return newSet;
      });
    }
  };

  const handleRemoveAllocation = (elementId: string, allocationIndex: number) => {
    setAllocationSetup(prev => {
      const elementAllocations = prev.filter(a => a.elementId === elementId);
      const otherAllocations = prev.filter(a => a.elementId !== elementId);
      const updatedElementAllocations = elementAllocations.filter((_, index) => index !== allocationIndex);
      return [...otherAllocations, ...updatedElementAllocations];
    });
  };

  const findElementById = (elements: BOEElement[], elementId: string): BOEElement | null => {
    for (const element of elements) {
      if (element.id === elementId) return element;
      if (element.childElements) {
        const found = findElementById(element.childElements, elementId);
        if (found) return found;
      }
    }
    return null;
  };

  const getValidationWarnings = (): string[] => {
    const warnings: string[] = [];
    
    if (currentData.wbsStructure.length === 0) {
      warnings.push('No WBS elements found. Please add elements in the WBS Structure step.');
      return warnings;
    }
    
    const missingCosts = getElementsMissingCosts();
    if (missingCosts > 0) {
      warnings.push(`${missingCosts} element(s) are missing cost estimates.`);
    }
    
    const totalCost = calculateTotalCost();
    if (totalCost === 0) {
      warnings.push('No cost estimates found. Please add costs to your WBS elements.');
    }
    
    return warnings;
  };

  const handleSaveWBSElement = (elementData: BOEElement) => {
    const updateElementInArray = (elements: BOEElement[], updatedElement: BOEElement): BOEElement[] => {
      return elements.map(el => {
        if (el.id === updatedElement.id) {
          return { ...el, ...updatedElement };
        }
        if (el.childElements) {
          el.childElements = updateElementInArray(el.childElements, updatedElement);
        }
        return el;
      });
    };

    const addChildToParent = (elements: BOEElement[], parentId: string, newElement: BOEElement): BOEElement[] => {
      return elements.map(el => {
        if (el.id === parentId) {
          return {
            ...el,
            childElements: [...(el.childElements || []), newElement]
          };
        }
        if (el.childElements) {
          el.childElements = addChildToParent(el.childElements, parentId, newElement);
        }
        return el;
      });
    };

    if (editingWBSElement) {
      // Update existing element
      setCurrentData(prev => ({
        ...prev,
        wbsStructure: updateElementInArray(prev.wbsStructure, elementData)
      }));
    } else {
      // Add new element
      const newElement = {
        ...elementData,
        id: `temp-${Date.now()}`,
        childElements: []
      };
      
      if (editingWBSElementParentId) {
        // Add as child
        setCurrentData(prev => ({
          ...prev,
          wbsStructure: addChildToParent(prev.wbsStructure, editingWBSElementParentId, newElement)
        }));
      } else {
        // Add as root
        setCurrentData(prev => ({
          ...prev,
          wbsStructure: [...prev.wbsStructure, newElement]
        }));
      }
    }
    
    setShowWBSElementModal(false);
    setEditingWBSElement(null);
    setEditingWBSElementParentId(null);
  };

  const handleNext = () => {
    if (wizardStep < steps.length - 1) {
      let nextStep = wizardStep + 1;
      
      // Skip template step if copying from existing BOE or creating manually
      if (wizardStep === 0 && (creationMethod === 'copy' || creationMethod === 'manual')) {
        nextStep = 2; // Skip to basic info step
      }
      
      setWizardStep(nextStep);
      
      // Initialize allocation setup when moving to allocation step
      if ((wizardStep === 4 || (wizardStep === 0 && (creationMethod === 'copy' || creationMethod === 'manual'))) && currentData.wbsStructure.length > 0) {
        const initialAllocations = currentData.wbsStructure.map(element => ({
          elementId: element.id,
          elementName: element.name,
          estimatedCost: element.estimatedCost || 0,
          allocationType: 'Linear' as const,
          startDate: '',
          endDate: '',
          totalAmount: element.estimatedCost || 0,
          notes: ''
        }));
        setAllocationSetup(initialAllocations);
      }
    }
  };

  const handlePrevious = () => {
    if (wizardStep > 0) {
      let previousStep = wizardStep - 1;
      
      // Skip template step when going backwards if copying from existing BOE or creating manually
      if (previousStep === 1 && (creationMethod === 'copy' || creationMethod === 'manual')) {
        previousStep = 0; // Go back to creation method step
      }
      
      setWizardStep(previousStep);
    }
  };

  const handleComplete = () => {
    const boeData = {
      programId,
      templateId: currentData.template?.id,
      ...currentData.basicInfo,
      elements: currentData.wbsStructure,
      costEstimates: currentData.costEstimates,
      allocations: allocationSetup.filter(a => a.startDate && a.endDate && a.totalAmount > 0),
    };
    onComplete(boeData);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return creationMethod !== null;
      case 1:
        return creationMethod === 'copy' || creationMethod === 'manual' || !!currentData.template;
      case 2:
        return !!(currentData.basicInfo.name && currentData.basicInfo.description);
      case 3:
        return currentData.wbsStructure.length > 0;
      case 4:
        // Cost verification is complete if there are no validation warnings
        return getValidationWarnings().length === 0 && currentData.wbsStructure.length > 0;
      case 5:
        // At least one allocation must be configured
        return allocationSetup.some(a => a.startDate && a.endDate && a.totalAmount > 0);
      case 6:
        return true;
      default:
        return false;
    }
  };

  const calculateNumberOfMonths = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    return Math.max(1, months + 1);
  };

  const getMonthlyAmount = (totalAmount: number, startDate: string, endDate: string, allocationType: string): number => {
    const months = calculateNumberOfMonths(startDate, endDate);
    if (months === 0) return 0;
    
    switch (allocationType) {
      case 'Linear':
        return totalAmount / months;
      case 'Front-Loaded':
        return (totalAmount * 0.6) / Math.ceil(months * 0.3);
      case 'Back-Loaded':
        return (totalAmount * 0.1) / Math.ceil(months * 0.3);
      default:
        return totalAmount / months;
    }
  };

  // WBS Allocation Item Component for Wizard
  interface WBSAllocationItemProps {
    element: BOEElement;
    level: number;
    allocationSetup: AllocationSetupData[];
    onAllocationChange: (elementId: string, field: keyof AllocationSetupData, value: any, allocationIndex: number) => void;
    onAddAllocation: (elementId: string) => void;
    onRemoveAllocation: (elementId: string, allocationIndex: number) => void;
    onToggleExpand: (elementId: string) => void;
    expandedItems: Set<string>;
    costCategories: any[];
    vendors: any[];
  }

  const WBSAllocationItem: React.FC<WBSAllocationItemProps> = ({
    element,
    level,
    allocationSetup,
    onAllocationChange,
    onAddAllocation,
    onRemoveAllocation,
    onToggleExpand,
    expandedItems,
    costCategories,
    vendors
  }) => {
    const elementAllocations = allocationSetup.filter(a => a.elementId === element.id);
    const hasChildren = element.childElements && element.childElements.length > 0;
    const isExpanded = expandedItems.has(element.id);
    
    // Get cost category and vendor names
    const costCategory = costCategories.find(cat => cat.id === element.costCategoryId);
    const vendor = vendors.find(v => v.id === element.vendorId);

    const getAllocationStatus = () => {
      if (elementAllocations.length === 0) return 'not-allocated';
      const completeAllocations = elementAllocations.filter(a => 
        a.startDate && a.endDate && a.totalAmount > 0
      );
      if (completeAllocations.length === elementAllocations.length) {
        return 'allocated';
      }
      return 'partially-allocated';
    };

    const getStatusIcon = () => {
      const status = getAllocationStatus();
      switch (status) {
        case 'allocated':
          return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
        case 'partially-allocated':
          return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />;
        case 'not-allocated':
          return <div className="w-4 h-4 rounded-full bg-gray-300 border border-gray-400" />;
      }
    };

    const getStatusText = () => {
      const status = getAllocationStatus();
      const allocationCount = elementAllocations.length;
      switch (status) {
        case 'allocated':
          return allocationCount > 1 ? `${allocationCount} Allocations` : 'Allocated';
        case 'partially-allocated':
          return allocationCount > 1 ? `${allocationCount} Partial` : 'Partially Allocated';
        case 'not-allocated':
          return 'Not Allocated';
      }
    };

    return (
      <div className="wbs-allocation-item">
        {/* Element Header */}
        <div 
          className="flex items-center py-3 px-4 hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => onToggleExpand(element.id)}
              className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6 mr-2" />}

          {/* Allocation Status */}
          <div className="mr-3">
            {getStatusIcon()}
          </div>

          {/* Element Code */}
          <span className="text-sm font-mono text-gray-600 mr-3 min-w-[60px]">
            {element.code}
          </span>

          {/* Element Name */}
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">
              {element.name}
            </span>
          </div>

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

          {/* Allocation Status Text */}
          <span className="text-xs font-medium mr-3 min-w-[120px]">
            {getStatusText()}
          </span>

          {/* Add Allocation Button */}
          {element.estimatedCost > 0 && (
            <button
              onClick={() => onAddAllocation(element.id)}
              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              Add Allocation
            </button>
          )}
        </div>

        {/* Allocation Configuration (if element has cost) */}
        {element.estimatedCost > 0 && elementAllocations.length > 0 && (
          <div className="ml-8 mt-3 space-y-3">
            {elementAllocations.map((allocation, index) => (
              <div key={`${element.id}-${index}`} className="bg-gray-50 border border-gray-200 rounded-lg">
                {/* Allocation Header */}
                <div className="p-3 bg-gray-100 border-b border-gray-200 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h6 className="text-sm font-medium text-gray-900">
                      Allocation {index + 1}
                    </h6>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onRemoveAllocation(element.id, index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Remove allocation"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Allocation Form */}
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={allocation.allocationType}
                        onChange={(e) => onAllocationChange(element.id, 'allocationType', e.target.value, index)}
                      >
                        <option value="Linear">Linear</option>
                        <option value="Front-Loaded">Front-Loaded</option>
                        <option value="Back-Loaded">Back-Loaded</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={allocation.startDate}
                        onChange={(e) => onAllocationChange(element.id, 'startDate', e.target.value, index)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={allocation.endDate}
                        onChange={(e) => onAllocationChange(element.id, 'endDate', e.target.value, index)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={allocation.totalAmount}
                        onChange={(e) => onAllocationChange(element.id, 'totalAmount', parseFloat(e.target.value) || 0, index)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  {allocation.startDate && allocation.endDate && allocation.totalAmount > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Monthly Amount:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(getMonthlyAmount(allocation.totalAmount, allocation.startDate, allocation.endDate, allocation.allocationType))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium text-gray-900">
                          {calculateNumberOfMonths(allocation.startDate, allocation.endDate)} months
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      value={allocation.notes}
                      onChange={(e) => onAllocationChange(element.id, 'notes', e.target.value, index)}
                      placeholder="Additional notes about this allocation..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="ml-6 mt-3">
            {element.childElements!.map((child) => (
              <WBSAllocationItem
                key={child.id}
                element={child}
                level={level + 1}
                allocationSetup={allocationSetup}
                onAllocationChange={onAllocationChange}
                onAddAllocation={onAddAllocation}
                onRemoveAllocation={onRemoveAllocation}
                onToggleExpand={onToggleExpand}
                expandedItems={expandedItems}
                costCategories={costCategories}
                vendors={vendors}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (wizardStep) {
      case 0:
        return (
          <div className="wizard-step">
            <h5>Choose Creation Method</h5>
            <p className="text-muted mb-4">
              Select how you'd like to create your new BOE.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Template Option */}
              <div 
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  creationMethod === 'template' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCreationMethod('template')}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                    creationMethod === 'template' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {creationMethod === 'template' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <h6 className="text-lg font-medium text-gray-900">Start from Template</h6>
                </div>
                <p className="text-gray-600 mb-4">
                  Create a new BOE using a predefined template with standard work breakdown structures and cost categories.
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Best for new projects
                </div>
              </div>

              {/* Copy Option */}
              <div 
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  creationMethod === 'copy' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${!currentBOE ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => currentBOE && setCreationMethod('copy')}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                    creationMethod === 'copy' 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {creationMethod === 'copy' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <h6 className="text-lg font-medium text-gray-900">Copy from Current BOE</h6>
                </div>
                <p className="text-gray-600 mb-4">
                  Create a new version based on your existing BOE. All elements, costs, and allocations will be copied.
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Best for updates and revisions
                </div>
                {currentBOE ? (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">Current BOE: {currentBOE.name}</div>
                    <div className="text-sm text-gray-600">Version {currentBOE.versionNumber}</div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">No existing BOE to copy from</div>
                  </div>
                )}
              </div>

              {/* Manual Option */}
              <div 
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  creationMethod === 'manual' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCreationMethod('manual')}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                    creationMethod === 'manual' 
                      ? 'border-purple-500 bg-purple-500' 
                      : 'border-gray-300'
                  }`}>
                    {creationMethod === 'manual' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <h6 className="text-lg font-medium text-gray-900">Create Manually</h6>
                </div>
                <p className="text-gray-600 mb-4">
                  Start with a blank BOE and build your work breakdown structure from scratch. Complete freedom to customize.
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Best for custom projects
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="wizard-step">
            <h5>Template Selection</h5>
            <p className="text-muted mb-4">
              Choose a BOE template to start with. Templates provide predefined work breakdown structures and cost categories.
            </p>
            <BOETemplateSelector
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={currentData.template?.id}
            />
          </div>
        );

      case 2:
        return (
          <div className="wizard-step">
            <h5>Basic Information</h5>
            <p className="text-muted mb-4">
              Provide basic information about your BOE.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BOE Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentData.basicInfo.name}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  placeholder="Enter BOE name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version Number</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentData.basicInfo.versionNumber}
                  onChange={(e) => handleBasicInfoChange('versionNumber', e.target.value)}
                  placeholder="e.g., 1.0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={currentData.basicInfo.description}
                onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                placeholder="Describe the purpose and scope of this BOE"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="wizard-step">
            <h5>Work Breakdown Structure</h5>
            <p className="text-muted mb-4">
              Define the hierarchical structure of your project work elements.
            </p>
            
            {/* WBS Tree Editor */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h6 className="text-gray-900 font-medium">WBS Elements</h6>
                  <button
                    onClick={() => handleAddWBSRoot()}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Root Element
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                {currentData.wbsStructure.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <PlusIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm">No WBS elements yet. Click "Add Root Element" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {currentData.wbsStructure.map((element) => (
                      <WBSWizardTreeItem
                        key={element.id}
                        element={element}
                        level={0}
                        expandedItems={expandedWBSItems}
                        onToggleExpand={handleToggleWBSExpand}
                        onEdit={handleEditWBSElement}
                        onDelete={handleDeleteWBSElement}
                        onAddChild={handleAddWBSChild}
                        costCategories={costCategories}
                        vendors={vendors}
                      />
                    ))}
                  </div>
                )}
            </div>
            </div>
            
          </div>
        );

      case 4:
        return (
          <div className="wizard-step">
            <h5>Cost Verification</h5>
            <p className="text-muted mb-4">
              Review and verify your cost estimates before proceeding to allocation planning.
            </p>
            
            {/* Cost Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h6 className="text-lg font-medium text-gray-900">Cost Summary</h6>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(calculateTotalCost())}
                  </div>
                  <div className="text-sm text-gray-500">
                    Total Estimated Cost
                  </div>
                </div>
              </div>
              
              {/* Cost Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-3">Cost by Category</h6>
                  <div className="space-y-2">
                    {getCostBreakdownByCategory().map((category) => (
                      <div key={category.name} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{category.name}</span>
                        <span className="font-medium">{formatCurrency(category.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-3">WBS Elements</h6>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Elements with Costs</span>
                      <span className="font-medium">{getElementsWithCosts()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Elements Missing Costs</span>
                      <span className="font-medium text-red-600">{getElementsMissingCosts()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Elements</span>
                      <span className="font-medium">{currentData.wbsStructure.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Validation Warnings */}
            {getValidationWarnings().length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <h6 className="text-yellow-900 font-medium">Review Required</h6>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {getValidationWarnings().map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Success State */}
            {getValidationWarnings().length === 0 && currentData.wbsStructure.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h6 className="text-green-900 font-medium">Cost Verification Complete</h6>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  All WBS elements have cost estimates. You're ready to proceed to allocation planning.
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setWizardStep(3)} // Go back to WBS Structure
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit WBS Elements
              </button>
              
              {currentData.wbsStructure.length === 0 && (
                <button
                  onClick={() => setWizardStep(3)} // Go back to WBS Structure
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add WBS Elements
                </button>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="wizard-step">
            <h5>Allocation Planning</h5>
            <p className="text-muted mb-4">
              Plan monthly allocations for your BOE elements. This helps with cash flow planning and project scheduling.
            </p>
            
            {currentData.wbsStructure.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="mx-auto h-12 w-12 mb-4" />
                <p>No WBS elements found. Please complete the previous steps first.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Allocation Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="text-blue-900 font-medium">Allocation Summary</h6>
                      <p className="text-blue-700 text-sm">
                        {getAllocatedElementsCount()} of {getTotalElementsCount()} elements have allocations configured
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-900">
                        {formatCurrency(getTotalAllocatedAmount())}
                      </div>
                      <div className="text-sm text-blue-700">Total Allocated</div>
                    </div>
                  </div>
                  
                  {/* Skip and do later button */}
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-blue-700">
                        <p>You can configure allocations now or skip and do it later in the BOE Details.</p>
                      </div>
                      <button
                        onClick={() => setWizardStep(6)} // Skip to Review & Create
                        className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Skip and Do Later
                      </button>
                    </div>
                  </div>
                </div>

                {/* WBS Elements with Allocation Status */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h6 className="text-gray-900 font-medium">WBS Elements & Allocations</h6>
                    <p className="text-sm text-gray-600">Configure allocations for each WBS element</p>
                  </div>
                  
                  <div className="p-4">
                                         <div className="space-y-3">
                       {currentData.wbsStructure.map((element) => (
                         <WBSAllocationItem
                           key={element.id}
                           element={element}
                           level={0}
                           allocationSetup={allocationSetup}
                           onAllocationChange={handleAllocationChange}
                           onAddAllocation={handleAddAllocation}
                           onRemoveAllocation={handleRemoveAllocation}
                           onToggleExpand={handleToggleAllocationExpand}
                           expandedItems={allocationExpandedItems}
                           costCategories={costCategories}
                           vendors={vendors}
                         />
                       ))}
                     </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setWizardStep(3)} // Go back to WBS Structure
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit WBS Elements
                  </button>
                  
                  <button
                    onClick={handleAutoAllocateAll}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Auto-Allocate All
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="wizard-step">
            <h5>Review & Create</h5>
            <p className="text-muted mb-4">
              Review your BOE information before creating.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h6 className="text-gray-900 font-medium mb-3">Basic Information</h6>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {currentData.basicInfo.name}</div>
                  <div><span className="font-medium">Version:</span> {currentData.basicInfo.versionNumber}</div>
                  <div><span className="font-medium">Description:</span> {currentData.basicInfo.description}</div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h6 className="text-gray-900 font-medium mb-3">Template</h6>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Template:</span> {currentData.template?.name}</div>
                  <div><span className="font-medium">Category:</span> {currentData.template?.category}</div>
                  <div><span className="font-medium">Version:</span> {currentData.template?.version}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h6 className="text-gray-900 font-medium mb-3">Allocation Summary</h6>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Elements with Allocations:</span>
                  <span className="font-medium">
                    {allocationSetup.filter(a => a.startDate && a.endDate && a.totalAmount > 0).length} / {allocationSetup.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Allocated Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(allocationSetup.reduce((sum, a) => sum + (a.totalAmount || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <h6 className="text-green-900 font-medium">Ready to Create</h6>
              </div>
              <p className="text-green-700 mt-1">Your BOE is ready to be created with allocation planning. Click "Create BOE" to proceed.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="boe-wizard">


      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((wizardStep + 1) / steps.length) * 100}%` }}
        ></div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-7 gap-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
              index < wizardStep 
                ? 'bg-green-500 text-white' 
                : index === wizardStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {index < wizardStep ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{step.id + 1}</span>
              )}
            </div>
            <div className="text-xs">
              <div className={`font-medium ${index <= wizardStep ? 'text-gray-900' : 'text-gray-500'}`}>
                {step.title}
              </div>
              <div className="text-gray-400">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="wizard-content mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handlePrevious}
          disabled={wizardStep === 0}
        >
          <span className="mr-2">←</span>
          Previous
        </button>

        <div className="flex space-x-2">
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onCancel}
          >
            Cancel
          </button>
          
          {wizardStep === steps.length - 1 ? (
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleComplete}
              disabled={!isStepValid(wizardStep)}
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Create BOE
            </button>
          ) : (
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNext}
              disabled={!isStepValid(wizardStep)}
            >
              Next
              <span className="ml-2">→</span>
            </button>
          )}
        </div>
      </div>

      {/* WBS Element Modal */}
      <Modal
        isOpen={showWBSElementModal}
        onClose={() => setShowWBSElementModal(false)}
        title={editingWBSElement ? 'Edit WBS Element' : 'Add WBS Element'}
        size="lg"
      >
        <BOEElementModal
          element={editingWBSElement}
          parentId={editingWBSElementParentId}
          onSave={handleSaveWBSElement}
          onCancel={() => setShowWBSElementModal(false)}
        />
      </Modal>
    </div>
  );
};

export default BOEWizard; 