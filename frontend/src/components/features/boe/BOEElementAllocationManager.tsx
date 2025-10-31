import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  LockClosedIcon,
  LockOpenIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { useBOEStore, BOEElementAllocation, BOEElement } from '../../../store/boeStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { elementAllocationApi } from '../../../services/boeApi';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import { 
  CalendarIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface BOEElementAllocationManagerProps {
  boeVersionId: string;
  selectedElementId?: string;
  selectedElementName?: string;
  selectedElement?: BOEElement; // Add the full element object
  onAllocationCreated?: () => void;
  sidebarWidth?: number;
}

interface ElementAllocationFormData {
  name: string;
  description: string;
  totalAmount: number;
  allocationType: 'Linear' | 'Front-Loaded' | 'Back-Loaded' | 'Custom';
  startDate: string;
  endDate: string;
  totalQuantity?: number;
  quantityUnit?: string;
  vendorId?: string;
  notes: string;
  assumptions: string;
  risks: string;
}

interface ChildAllocationGroup {
  childElement: BOEElement;
  allocations: BOEElementAllocation[];
  totalAmount: number;
  allocatedAmount: number;
  actualAmount: number;
  variance: number;
}

const BOEElementAllocationManager: React.FC<BOEElementAllocationManagerProps> = ({ 
  boeVersionId,
  selectedElementId,
  selectedElementName,
  selectedElement,
  onAllocationCreated,
  sidebarWidth = 384 // Default width (w-96 = 384px)
}) => {
  const { 
    elementAllocations,
    elementAllocationSummary,
    elementAllocationsLoading, 
    setElementAllocationsLoading, 
    setElementAllocationsError,
    setElementAllocations,
    setElementAllocationSummary,
    elements
  } = useBOEStore();
  
  const { vendors, fetchVendors, costCategories, fetchCostCategories } = useSettingsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<BOEElementAllocation | null>(null);
  const [deletingAllocation, setDeletingAllocation] = useState<BOEElementAllocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedChildGroups, setExpandedChildGroups] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<ElementAllocationFormData>({
    name: '',
    description: '',
    totalAmount: 0,
    allocationType: 'Linear',
    startDate: '',
    endDate: '',
    vendorId: '',
    notes: '',
    assumptions: '',
    risks: ''
  });
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<{
    [month: string]: { amount: number; quantity?: number; date: string; }
  }>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Check if selected element is a parent
  const isParentElement = selectedElement?.childElements && selectedElement.childElements.length > 0;

  // Calculate monthly breakdown when form data changes
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.totalAmount > 0) {
      const breakdown = calculateMonthlyBreakdown(
        formData.totalAmount,
        formData.totalQuantity,
        formData.startDate,
        formData.endDate,
        formData.allocationType
      );
      setMonthlyBreakdown(breakdown);
    }
  }, [formData.totalAmount, formData.totalQuantity, formData.startDate, formData.endDate, formData.allocationType]);

  // Group allocations by child elements for parent elements
  const getChildAllocationGroups = (): ChildAllocationGroup[] => {
    if (!isParentElement || !selectedElement?.childElements) {
      return [];
    }

    return selectedElement.childElements.map(childElement => {
      const childAllocations = elementAllocations.filter(
        allocation => allocation.boeElementId === childElement.id
      );
      
      const totalAmount = childAllocations.reduce((sum, allocation) => sum + (Number(allocation.totalAmount) || 0), 0);
      const allocatedAmount = childAllocations.reduce((sum, allocation) => {
        const monthlyBreakdown = allocation.monthlyBreakdown || {};
        return sum + Object.values(monthlyBreakdown).reduce((monthSum: number, month: any) => monthSum + (Number(month.amount) || 0), 0);
      }, 0);
      const actualAmount = childAllocations.reduce((sum, allocation) => {
        const monthlyBreakdown = allocation.monthlyBreakdown || {};
        return sum + Object.values(monthlyBreakdown).reduce((monthSum: number, month: any) => monthSum + (Number(month.actualAmount) || 0), 0);
      }, 0);
      const variance = actualAmount - allocatedAmount;

      return {
        childElement,
        allocations: childAllocations,
        totalAmount,
        allocatedAmount,
        actualAmount,
        variance
      };
    }); // Show all children, even if they have no allocations (for completeness)
  };

  const toggleChildGroup = (childElementId: string) => {
    const newExpanded = new Set(expandedChildGroups);
    if (newExpanded.has(childElementId)) {
      newExpanded.delete(childElementId);
    } else {
      newExpanded.add(childElementId);
    }
    setExpandedChildGroups(newExpanded);
  };

  const calculateMonthlyBreakdown = (
    totalAmount: number,
    totalQuantity: number | undefined,
    startDate: string,
    endDate: string,
    allocationType: string
  ) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    const numberOfMonths = Math.max(1, months + 1);
    
    const breakdown: { [month: string]: { amount: number; quantity?: number; date: string; } } = {};
    let currentDate = new Date(start);
    let remainingAmount = totalAmount;
    let remainingQuantity = totalQuantity;

    for (let i = 0; i < numberOfMonths; i++) {
      const monthKey = currentDate.toISOString().slice(0, 7);
      let monthlyAmount: number;
      let monthlyQuantity: number | undefined;

      switch (allocationType) {
        case 'Linear':
          monthlyAmount = totalAmount / numberOfMonths;
          monthlyQuantity = totalQuantity ? totalQuantity / numberOfMonths : undefined;
          break;
        case 'Front-Loaded':
          if (i < Math.ceil(numberOfMonths * 0.3)) {
            monthlyAmount = (totalAmount * 0.6) / Math.ceil(numberOfMonths * 0.3);
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.6) / Math.ceil(numberOfMonths * 0.3) : undefined;
          } else if (i < Math.ceil(numberOfMonths * 0.7)) {
            monthlyAmount = (totalAmount * 0.3) / (Math.ceil(numberOfMonths * 0.7) - Math.ceil(numberOfMonths * 0.3));
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.3) / (Math.ceil(numberOfMonths * 0.7) - Math.ceil(numberOfMonths * 0.3)) : undefined;
          } else {
            monthlyAmount = (totalAmount * 0.1) / (numberOfMonths - Math.ceil(numberOfMonths * 0.7));
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.1) / (numberOfMonths - Math.ceil(numberOfMonths * 0.7)) : undefined;
          }
          break;
        case 'Back-Loaded':
          if (i < Math.ceil(numberOfMonths * 0.3)) {
            monthlyAmount = (totalAmount * 0.1) / Math.ceil(numberOfMonths * 0.3);
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.1) / Math.ceil(numberOfMonths * 0.3) : undefined;
          } else if (i < Math.ceil(numberOfMonths * 0.7)) {
            monthlyAmount = (totalAmount * 0.3) / (Math.ceil(numberOfMonths * 0.7) - Math.ceil(numberOfMonths * 0.3));
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.3) / (Math.ceil(numberOfMonths * 0.7) - Math.ceil(numberOfMonths * 0.3)) : undefined;
          } else {
            monthlyAmount = (totalAmount * 0.6) / (numberOfMonths - Math.ceil(numberOfMonths * 0.7));
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.6) / (numberOfMonths - Math.ceil(numberOfMonths * 0.7)) : undefined;
          }
          break;
        default:
          monthlyAmount = totalAmount / numberOfMonths;
          monthlyQuantity = totalQuantity ? totalQuantity / numberOfMonths : undefined;
      }

      monthlyAmount = Math.min(monthlyAmount, remainingAmount);
      remainingAmount -= monthlyAmount;

      if (monthlyQuantity && remainingQuantity) {
        monthlyQuantity = Math.min(monthlyQuantity, remainingQuantity);
        remainingQuantity -= monthlyQuantity;
      }

      breakdown[monthKey] = {
        amount: Math.round(monthlyAmount * 100) / 100,
        quantity: monthlyQuantity ? Math.round(monthlyQuantity * 100) / 100 : undefined,
        date: currentDate.toISOString().slice(0, 10)
      };

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return breakdown;
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    if (formData.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    if (!formData.startDate) {
      errors.push('Start date is required');
    }

    if (!formData.endDate) {
      errors.push('End date is required');
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate >= endDate) {
        errors.push('End date must be after start date');
      }
    }

    if (!['Linear', 'Front-Loaded', 'Back-Loaded', 'Custom'].includes(formData.allocationType)) {
      errors.push('Valid allocation type is required');
    }

    if (formData.totalQuantity && formData.totalQuantity <= 0) {
      errors.push('Total quantity must be greater than 0 if provided');
    }

    if (formData.totalQuantity && !formData.quantityUnit) {
      errors.push('Quantity unit is required when total quantity is provided');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCreateAllocation = async () => {
    if (!validateForm() || !selectedElementId) return;

    setCreating(true);
    try {
      const allocationData = {
        ...formData,
        boeElementId: selectedElementId,
        boeVersionId,
        monthlyBreakdown
      };

      await elementAllocationApi.createElementAllocation(selectedElementId, allocationData);
      
      // Refresh allocations
      await loadElementAllocations();
      
      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);
      
      if (onAllocationCreated) {
        onAllocationCreated();
      }
    } catch (error) {
      console.error('Error creating allocation:', error);
      setElementAllocationsError('Failed to create allocation');
    } finally {
      setCreating(false);
    }
  };

  const handleEditAllocation = (allocation: BOEElementAllocation) => {
    setEditingAllocation(allocation);
    setFormData({
      name: allocation.name,
      description: allocation.description,
      totalAmount: allocation.totalAmount,
      allocationType: allocation.allocationType,
      startDate: allocation.startDate,
      endDate: allocation.endDate,
      totalQuantity: allocation.totalQuantity,
      quantityUnit: allocation.quantityUnit,
      vendorId: allocation.vendorId || '',
      notes: allocation.notes || '',
      assumptions: allocation.assumptions || '',
      risks: allocation.risks || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteAllocation = (allocation: BOEElementAllocation) => {
    setDeletingAllocation(allocation);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAllocation) return;

    setLoading(true);
    try {
      await elementAllocationApi.deleteElementAllocation(deletingAllocation.id);
      
      // Refresh allocations
      await loadElementAllocations();
      
      setShowDeleteModal(false);
      setDeletingAllocation(null);
      
      if (onAllocationCreated) {
        onAllocationCreated();
      }
    } catch (error) {
      console.error('Error deleting allocation:', error);
      setElementAllocationsError('Failed to delete allocation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAllocation = async () => {
    if (!validateForm() || !editingAllocation) return;

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        monthlyBreakdown
      };

      await elementAllocationApi.updateElementAllocation(editingAllocation.id, updateData);
      
      // Refresh allocations
      await loadElementAllocations();
      
      setShowEditModal(false);
      setEditingAllocation(null);
      resetForm();
      
      if (onAllocationCreated) {
        onAllocationCreated();
      }
    } catch (error) {
      console.error('Error updating allocation:', error);
      setElementAllocationsError('Failed to update allocation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingAllocation(null);
    resetForm();
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingAllocation(null);
  };

  const loadElementAllocations = async () => {
    if (!boeVersionId) return;
    
    setElementAllocationsLoading(true);
    try {
      const allocations = await elementAllocationApi.getElementAllocations(boeVersionId);
      setElementAllocations(allocations);
      
      // Load summary
      const summary = await elementAllocationApi.getElementAllocationSummary(boeVersionId);
      setElementAllocationSummary(summary);
    } catch (error) {
      console.error('Error loading element allocations:', error);
      setElementAllocationsError('Failed to load allocations');
    } finally {
      setElementAllocationsLoading(false);
    }
  };

  useEffect(() => {
    loadElementAllocations();
  }, [boeVersionId]);

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <ArrowUpIcon className="h-4 w-4" />;
    if (variance < 0) return <ArrowDownIcon className="h-4 w-4" />;
    return null;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      totalAmount: 0,
      allocationType: 'Linear',
      startDate: '',
      endDate: '',
      vendorId: '',
      notes: '',
      assumptions: '',
      risks: ''
    });
    setMonthlyBreakdown({});
    setValidationErrors([]);
  };

  // Load vendors on mount
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  if (elementAllocationsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter allocations for selected element if provided
  const filteredAllocations = selectedElementId 
    ? elementAllocations.filter(allocation => allocation.boeElementId === selectedElementId)
    : elementAllocations;

  // Get child allocation groups for parent elements
  const childAllocationGroups = getChildAllocationGroups();

  // Helper function to calculate estimated cost (sum from leaf descendants for parents)
  const getElementEstimatedCost = (element: BOEElement): number => {
    const hasChildren = element.childElements && element.childElements.length > 0;
    
    if (!hasChildren) {
      return Number(element.estimatedCost) || 0;
    }
    
    // For parents, sum estimated costs from all leaf descendants
    let total = 0;
    const sumLeafEstimates = (children: BOEElement[]) => {
      children.forEach(child => {
        const isLeaf = !child.childElements || child.childElements.length === 0;
        if (isLeaf) {
          total += Number(child.estimatedCost) || 0;
        } else {
          sumLeafEstimates(child.childElements!);
        }
      });
    };
    
    if (element.childElements) {
      sumLeafEstimates(element.childElements);
    }
    return total;
  };

  // Calculate summary for selected element from filtered allocations
  const getSelectedElementSummary = () => {
    if (!selectedElementId || !selectedElement) {
      return null;
    }

    // For parent elements, sum from all child allocations
    if (isParentElement) {
      let totalAllocations = 0;
      let allocatedCost = 0;

      // Sum allocations from all children
      childAllocationGroups.forEach(group => {
        totalAllocations += group.allocations.length;
        allocatedCost += group.allocatedAmount;
      });

      return {
        totalAllocations,
        allocatedCost
      };
    }

    // For leaf elements, calculate from filtered allocations
    const allocatedCost = filteredAllocations.reduce((sum, allocation) => {
      // Sum from monthly breakdown if available, otherwise use totalAmount
      if (allocation.monthlyBreakdown) {
        const monthlyTotal = Object.values(allocation.monthlyBreakdown).reduce(
          (monthSum: number, month: any) => monthSum + (Number(month.amount) || 0),
          0
        );
        return sum + monthlyTotal;
      }
      return sum + (Number(allocation.totalAmount) || 0);
    }, 0);

    return {
      totalAllocations: filteredAllocations.length,
      allocatedCost
    };
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Compact */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {selectedElementName ? `Allocations for ${selectedElementName}` : 'Element Allocations'}
            </h2>
            <p className="text-sm text-gray-600 truncate">
              {isParentElement 
                ? `View allocations from ${selectedElement?.childElements?.length || 0} child elements`
                : selectedElementName 
                  ? `Manage monthly allocations for this element`
                  : 'Manage monthly allocations for BOE elements'
              }
            </p>
          </div>
          {selectedElementId && !isParentElement && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-shrink-0 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-2"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Create
            </button>
          )}
        </div>
      </div>

      {/* WBS Element Details Section */}
      {selectedElement && (() => {
        const costCategory = costCategories.find(cat => cat.id === selectedElement.costCategoryId);
        
        return (
          <div className="flex-shrink-0 p-4 bg-blue-50 border-b border-blue-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">WBS Element Details</h3>
            <div className="space-y-3">
              {/* Code, Name, Cost Category */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">WBS Code</div>
                  <div className="text-sm font-semibold text-gray-900 bg-white rounded-md p-2 border border-gray-200">
                    {selectedElement.code}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Name</div>
                  <div className="text-sm font-semibold text-gray-900 bg-white rounded-md p-2 border border-gray-200">
                    {selectedElement.name}
                  </div>
                </div>
                {costCategory && (
                  <div className="col-span-2">
                    <div className="text-xs font-medium text-gray-700 mb-1">Cost Category</div>
                    <div className="text-sm text-gray-900 bg-white rounded-md p-2 border border-gray-200">
                      {costCategory.name}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Notes, Assumptions, Risks */}
              {(selectedElement.notes || selectedElement.assumptions || selectedElement.risks) ? (
                <div className="space-y-3">
                  {selectedElement.notes && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Notes</div>
                      <div className="text-sm text-gray-600 bg-white rounded-md p-2 border border-gray-200">
                        {selectedElement.notes}
                      </div>
                    </div>
                  )}
                  {selectedElement.assumptions && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Assumptions</div>
                      <div className="text-sm text-gray-600 bg-white rounded-md p-2 border border-gray-200">
                        {selectedElement.assumptions}
                      </div>
                    </div>
                  )}
                  {selectedElement.risks && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Risks</div>
                      <div className="text-sm text-gray-600 bg-white rounded-md p-2 border border-gray-200">
                        {selectedElement.risks}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No notes, assumptions, or risks defined for this element.</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Summary Cards - Compact */}
      {selectedElement && (() => {
        const elementSummary = getSelectedElementSummary();
        if (!elementSummary) return null;

        return (
          <div className="flex-shrink-0 p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs font-medium text-gray-500">Total Allocations</div>
                <div className="text-lg font-semibold text-gray-900">
                  {elementSummary.totalAllocations}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs font-medium text-gray-500">Total Estimated Cost</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(getElementEstimatedCost(selectedElement))}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs font-medium text-gray-500">Allocated Cost</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(elementSummary.allocatedCost)}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Allocations List - Compact */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-medium text-gray-900">
            {isParentElement ? 'Child Element Allocations' : 'Allocations'}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isParentElement ? (
            // Parent element view - show grouped allocations by child
            !selectedElement?.childElements || selectedElement.childElements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderIcon className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No child elements found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {childAllocationGroups.map((group) => (
                  <div key={group.childElement.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Child Element Header */}
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleChildGroup(group.childElement.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-200 rounded">
                          {expandedChildGroups.has(group.childElement.id) ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                        </button>
                        <DocumentIcon className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {group.childElement.code} - {group.childElement.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {group.allocations.length} allocation{group.allocations.length !== 1 ? 's' : ''}
                            {group.allocations.length === 0 && ' (no allocations yet)'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {group.allocations.length > 0 ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(group.totalAmount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(group.allocatedAmount)} allocated
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-400 italic">
                            No allocations
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Child Allocations */}
                    {expandedChildGroups.has(group.childElement.id) && (
                      <div className="p-3 space-y-3">
                        {group.allocations.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-sm">
                            No allocations for this child element yet.
                          </div>
                        ) : (
                          group.allocations.map((allocation) => {
                          const allocationVendor = vendors.find(v => v.id === allocation.vendorId);
                          const monthlyBreakdown = allocation.monthlyBreakdown || {};
                          const monthlyEntries = Object.keys(monthlyBreakdown).length;
                          
                          return (
                            <div key={allocation.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                      {allocation.name}
                                    </h4>
                                    {allocation.isLocked ? (
                                      <LockClosedIcon className="h-4 w-4 text-green-600 flex-shrink-0" title="Locked" />
                                    ) : (
                                      <LockOpenIcon className="h-4 w-4 text-blue-600 flex-shrink-0" title="Active" />
                                    )}
                                  </div>
                                  {allocation.description && (
                                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">{allocation.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                                  <button
                                    onClick={() => handleEditAllocation(allocation)}
                                    className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-blue-600 transition-colors"
                                    title="Edit allocation"
                                  >
                                    <PencilIcon className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAllocation(allocation)}
                                    className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-red-600 transition-colors"
                                    title="Delete allocation"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Key Details */}
                              <div className="grid grid-cols-2 gap-2 text-xs mb-2 pb-2 border-b border-gray-200">
                                <div>
                                  <span className="text-gray-500">Amount:</span>
                                  <span className="ml-1 font-medium text-gray-900">{formatCurrency(allocation.totalAmount)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Type:</span>
                                  <span className="ml-1 font-medium text-gray-900">{allocation.allocationType}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Start:</span>
                                  <span className="ml-1 font-medium text-gray-900">{formatDate(allocation.startDate)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">End:</span>
                                  <span className="ml-1 font-medium text-gray-900">{formatDate(allocation.endDate)}</span>
                                </div>
                                {allocation.totalQuantity && (
                                  <div>
                                    <span className="text-gray-500">Quantity:</span>
                                    <span className="ml-1 font-medium text-gray-900">
                                      {Math.round(allocation.totalQuantity)} {allocation.quantityUnit || 'units'}
                                    </span>
                                  </div>
                                )}
                                {allocationVendor && (
                                  <div>
                                    <span className="text-gray-500">Vendor:</span>
                                    <span className="ml-1 font-medium text-gray-900">{allocationVendor.name}</span>
                                  </div>
                                )}
                              </div>

                              {/* Notes, Assumptions, Risks */}
                              {(allocation.notes || allocation.assumptions || allocation.risks) && (
                                <div className="space-y-1.5 mt-2">
                                  {allocation.notes && (
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 mb-0.5">Notes</div>
                                      <div className="text-xs text-gray-600 bg-white rounded p-1.5">{allocation.notes}</div>
                                    </div>
                                  )}
                                  {allocation.assumptions && (
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 mb-0.5">Assumptions</div>
                                      <div className="text-xs text-gray-600 bg-white rounded p-1.5">{allocation.assumptions}</div>
                                    </div>
                                  )}
                                  {allocation.risks && (
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 mb-0.5">Risks</div>
                                      <div className="text-xs text-gray-600 bg-white rounded p-1.5">{allocation.risks}</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                          })
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            // Leaf element view - show individual allocations
            filteredAllocations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No allocations found</p>
                {selectedElementId && (
                  <p className="text-xs text-gray-400 mt-1">Click "Create" to add an allocation</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAllocations.map((allocation) => {
                  const allocationVendor = vendors.find(v => v.id === allocation.vendorId);
                  const monthlyBreakdown = allocation.monthlyBreakdown || {};
                  const monthlyEntries = Object.keys(monthlyBreakdown).length;
                  
                  return (
                    <div key={allocation.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {allocation.name}
                            </h4>
                            {allocation.isLocked ? (
                              <LockClosedIcon className="h-4 w-4 text-green-600 flex-shrink-0" title="Locked" />
                            ) : (
                              <LockOpenIcon className="h-4 w-4 text-blue-600 flex-shrink-0" title="Active" />
                            )}
                          </div>
                          {allocation.description && (
                            <p className="text-xs text-gray-600 mb-3 leading-relaxed">{allocation.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditAllocation(allocation)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600 transition-colors"
                            title="Edit allocation"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAllocation(allocation)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-red-600 transition-colors"
                            title="Delete allocation"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Key Details Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-0.5">Total Amount</div>
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(allocation.totalAmount)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-0.5">Allocation Type</div>
                          <div className="text-sm text-gray-700">{allocation.allocationType}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-0.5">Start Date</div>
                          <div className="text-sm text-gray-700">{formatDate(allocation.startDate)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-0.5">End Date</div>
                          <div className="text-sm text-gray-700">{formatDate(allocation.endDate)}</div>
                        </div>
                        {allocation.totalQuantity && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-0.5">Quantity</div>
                            <div className="text-sm text-gray-700">
                              {Math.round(allocation.totalQuantity)} {allocation.quantityUnit || 'units'}
                            </div>
                          </div>
                        )}
                        {allocationVendor && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-0.5">Vendor</div>
                            <div className="text-sm text-gray-700">{allocationVendor.name}</div>
                          </div>
                        )}
                        {monthlyEntries > 0 && (
                          <div className="col-span-2">
                            <div className="text-xs font-medium text-gray-500 mb-0.5">Monthly Breakdown</div>
                            <div className="text-sm text-gray-700">{monthlyEntries} month{monthlyEntries !== 1 ? 's' : ''}</div>
                          </div>
                        )}
                      </div>

                      {/* Notes, Assumptions, Risks */}
                      {(allocation.notes || allocation.assumptions || allocation.risks) && (
                        <div className="space-y-2">
                          {allocation.notes && (
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">Notes</div>
                              <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">{allocation.notes}</div>
                            </div>
                          )}
                          {allocation.assumptions && (
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">Assumptions</div>
                              <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">{allocation.assumptions}</div>
                            </div>
                          )}
                          {allocation.risks && (
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">Risks</div>
                              <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">{allocation.risks}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Create Allocation Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Element Allocation"
        >
          {/* Form */}
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocation Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software Development - Level 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocation Type *
                </label>
                <select
                  value={formData.allocationType}
                  onChange={(e) => setFormData({ ...formData, allocationType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Linear">Linear</option>
                  <option value="Front-Loaded">Front-Loaded</option>
                  <option value="Back-Loaded">Back-Loaded</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the allocation..."
              />
            </div>

            {/* Amount and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalQuantity || ''}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Unit
                </label>
                <input
                  type="text"
                  value={formData.quantityUnit || ''}
                  onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., hours, units"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                value={formData.vendorId || ''}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select vendor (optional)</option>
                {vendors.filter(v => v.isActive).map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Breakdown Preview */}
            {Object.keys(monthlyBreakdown).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Breakdown Preview
                </label>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 mb-2">
                    <div>Month</div>
                    <div>Amount</div>
                    <div>Quantity</div>
                    <div>Date</div>
                  </div>
                  {Object.entries(monthlyBreakdown).map(([month, data]) => (
                    <div key={month} className="grid grid-cols-4 gap-4 text-sm text-gray-600 py-1 border-b border-gray-200">
                      <div>{month}</div>
                      <div>{formatCurrency(data.amount)}</div>
                      <div>{data.quantity ? `${data.quantity} ${formData.quantityUnit || ''}` : '-'}</div>
                      <div>{data.date}</div>
                    </div>
                  ))}
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-900 pt-2 border-t border-gray-300">
                    <div>Total</div>
                    <div>{formatCurrency(Object.values(monthlyBreakdown).reduce((sum, data) => sum + data.amount, 0))}</div>
                    <div>{formData.totalQuantity ? `${formData.totalQuantity} ${formData.quantityUnit || ''}` : '-'}</div>
                    <div></div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assumptions
                </label>
                <textarea
                  value={formData.assumptions}
                  onChange={(e) => setFormData({ ...formData, assumptions: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Key assumptions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risks
                </label>
                <textarea
                  value={formData.risks}
                  onChange={(e) => setFormData({ ...formData, risks: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Potential risks..."
                />
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAllocation}
                variant="primary"
                size="sm"
                disabled={creating || !selectedElementId}
              >
                {creating ? 'Creating...' : 'Create Allocation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Allocation Modal */}
      {showEditModal && editingAllocation && (
                 <Modal
           isOpen={showEditModal}
           onClose={handleCancelEdit}
           title="Edit Element Allocation"
         >
          {/* Form */}
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocation Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software Development - Level 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocation Type *
                </label>
                <select
                  value={formData.allocationType}
                  onChange={(e) => setFormData({ ...formData, allocationType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Linear">Linear</option>
                  <option value="Front-Loaded">Front-Loaded</option>
                  <option value="Back-Loaded">Back-Loaded</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the allocation..."
              />
            </div>

            {/* Amount and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalQuantity || ''}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Unit
                </label>
                <input
                  type="text"
                  value={formData.quantityUnit || ''}
                  onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., hours, units"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                value={formData.vendorId || ''}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select vendor (optional)</option>
                {vendors.filter(v => v.isActive).map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Breakdown Preview */}
            {Object.keys(monthlyBreakdown).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Breakdown Preview
                </label>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 mb-2">
                    <div>Month</div>
                    <div>Amount</div>
                    <div>Quantity</div>
                    <div>Date</div>
                  </div>
                  {Object.entries(monthlyBreakdown).map(([month, data]) => (
                    <div key={month} className="grid grid-cols-4 gap-4 text-sm text-gray-600 py-1 border-b border-gray-200">
                      <div>{month}</div>
                      <div>{formatCurrency(data.amount)}</div>
                      <div>{data.quantity ? `${data.quantity} ${formData.quantityUnit || ''}` : '-'}</div>
                      <div>{data.date}</div>
                    </div>
                  ))}
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-900 pt-2 border-t border-gray-300">
                    <div>Total</div>
                    <div>{formatCurrency(Object.values(monthlyBreakdown).reduce((sum, data) => sum + data.amount, 0))}</div>
                    <div>{formData.totalQuantity ? `${formData.totalQuantity} ${formData.quantityUnit || ''}` : '-'}</div>
                    <div></div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assumptions
                </label>
                <textarea
                  value={formData.assumptions}
                  onChange={(e) => setFormData({ ...formData, assumptions: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Key assumptions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risks
                </label>
                <textarea
                  value={formData.risks}
                  onChange={(e) => setFormData({ ...formData, risks: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Potential risks..."
                />
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                onClick={handleCancelEdit}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAllocation}
                variant="primary"
                size="sm"
                disabled={loading || !selectedElementId}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingAllocation && (
        <Modal
          isOpen={showDeleteModal}
          onClose={handleCancelDelete}
          title="Confirm Deletion"
        >
          <div className="text-center py-4">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Are you sure you want to delete this allocation?
            </h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500">
                This action cannot be undone. This will permanently delete the allocation.
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
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

export default BOEElementAllocationManager; 