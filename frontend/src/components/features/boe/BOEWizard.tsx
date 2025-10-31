import React, { useState, useEffect, useCallback } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import BOETemplateSelector from './BOETemplateSelector';
import { BOETemplate, BOEElementAllocation, BOEElement } from '../../../store/boeStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import { elementAllocationApi, boeTemplatesApi } from '../../../services/boeApi';
import {
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
  assumptions?: string;
  risks?: string;
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
}

// (Reordering controls will be added with drag-and-drop in a follow-up.)

const WBSWizardTreeItem: React.FC<WBSWizardTreeItemProps> = ({
  element,
  level,
  expandedItems,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild,
  costCategories
}) => {
  const isExpanded = expandedItems.has(element.id);
  const hasChildren = element.childElements && element.childElements.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpand(element.id);
    }
  };

  // Compute display cost for an element: leaves use own cost; parents sum descendants
  const getElementTotalCost = (el: BOEElement): number => {
    const hasChildren = Array.isArray(el.childElements) && el.childElements.length > 0;
    if (!hasChildren) {
      return typeof el.estimatedCost === 'string'
        ? (parseFloat(el.estimatedCost) || 0)
        : (el.estimatedCost || 0);
    }
    return el.childElements!.reduce((sum, c) => sum + getElementTotalCost(c), 0);
  };

  // Get cost category name
  const costCategory = costCategories.find(cat => cat.id === element.costCategoryId);

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
        <span className="text-sm font-mono text-gray-600 w-16 flex-shrink-0">
          {element.code}
        </span>

        {/* Element Name */}
        <div className="flex-1 min-w-0 mr-4">
          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate block">
            {element.name}
          </span>
        </div>

        {/* Estimated Cost (leaf or aggregated for parents) */}
        <span
          className="text-sm text-gray-600 w-24 flex-shrink-0 text-right mr-12 inline-flex items-center justify-end"
          title={hasChildren ? 'Sum of all descendant element costs' : 'Element estimated cost'}
        >
          {formatCurrency(getElementTotalCost(element))}
          {hasChildren && (
            <span className="ml-1 text-gray-400" aria-label="Sum of children" title="Sum of children">
              Σ
            </span>
          )}
        </span>

        {/* Cost Category */}
        <span className="text-xs text-gray-500 w-28 flex-shrink-0 mr-3">
          {costCategory?.name || 'Unassigned'}
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BOEWizard: React.FC<BOEWizardProps> = ({ programId, onComplete, onCancel, sourceBOE, currentBOE }) => {
  const { wizardStep, setWizardStep } = useBOEStore();





  // Function to calculate next version number
  const calculateNextVersionNumber = (currentVersion: string): string => {
    // Extract the version number (e.g., "v6" -> 6)
    const match = currentVersion.match(/v(\d+)/);
    if (match) {
      const currentNumber = parseInt(match[1], 10);
      return `v${currentNumber + 1}`;
    }
    // Fallback if version format is unexpected
    return 'v1';
  };

  const [currentData, setCurrentData] = useState<WizardData>(() => {
    if (sourceBOE) {
      // Pre-populate with source BOE data
      const nextVersion = calculateNextVersionNumber(sourceBOE.versionNumber);
      return {
        template: sourceBOE.template,
        basicInfo: {
          name: `${sourceBOE.name} (Copy)`,
          description: `${sourceBOE.description} - Copy`,
          versionNumber: nextVersion,
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
        versionNumber: 'v1',
      },
      wbsStructure: [],
      costEstimates: [],
      allocations: [],
      review: false,
    };
  });

  const [allocationSetup, setAllocationSetup] = useState<AllocationSetupData[]>([]);
  const [allocationExpandedItems, setAllocationExpandedItems] = useState<Set<string>>(new Set());
  const [expandedAllocationIndex, setExpandedAllocationIndex] = useState<number | null>(null);
  const [showAllocationSidebar, setShowAllocationSidebar] = useState(false);
  const [selectedAllocationForSidebar, setSelectedAllocationForSidebar] = useState<{ elementId: string, allocationIndex: number } | null>(null);
  const [creationMethod, setCreationMethod] = useState<'template' | 'copy' | 'manual' | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');

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

  // Load allocations from source BOE when available
  useEffect(() => {
    const loadSourceAllocations = async () => {
      if (sourceBOE?.id) {
        try {

          const allocations = await elementAllocationApi.getElementAllocations(sourceBOE.id);


          if (allocations.length > 0) {
            // Convert allocations to AllocationSetupData format
            const convertedAllocations = allocations.map((allocation: any) => {
              // Handle date formatting - convert Date objects to YYYY-MM-DD strings
              let startDate = '';
              let endDate = '';

              if (allocation.startDate) {
                if (typeof allocation.startDate === 'string') {
                  startDate = allocation.startDate;
                } else if (allocation.startDate instanceof Date) {
                  startDate = allocation.startDate.toISOString().split('T')[0];
                }
              }

              if (allocation.endDate) {
                if (typeof allocation.endDate === 'string') {
                  endDate = allocation.endDate;
                } else if (allocation.endDate instanceof Date) {
                  endDate = allocation.endDate.toISOString().split('T')[0];
                }
              }

              return {
                elementId: allocation.boeElementId,
                elementName: allocation.boeElement?.name || '',
                estimatedCost: allocation.boeElement?.estimatedCost || 0,
                allocationType: allocation.allocationType || 'Linear',
                startDate: startDate,
                endDate: endDate,
                totalAmount: allocation.totalAmount || 0,
                notes: allocation.notes || '',
              };
            });


            setAllocationSetup(convertedAllocations);
          }
        } catch (error) {
          console.error('Error loading source allocations:', error);
        }
      }
    };

    loadSourceAllocations();
  }, [sourceBOE?.id]);

  // Debug allocationSetup changes
  useEffect(() => {

  }, [allocationSetup]);

  // Initialize WBS structure based on creation method
  useEffect(() => {
    if (creationMethod === 'copy' && currentBOE) {
      // Copy WBS structure from current BOE
      setCurrentData(prev => ({
        ...prev,
        wbsStructure: currentBOE.elements || [],
        basicInfo: {
          ...prev.basicInfo,
          name: `${currentBOE.name} (Copy)`,
          description: `${currentBOE.description || ''} - Copy`
        }
      }));
    } else if (creationMethod === 'template' && currentData.template) {
      // Initialize with template structure (placeholder - would need template WBS data)
      setCurrentData(prev => ({
        ...prev,
        wbsStructure: [],
        basicInfo: {
          ...prev.basicInfo,
          name: `New BOE from ${currentData.template?.name || 'Template'}`,
          description: `BOE created from ${currentData.template?.name || 'template'}`
        }
      }));
    } else if (creationMethod === 'manual') {
      // Start with empty structure
      setCurrentData(prev => ({
        ...prev,
        wbsStructure: [],
        basicInfo: {
          ...prev.basicInfo,
          name: 'New Manual BOE',
          description: 'Manually created BOE'
        }
      }));
    }
  }, [creationMethod, currentBOE, currentData.template]);

  // Structure-first flow: if creating a brand new BOE (no currentBOE provided),
  // skip allocation planning inside the wizard. Allocation happens later on the Details tab.
  const steps = currentBOE ? [
    { id: 0, title: 'Creation Method', description: 'Choose how to create your BOE' },
    { id: 1, title: 'Template Selection', description: 'Choose a BOE template' },
    { id: 2, title: 'Basic Information', description: 'Enter BOE details' },
    { id: 3, title: 'WBS Structure', description: 'Define work breakdown structure' },
    { id: 4, title: 'Cost Verification', description: 'Review and verify costs' },
    { id: 5, title: 'Allocation Planning', description: 'Plan monthly allocations' },
    { id: 6, title: 'Review & Create', description: 'Review and create BOE' },
  ] : [
    { id: 0, title: 'Creation Method', description: 'Choose how to create your BOE' },
    { id: 1, title: 'Template Selection', description: 'Choose a BOE template' },
    { id: 2, title: 'Basic Information', description: 'Enter BOE details' },
    { id: 3, title: 'WBS Structure', description: 'Define work breakdown structure' },
    { id: 4, title: 'Review & Create', description: 'Review and create BOE' },
  ];

  const handleTemplateSelect = (template: BOETemplate) => {
    setCurrentData(prev => ({ ...prev, template }));
  };

  // When a template is selected, load its elements and build a WBS tree for preview
  useEffect(() => {
    const loadTemplateStructure = async () => {
      if (!currentData.template?.id) return;
      try {
        const tmpl = await boeTemplatesApi.getTemplate(currentData.template.id);
        const elements = Array.isArray(tmpl?.elements) ? tmpl.elements : [];

        // Build hierarchical tree from flat elements using parentElementId
        const nodeMap: Record<string, any> = {};
        elements.forEach((e: any) => {
          nodeMap[e.id] = {
            id: e.id,
            code: e.code,
            name: e.name,
            description: e.description || '',
            level: e.level || 1,
            costCategoryId: e.costCategoryId || undefined,
            vendorId: undefined,
            estimatedCost: typeof e.estimatedCost === 'number' ? e.estimatedCost : 0,
            isRequired: e.isRequired !== false,
            isOptional: !!e.isOptional,
            notes: e.notes || '',
            childElements: [] as any[],
            parentElementId: e.parentElementId || undefined,
          };
        });
        // Link children
        const roots: any[] = [];
        elements.forEach((e: any) => {
          const n = nodeMap[e.id];
          if (e.parentElementId && nodeMap[e.parentElementId]) {
            nodeMap[e.parentElementId].childElements.push(n);
          } else {
            roots.push(n);
          }
        });

        // Recalculate standardized WBS codes
        const recalc = recalcWBSCodes(roots);
        setCurrentData(prev => ({
          ...prev,
          wbsStructure: recalc,
        }));
      } catch (err) {
        console.error('Failed to load template structure', err);
        // leave structure as-is
      }
    };
    loadTemplateStructure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData.template?.id]);

  // Utility: Recalculate WBS codes based on position
  const recalcWBSCodes = (nodes: BOEElement[]): BOEElement[] => {
    const clone = (n: any): BOEElement => ({ ...n, childElements: n.childElements ? n.childElements.map(clone) : [] });
    const copy = nodes.map(clone);

    const assignChildren = (children: any[], base: string) => {
      children.forEach((child, idx) => {
        child.code = `${base}.${idx + 1}`;
        if (child.childElements && child.childElements.length) {
          assignChildren(child.childElements, child.code);
        }
      });
    };

    copy.forEach((root, idx) => {
      root.code = `${idx + 1}.0`;
      if (root.childElements && root.childElements.length) {
        assignChildren(root.childElements, `${idx + 1}`);
      }
    });
    return copy as any;
  };

  const handleBasicInfoChange = (field: keyof typeof currentData.basicInfo, value: string) => {
    setCurrentData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value }
    }));
  };

  const handleAllocationChange = useCallback((elementId: string, field: keyof AllocationSetupData, value: any, allocationIndex: number) => {
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
  }, []);

  // WBS Tree functions
  const getNextRootCode = (roots: BOEElement[]): string => {
    const nextIndex = roots.length + 1;
    return `${nextIndex}.0`;
  };

  const getNextChildCode = (parent: BOEElement): string => {
    const count = (parent.childElements?.length || 0) + 1;
    const base = parent.code.endsWith('.0') ? parent.code.slice(0, -2) : parent.code;
    return `${base}.${count}`;
  };

  const handleAddWBSRoot = () => {
    setEditingWBSElement({
      id: `temp-${Date.now()}`,
      code: getNextRootCode(currentData.wbsStructure),
      name: '',
      description: '',
      level: 1,
      estimatedCost: 0,
      actualCost: 0,
      variance: 0,
      isRequired: true,
      isOptional: false,
      managementReserveAmount: 0,
      boeVersionId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      childElements: []
    } as any);
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
      wbsStructure: recalcWBSCodes(removeElementAndChildren(prev.wbsStructure, element.id))
    }));
  };

  const handleAddWBSChild = (parentId: string) => {
    const parent = findElementById(currentData.wbsStructure, parentId);
    const defaultCode = parent ? getNextChildCode(parent) : '';
    setEditingWBSElement({
      id: `temp-${Date.now()}`,
      code: defaultCode,
      name: '',
      description: '',
      level: (parent?.level || 1) + 1,
      estimatedCost: 0,
      actualCost: 0,
      variance: 0,
      isRequired: true,
      isOptional: false,
      managementReserveAmount: 0,
      boeVersionId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      childElements: []
    } as any);
    setEditingWBSElementParentId(parentId);
    setShowWBSElementModal(true);
  };

  // Cost verification helper functions
  const calculateTotalCost = (): number => {
    const calculateElementCost = (elements: BOEElement[]): number => {
      return elements.reduce((total, element) => {
        const childCost = element.childElements ? calculateElementCost(element.childElements) : 0;
        // Only sum cost for leaf nodes (no children)
        const isLeaf = !element.childElements || element.childElements.length === 0;
        const elementCost = isLeaf
          ? (typeof element.estimatedCost === 'string' ? (parseFloat(element.estimatedCost) || 0) : (element.estimatedCost || 0))
          : 0;
        return total + elementCost + childCost;
      }, 0);
    };
    return calculateElementCost(currentData.wbsStructure);
  };

  const getCostBreakdownByCategory = (): Array<{ name: string; total: number }> => {
    const categoryTotals: Record<string, number> = {};

    const processElements = (elements: BOEElement[]) => {
      elements.forEach(element => {
        const isLeaf = !element.childElements || element.childElements.length === 0;
        if (isLeaf) {
          const categoryName = costCategories.find(cat => cat.id === element.costCategoryId)?.name || 'Unassigned';
          categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + (element.estimatedCost || 0);
        }

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
        const isLeaf = !element.childElements || element.childElements.length === 0;
        const hasCost = isLeaf && (element.estimatedCost || 0) > 0;
        const childCount = element.childElements ? countElementsWithCosts(element.childElements) : 0;
        return count + (hasCost ? 1 : 0) + childCount;
      }, 0);
    };

    return countElementsWithCosts(currentData.wbsStructure);
  };

  const getElementsMissingCosts = (): number => {
    const countElementsMissingCosts = (elements: BOEElement[]): number => {
      return elements.reduce((count, element) => {
        const isLeaf = !element.childElements || element.childElements.length === 0;
        const isRequired = element.isRequired !== false; // default required unless explicitly unchecked
        const missingCost = isLeaf && isRequired && (element.estimatedCost || 0) === 0;
        const childCount = element.childElements ? countElementsMissingCosts(element.childElements) : 0;
        return count + (missingCost ? 1 : 0) + childCount;
      }, 0);
    };
    return countElementsMissingCosts(currentData.wbsStructure);
  };

  // Allocation planning helper functions
  const getTotalElementsCount = (): number => {
    const countElements = (elements: BOEElement[]): number => {
      return elements.reduce((count, element) => {
        return count + 1 + (element.childElements ? countElements(element.childElements) : 0);
      }, 0);
    };
    return countElements(currentData.wbsStructure);
  };

  const getTotalLeafElementsCount = (): number => {
    const countLeaves = (elements: BOEElement[]): number => {
      return elements.reduce((count, element) => {
        const isLeaf = !element.childElements || element.childElements.length === 0;
        const childCount = element.childElements ? countLeaves(element.childElements) : 0;
        return count + (isLeaf ? 1 : 0) + childCount;
      }, 0);
    };
    return countLeaves(currentData.wbsStructure);
  };

  const getTotalElementCosts = (): number => {
    // Use the existing calculateTotalCost function
    return calculateTotalCost();
  };

  const getTotalAllocatedAmount = (): number => {
    // Only count allocations that have valid dates and amounts
    const validAllocations = allocationSetup.filter(a =>
      a.startDate && a.endDate && a.totalAmount > 0
    );

    const totalAllocated = validAllocations.reduce((total, allocation) => {
      // Convert string to number if needed
      const amount = typeof allocation.totalAmount === 'string'
        ? parseFloat(allocation.totalAmount) || 0
        : (allocation.totalAmount || 0);
      return total + amount;
    }, 0);

    return totalAllocated;
  };

  const getProperlyAllocatedElementsCount = (): number => {
    const checkElementAllocation = (element: BOEElement): boolean => {
      const elementAllocations = allocationSetup.filter(a => a.elementId === element.id);

      // Only count allocations that have valid dates and amounts
      const validAllocations = elementAllocations.filter(a =>
        a.startDate && a.endDate && a.totalAmount > 0
      );

      const totalAllocated = validAllocations.reduce((sum, a) => {
        // Convert string to number if needed
        const amount = typeof a.totalAmount === 'string'
          ? parseFloat(a.totalAmount) || 0
          : (a.totalAmount || 0);
        return sum + amount;
      }, 0);

      // Convert string to number if needed
      const elementCost = typeof element.estimatedCost === 'string'
        ? parseFloat(element.estimatedCost) || 0
        : (element.estimatedCost || 0);

      // Element is properly allocated if valid allocations sum to element cost
      const isProperlyAllocated = totalAllocated === elementCost && validAllocations.length > 0;

      return isProperlyAllocated;
    };

    const countProperlyAllocatedElements = (elements: BOEElement[]): number => {
      return elements.reduce((count, element) => {
        const isProperlyAllocated = checkElementAllocation(element);
        const childCount = element.childElements ? countProperlyAllocatedElements(element.childElements) : 0;
        return count + (isProperlyAllocated ? 1 : 0) + childCount;
      }, 0);
    };

    return countProperlyAllocatedElements(currentData.wbsStructure);
  };

  const isAllocationComplete = (): boolean => {
    // Check if all elements with costs are properly allocated
    const totalElements = getTotalElementsCount();
    const properlyAllocatedElements = getProperlyAllocatedElementsCount();

    // Also check if total allocated amount equals total element costs
    const totalAllocated = getTotalAllocatedAmount();
    const totalCosts = getTotalElementCosts();

    return totalElements > 0 &&
      properlyAllocatedElements === totalElements &&
      Math.abs(totalAllocated - totalCosts) < 0.01;
  };

  const handleAutoAllocateAll = () => {
    const autoAllocateElement = (element: BOEElement, startDate: string = '') => {
      const elementAllocations = allocationSetup.filter(a => a.elementId === element.id);

      // Convert element cost to number
      const elementCost = typeof element.estimatedCost === 'string'
        ? parseFloat(element.estimatedCost) || 0
        : (element.estimatedCost || 0);

      if (elementCost > 0) {
        // Calculate total already allocated (only valid allocations)
        const validAllocations = elementAllocations.filter(a =>
          a.startDate && a.endDate && a.totalAmount > 0
        );
        const totalAllocated = validAllocations.reduce((sum, a) => {
          const amount = typeof a.totalAmount === 'string'
            ? parseFloat(a.totalAmount) || 0
            : (a.totalAmount || 0);
          return sum + amount;
        }, 0);

        // Calculate remaining amount to allocate
        const remainingAmount = elementCost - totalAllocated;

        if (remainingAmount > 0) {
          // Create new allocation for remaining amount
          const newAllocation: AllocationSetupData = {
            elementId: element.id,
            elementName: element.name,
            estimatedCost: elementCost,
            allocationType: 'Linear',
            startDate: startDate || new Date().toISOString().split('T')[0],
            endDate: '',
            totalAmount: remainingAmount,
            notes: ''
          };

          // Set end date (3-month duration from start)
          const endDate = new Date(newAllocation.startDate);
          endDate.setMonth(endDate.getMonth() + 3);
          newAllocation.endDate = endDate.toISOString().split('T')[0];

          // Add the new allocation
          setAllocationSetup(prev => [...prev, newAllocation]);

          // Expand the element to show the new allocation
          setAllocationExpandedItems(prev => {
            const newSet = new Set(prev);
            newSet.add(element.id);
            return newSet;
          });
        }
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

  const handleToggleAllocationDetail = (elementId: string, allocationIndex: number) => {
    setSelectedAllocationForSidebar({ elementId, allocationIndex });
    setShowAllocationSidebar(true);
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

  // Removed duplicate moveElement (defined earlier)

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

    // Warn only if all required leaves have zero cost
    const sumRequiredLeafCosts = (elements: BOEElement[]): number => {
      return elements.reduce((sum, el) => {
        const isLeaf = !el.childElements || el.childElements.length === 0;
        const isRequired = el.isRequired !== false;
        const thisCost = isLeaf && isRequired ? (typeof el.estimatedCost === 'string' ? (parseFloat(el.estimatedCost) || 0) : (el.estimatedCost || 0)) : 0;
        const child = el.childElements ? sumRequiredLeafCosts(el.childElements) : 0;
        return sum + thisCost + child;
      }, 0);
    };
    if (sumRequiredLeafCosts(currentData.wbsStructure) === 0) {
      warnings.push('No cost estimates found for required elements. Please add costs to required WBS leaves.');
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
            // Parent becomes an aggregator: zero out its direct cost
            estimatedCost: 0,
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
          wbsStructure: recalcWBSCodes(addChildToParent(prev.wbsStructure, editingWBSElementParentId, newElement))
        }));
      } else {
        // Add as root
        setCurrentData(prev => ({
          ...prev,
          wbsStructure: recalcWBSCodes([...prev.wbsStructure, newElement])
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

      // No automatic allocation initialization - users must create allocations manually or use Auto-Allocate All
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

  const handleComplete = async () => {
    setIsCreating(true);

    try {
      const boeData = {
        programId,
        templateId: currentData.template?.id,
        creationMethod: creationMethod,
        changeSummary: currentBOE ? changeSummary : currentData.basicInfo.description,
        ...currentData.basicInfo,
        // Always let backend auto-generate version numbers
        versionNumber: undefined,
        elements: currentData.wbsStructure,
        costEstimates: currentData.costEstimates,
        allocations: allocationSetup.filter(a => a.startDate && a.endDate && a.totalAmount > 0),
      };

      await onComplete(boeData);

    } catch (error) {
      console.error('Error creating BOE:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        // For version creation (when currentBOE exists), require change summary for all methods
        if (currentBOE && creationMethod) {
          return changeSummary.trim().length > 0;
        }
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
  }

  interface CompactWBSAllocationItemProps {
    element: BOEElement;
    allocations: AllocationSetupData[];
    isExpanded: boolean;
    onAllocationChange: (elementId: string, field: keyof AllocationSetupData, value: any, allocationIndex: number) => void;
    onAddAllocation: () => void;
    onRemoveAllocation: (elementId: string, allocationIndex: number) => void;
    onToggleExpand: () => void;
    onToggleAllocationDetail: (elementId: string, allocationIndex: number) => void;
  }

  const CompactWBSAllocationItem: React.FC<CompactWBSAllocationItemProps> = ({
    element,
    allocations,
    isExpanded,
    onAllocationChange,
    onAddAllocation,
    onRemoveAllocation,
    onToggleExpand,
    onToggleAllocationDetail
  }) => {
    // Get cost category name
    const costCategory = costCategories.find(cat => cat.id === element.costCategoryId);

    const getAllocationStatus = () => {
      if (allocations.length === 0) return 'not-allocated';

      // Check if all allocations are complete (have dates and amounts)
      const completeAllocations = allocations.filter(a =>
        a.startDate && a.endDate && a.totalAmount > 0
      );

      if (completeAllocations.length === 0) return 'not-allocated';
      if (completeAllocations.length < allocations.length) return 'partially-allocated';

      // Check if allocations sum to element cost
      const totalAllocated = completeAllocations.reduce((sum, a) => {
        // Convert string to number if needed
        const amount = typeof a.totalAmount === 'string'
          ? parseFloat(a.totalAmount) || 0
          : (a.totalAmount || 0);
        return sum + amount;
      }, 0);

      // Convert string to number if needed
      const elementCost = typeof element.estimatedCost === 'string'
        ? parseFloat(element.estimatedCost) || 0
        : (element.estimatedCost || 0);

      if (Math.abs(totalAllocated - elementCost) < 0.01) { // Allow for small floating point differences
        return 'allocated';
      } else if (totalAllocated > 0) {
        return 'partially-allocated';
      }

      return 'not-allocated';
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
      const allocationCount = allocations.length;
      const totalAllocated = allocations.reduce((sum, a) => {
        // Convert string to number if needed
        const amount = typeof a.totalAmount === 'string'
          ? parseFloat(a.totalAmount) || 0
          : (a.totalAmount || 0);
        return sum + amount;
      }, 0);

      // Convert string to number if needed
      const elementCost = typeof element.estimatedCost === 'string'
        ? parseFloat(element.estimatedCost) || 0
        : (element.estimatedCost || 0);

      switch (status) {
        case 'allocated':
          return allocationCount > 1 ? `${allocationCount} Allocations` : 'Allocated';
        case 'partially-allocated':
          return `${formatCurrency(totalAllocated)} of ${formatCurrency(elementCost)}`;
        case 'not-allocated':
          return 'Not Allocated';
      }
    };

    return (
      <div className="compact-wbs-allocation-item">
        {/* Compact Element Header */}
        <div
          className="flex items-center py-4 px-3 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={onToggleExpand}
        >
          {/* Status Icon */}
          <div className="w-6 flex justify-center">
            {getStatusIcon()}
          </div>

          {/* Element Code */}
          <span className="w-12 ml-4 text-xs font-mono text-gray-600">
            {element.code}
          </span>

          {/* Element Name */}
          <span className="flex-1 ml-4 text-sm font-medium text-gray-900 truncate">
            {element.name}
          </span>

          {/* Estimated Cost */}
          <span className="w-24 ml-4 text-xs text-gray-600 text-right">
            {formatCurrency(element.estimatedCost)}
          </span>

          {/* Cost Category */}
          <span className="w-28 ml-4 text-xs text-gray-500 truncate">
            {costCategory?.name || 'Unassigned'}
          </span>


          {/* Allocation Status */}
          <span className="w-32 ml-4 text-xs font-medium text-right">
            {getStatusText()}
          </span>

          {/* Expand/Collapse Icon */}
          <div className="w-6 ml-2 flex justify-center">
            <ChevronRightIcon
              className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </div>
        </div>

        {/* Collapsible Allocation Details */}
        {isExpanded && element.estimatedCost > 0 && (
          <div className="bg-gray-50 border-t border-gray-100">
            <div className="p-3">
              {/* Allocation Summary */}
              <div className="flex items-center justify-between mb-3">
                <h6 className="text-sm font-medium text-gray-900">Allocations</h6>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAllocation();
                  }}
                  className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                >
                  Add Allocation
                </button>
              </div>

              {/* Allocation List */}
              {allocations.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-xs">No allocations configured</p>
                </div>
              ) : (
                <div>
                  {/* Column Headers */}
                  <div className="flex items-center py-2 px-3 bg-gray-50 border border-gray-200 rounded-t text-xs font-medium text-gray-700 mb-1">
                    <div className="w-24 mr-4">Type</div>
                    <div className="w-28 mr-4">Amount</div>
                    <div className="w-32 mr-3 text-center">Start Date</div>
                    <div className="w-32 mr-4 text-center">End Date</div>
                    <div className="w-24 mr-4 text-right">Monthly</div>
                    <div className="flex-1 text-right">Actions</div>
                  </div>

                  {/* Allocation Rows */}
                  <div className="space-y-1">
                    {allocations.map((allocation: any, index: number) => {
                      const isDetailExpanded = expandedAllocationIndex === index;
                      return (
                        <div key={`${element.id}-${index}`}>
                          {/* Inline-Editable Allocation Line */}
                          <div
                            key={`allocation-${element.id}-${index}`}
                            className={`flex items-center py-2 px-3 border rounded transition-colors relative ${showAllocationSidebar &&
                              selectedAllocationForSidebar &&
                              selectedAllocationForSidebar.elementId === element.id &&
                              selectedAllocationForSidebar.allocationIndex === index
                              ? 'bg-blue-50 border-blue-300 shadow-sm'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                          >
                            {/* Selection Indicator */}
                            {showAllocationSidebar &&
                              selectedAllocationForSidebar &&
                              selectedAllocationForSidebar.elementId === element.id &&
                              selectedAllocationForSidebar.allocationIndex === index && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l"></div>
                              )}
                            {/* Allocation Type - Inline Editable */}
                            <div className="w-24 mr-4">
                              <select
                                className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer font-medium text-gray-700"
                                value={allocation.allocationType}
                                onChange={(e) => onAllocationChange(element.id, 'allocationType', e.target.value, index)}
                              >
                                <option value="Linear">Linear</option>
                                <option value="Front-Loaded">Front-Loaded</option>
                                <option value="Back-Loaded">Back-Loaded</option>
                                <option value="Custom">Custom</option>
                              </select>
                            </div>

                            {/* Amount - Inline Editable */}
                            <div className="w-28 mr-4">
                              <input
                                type="number"
                                className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-900 font-medium"
                                defaultValue={allocation.totalAmount || ''}
                                onBlur={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                  onAllocationChange(element.id, 'totalAmount', value, index);
                                }}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                              />
                            </div>

                            {/* Start Date - Inline Editable */}
                            <div className="w-32 mr-3 relative">
                              <input
                                type="date"
                                className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-600 pr-6"
                                defaultValue={allocation.startDate || ''}
                                onBlur={(e) => onAllocationChange(element.id, 'startDate', e.target.value, index)}
                                style={{
                                  backgroundImage: 'none',
                                  paddingRight: '1.5rem'
                                }}
                              />
                            </div>

                            {/* End Date - Inline Editable */}
                            <div className="w-32 mr-4 relative">
                              <input
                                type="date"
                                className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-600 pr-6"
                                defaultValue={allocation.endDate || ''}
                                onBlur={(e) => onAllocationChange(element.id, 'endDate', e.target.value, index)}
                                style={{
                                  backgroundImage: 'none',
                                  paddingRight: '1.5rem'
                                }}
                              />
                            </div>

                            {/* Monthly Preview */}
                            {allocation.startDate && allocation.endDate && allocation.totalAmount > 0 && (
                              <div className="w-24 text-xs text-gray-500 text-right mr-4">
                                {formatCurrency(getMonthlyAmount(allocation.totalAmount, allocation.startDate, allocation.endDate, allocation.allocationType))}/mo
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex-1 flex justify-end space-x-2">
                              {/* Details Button */}
                              <button
                                onClick={() => onToggleAllocationDetail(element.id, index)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                title="View details"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>

                              {/* Remove Button */}
                              <button
                                onClick={() => onRemoveAllocation(element.id, index)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title="Remove allocation"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const WBSAllocationItem: React.FC<WBSAllocationItemProps> = ({
    element,
    level,
    allocationSetup,
    onAllocationChange,
    onAddAllocation,
    onRemoveAllocation,
    onToggleExpand,
    expandedItems,
    costCategories
  }) => {
    const elementAllocations = allocationSetup.filter(a => a.elementId === element.id);
    const hasChildren = element.childElements && element.childElements.length > 0;
    const isExpanded = expandedItems.has(element.id);

    // Get cost category name
    const costCategory = costCategories.find(cat => cat.id === element.costCategoryId);

    const getAllocationStatus = () => {
      if (elementAllocations.length === 0) return 'not-allocated';

      // Check if all allocations are complete (have dates and amounts)
      const completeAllocations = elementAllocations.filter(a =>
        a.startDate && a.endDate && a.totalAmount > 0
      );

      if (completeAllocations.length === 0) return 'not-allocated';
      if (completeAllocations.length < elementAllocations.length) return 'partially-allocated';

      // Check if allocations sum to element cost
      const totalAllocated = completeAllocations.reduce((sum, a) => {
        // Convert string to number if needed
        const amount = typeof a.totalAmount === 'string'
          ? parseFloat(a.totalAmount) || 0
          : (a.totalAmount || 0);
        return sum + amount;
      }, 0);

      // Convert string to number if needed
      const elementCost = typeof element.estimatedCost === 'string'
        ? parseFloat(element.estimatedCost) || 0
        : (element.estimatedCost || 0);

      if (Math.abs(totalAllocated - elementCost) < 0.01) { // Allow for small floating point differences
        return 'allocated';
      } else if (totalAllocated > 0) {
        return 'partially-allocated';
      }

      return 'not-allocated';
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
      const totalAllocated = elementAllocations.reduce((sum, a) => {
        // Convert string to number if needed
        const amount = typeof a.totalAmount === 'string'
          ? parseFloat(a.totalAmount) || 0
          : (a.totalAmount || 0);
        return sum + amount;
      }, 0);

      // Convert string to number if needed
      const elementCost = typeof element.estimatedCost === 'string'
        ? parseFloat(element.estimatedCost) || 0
        : (element.estimatedCost || 0);

      switch (status) {
        case 'allocated':
          return allocationCount > 1 ? `${allocationCount} Allocations` : 'Allocated';
        case 'partially-allocated':
          return `${formatCurrency(totalAllocated)} of ${formatCurrency(elementCost)}`;
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
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${creationMethod === 'template'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setCreationMethod('template')}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${creationMethod === 'template'
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
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${creationMethod === 'copy'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
                  } ${!currentBOE ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => currentBOE && setCreationMethod('copy')}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${creationMethod === 'copy'
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
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${creationMethod === 'manual'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setCreationMethod('manual')}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${creationMethod === 'manual'
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

            {/* Change Summary Input for Version Creation */}
            {currentBOE && creationMethod && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h6 className="text-lg font-medium text-gray-900 mb-3">Change Summary</h6>
                <p className="text-sm text-gray-600 mb-3">
                  Please describe what changes you're making in this new version. This will be recorded in the version history.
                </p>
                <textarea
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what changes you're making in this version..."
                  required
                />
                {!changeSummary.trim() && (
                  <p className="text-sm text-red-600 mt-1">
                    Change summary is required for version creation.
                  </p>
                )}
              </div>
            )}
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
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600">
                  {currentData.basicInfo.versionNumber || 'Will be auto-generated'}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Version number is automatically generated by the system.
                </p>
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
                      <span className="font-medium">{getTotalLeafElementsCount()}</span>
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
              <div className="space-y-4">
                {/* Compact Allocation Summary */}
                <div className={`border rounded-lg p-4 ${isAllocationComplete()
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div>
                        <h6 className={`font-medium text-sm ${isAllocationComplete() ? 'text-green-900' : 'text-blue-900'
                          }`}>
                          {isAllocationComplete() ? 'Allocation Complete!' : 'Allocation Progress'}
                        </h6>
                        <p className={`text-xs ${isAllocationComplete() ? 'text-green-700' : 'text-blue-700'
                          }`}>
                          {isAllocationComplete()
                            ? `All ${getTotalElementsCount()} elements fully allocated`
                            : `${getProperlyAllocatedElementsCount()} of ${getTotalElementsCount()} elements configured`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isAllocationComplete() ? 'text-green-900' : 'text-blue-900'
                          }`}>
                          {formatCurrency(getTotalAllocatedAmount())}
                        </div>
                        <div className={`text-xs ${isAllocationComplete() ? 'text-green-700' : 'text-blue-700'
                          }`}>
                          {isAllocationComplete()
                            ? 'Fully allocated!'
                            : `Allocated of ${formatCurrency(getTotalElementCosts())} Total`
                          }
                        </div>
                      </div>
                    </div>
                    {!isAllocationComplete() && (
                      <div className="text-right">
                        <button
                          onClick={() => setWizardStep(6)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Skip for Now
                        </button>
                        <p className="text-xs text-blue-700 mt-1">
                          You can configure allocations now or skip and do it later in the BOE Details.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compact WBS Elements List */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h6 className="text-gray-900 font-medium text-sm">WBS Elements</h6>
                        <p className="text-xs text-gray-600">Click to configure allocations</p>
                      </div>
                      <button
                        onClick={handleAutoAllocateAll}
                        className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200 transition-colors"
                      >
                        Auto-Allocate All
                      </button>
                    </div>
                  </div>

                  {/* Column Headers */}
                  <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center text-xs font-medium text-gray-600">
                      <div className="w-6 text-center">Status</div>
                      <div className="w-12 ml-4">Code</div>
                      <div className="flex-1 ml-4">Element Name</div>
                      <div className="w-24 text-right ml-4">Est. Cost</div>
                      <div className="w-28 ml-4">Category</div>
                      <div className="w-40 ml-4">Vendor</div>
                      <div className="w-32 text-right ml-4">Allocation</div>
                      <div className="w-6 ml-2"></div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {currentData.wbsStructure.map((element) => {
                      const elementAllocations = allocationSetup.filter(a => a.elementId === element.id);
                      const isExpanded = allocationExpandedItems.has(element.id);



                      return (
                        <CompactWBSAllocationItem
                          key={element.id}
                          element={element}
                          allocations={elementAllocations}
                          isExpanded={isExpanded}
                          onToggleExpand={() => handleToggleAllocationExpand(element.id)}
                          onAllocationChange={handleAllocationChange}
                          onAddAllocation={() => handleAddAllocation(element.id)}
                          onRemoveAllocation={handleRemoveAllocation}
                          onToggleAllocationDetail={handleToggleAllocationDetail}
                        />
                      );
                    })}
                  </div>
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
                <h6 className="text-gray-900 font-medium mb-3">Creation Method</h6>
                <div className="space-y-2 text-sm">
                  {currentData.template ? (
                    <>
                      <div><span className="font-medium">Method:</span> Created from Template</div>
                      <div><span className="font-medium">Template:</span> {currentData.template.name}</div>
                      <div><span className="font-medium">Category:</span> {currentData.template.category}</div>
                      <div><span className="font-medium">Version:</span> {currentData.template.version}</div>
                    </>
                  ) : sourceBOE ? (
                    <>
                      <div><span className="font-medium">Method:</span> Created from Existing BOE</div>
                      <div><span className="font-medium">Source BOE:</span> {sourceBOE.name}</div>
                      <div><span className="font-medium">Source Version:</span> {sourceBOE.versionNumber}</div>
                      <div><span className="font-medium">Elements Copied:</span> {sourceBOE.wbsStructure?.length || 0}</div>
                    </>
                  ) : (
                    <>
                      <div><span className="font-medium">Method:</span> Created Manually</div>
                      <div><span className="font-medium">Elements Added:</span> {currentData.wbsStructure.length}</div>
                      <div><span className="font-medium">Total Cost:</span> {formatCurrency(calculateTotalCost())}</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h6 className="text-gray-900 font-medium mb-3">Allocation Summary</h6>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Elements with Allocations:</span>
                  <span className="font-medium">
                    {getProperlyAllocatedElementsCount()} / {currentData.wbsStructure.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Allocated Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(getTotalAllocatedAmount())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Element Costs:</span>
                  <span className="font-medium">
                    {formatCurrency(getTotalElementCosts())}
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
      <div className="mb-8">
        <div className="flex justify-center items-start gap-6 flex-wrap">
          {steps.map((step, index) => (
            <div key={step.id} className="text-center min-w-[140px]">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${index < wizardStep
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
              disabled={!isStepValid(wizardStep) || isCreating}
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Create BOE
                </>
              )}
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

      {/* Allocation Detail Sidebar */}
      {showAllocationSidebar && selectedAllocationForSidebar && (
        <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
          <div className="bg-white w-96 h-full shadow-xl overflow-y-auto pointer-events-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Allocation Details</h3>
                <button
                  onClick={() => {
                    setShowAllocationSidebar(false);
                    setSelectedAllocationForSidebar(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              {(() => {
                const { elementId, allocationIndex } = selectedAllocationForSidebar;
                const elementAllocations = allocationSetup.filter(a => a.elementId === elementId);
                const allocation = elementAllocations[allocationIndex];
                const element = currentData.wbsStructure.find(e => e.id === elementId);

                if (!allocation || !element) return null;

                // Calculate monthly breakdown
                const monthlyBreakdown = (() => {
                  if (!allocation.startDate || !allocation.endDate || allocation.totalAmount <= 0) return {};

                  const months = calculateNumberOfMonths(allocation.startDate, allocation.endDate);
                  const monthlyAmount = getMonthlyAmount(allocation.totalAmount, allocation.startDate, allocation.endDate, allocation.allocationType);
                  const breakdown: { [month: string]: { amount: number; date: string } } = {};

                  const startDate = new Date(allocation.startDate);
                  for (let i = 0; i < months; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setMonth(startDate.getMonth() + i);
                    const monthKey = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                    breakdown[monthKey] = {
                      amount: monthlyAmount,
                      date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    };
                  }

                  return breakdown;
                })();

                return (
                  <div className="space-y-4">
                    {/* Element Info */}
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="font-medium text-gray-900">{element.name}</h4>
                      <p className="text-sm text-gray-600">WBS Code: {element.code}</p>
                    </div>

                    {/* Allocation Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Type</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={allocation.allocationType}
                          onChange={(e) => handleAllocationChange(elementId, 'allocationType', e.target.value, allocationIndex)}
                        >
                          <option value="Linear">Linear</option>
                          <option value="Front-Loaded">Front-Loaded</option>
                          <option value="Back-Loaded">Back-Loaded</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={allocation.totalAmount}
                          onChange={(e) => handleAllocationChange(elementId, 'totalAmount', parseFloat(e.target.value) || 0, allocationIndex)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={allocation.startDate}
                            onChange={(e) => handleAllocationChange(elementId, 'startDate', e.target.value, allocationIndex)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={allocation.endDate}
                            onChange={(e) => handleAllocationChange(elementId, 'endDate', e.target.value, allocationIndex)}
                          />
                        </div>
                      </div>

                      {/* Monthly Breakdown Preview */}
                      {Object.keys(monthlyBreakdown).length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monthly Breakdown Preview
                          </label>
                          <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 mb-2">
                              <div>Month</div>
                              <div>Amount</div>
                              <div>Date</div>
                            </div>
                            {Object.entries(monthlyBreakdown).map(([month, data]) => (
                              <div key={month} className="grid grid-cols-3 gap-4 text-sm text-gray-600 py-1 border-b border-gray-200">
                                <div>{month}</div>
                                <div>{formatCurrency(data.amount)}</div>
                                <div>{data.date}</div>
                              </div>
                            ))}
                            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-900 pt-2 border-t border-gray-300">
                              <div>Total</div>
                              <div>{formatCurrency(allocation.totalAmount)}</div>
                              <div></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Fields */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            value={allocation.notes}
                            onChange={(e) => handleAllocationChange(elementId, 'notes', e.target.value, allocationIndex)}
                            placeholder="Additional notes about this allocation..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assumptions</label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            value={allocation.assumptions || ''}
                            onChange={(e) => handleAllocationChange(elementId, 'assumptions', e.target.value, allocationIndex)}
                            placeholder="Key assumptions for this allocation..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Risks</label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            value={allocation.risks || ''}
                            onChange={(e) => handleAllocationChange(elementId, 'risks', e.target.value, allocationIndex)}
                            placeholder="Potential risks for this allocation..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOEWizard; 