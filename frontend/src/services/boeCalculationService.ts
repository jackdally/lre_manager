import { BOEElement } from '../store/boeStore';
import { safeNumber } from '../utils/currencyUtils';

export interface BOECalculationResult {
  totalEstimatedCost: number; // Sum of allocation totals (if available) or estimated costs
  totalAllocatedCost: number; // Sum of all allocation totals (if any exist)
  managementReserveAmount: number;
  managementReservePercentage: number;
  totalWithMR: number;
  elementCount: number;
  requiredElementCount: number;
  optionalElementCount: number;
  costCategoryBreakdown: CostCategoryBreakdown[];
  levelBreakdown: LevelBreakdown[];
  reconciliationIssues: Array<{
    elementId: string;
    elementCode: string;
    elementName: string;
    estimatedCost: number;
    allocatedTotal: number;
    difference: number;
  }>;
}

export interface CostCategoryBreakdown {
  costCategoryId: string;
  costCategoryName: string;
  estimatedCost: number;
  allocatedCost: number;
  elementCount: number;
}

export interface LevelBreakdown {
  level: number;
  estimatedCost: number;
  allocatedCost: number;
  elementCount: number;
}

export class BOECalculationService {
  /**
   * Calculate comprehensive BOE totals and breakdowns
   * Allocations are the source of truth - if allocations exist, use their sum; otherwise use estimated cost
   */
  static calculateBOETotals(
    elements: BOEElement[], 
    managementReservePercentage: number = 10,
    elementAllocations: any[] = []
  ): BOECalculationResult {
    const allElements = this.flattenElements(elements);
    
    // Calculate allocation sums per element
    const allocationSumByElement = new Map<string, number>();
    elementAllocations.forEach(allocation => {
      const current = allocationSumByElement.get(allocation.boeElementId) || 0;
      allocationSumByElement.set(allocation.boeElementId, current + safeNumber(allocation.totalAmount));
    });
    
    // Identify leaf elements (elements that don't appear as parentElementId AND don't have childElements)
    const parentIds = new Set<string>();
    allElements.forEach(el => {
      if (el.parentElementId) {
        parentIds.add(el.parentElementId);
      }
    });
    
    // Also check for elements that have childElements in the hierarchical structure
    const elementsWithChildren = new Set<string>();
    const checkForChildren = (els: BOEElement[]) => {
      els.forEach(el => {
        if (el.childElements && el.childElements.length > 0) {
          elementsWithChildren.add(el.id);
          checkForChildren(el.childElements);
        }
      });
    };
    checkForChildren(elements);
    
    // Leaf elements are those that: 1) don't appear as a parentElementId, AND 2) don't have childElements
    const leafElementIds = allElements
      .filter(el => !parentIds.has(el.id) && !elementsWithChildren.has(el.id))
      .map(el => el.id);
    const leafElementSet = new Set(leafElementIds);
    
    // Calculate estimated cost total - ONLY sum estimated costs from leaf elements (never allocations)
    const trueEstimatedTotal = allElements
      .filter(el => leafElementSet.has(el.id))
      .reduce((sum, element) => sum + safeNumber(element.estimatedCost), 0);
    
    const totalAllocatedCost = Array.from(allocationSumByElement.values()).reduce((sum, val) => sum + val, 0);
    
    const managementReserveAmount = (trueEstimatedTotal * managementReservePercentage) / 100;
    const totalWithMR = trueEstimatedTotal + managementReserveAmount;
    
    // Count only leaf elements
    
    const elementCount = leafElementIds.length;
    const requiredElementCount = allElements.filter(e => e.isRequired && leafElementSet.has(e.id)).length;
    const optionalElementCount = allElements.filter(e => e.isOptional && leafElementSet.has(e.id)).length;
    
    // Calculate reconciliation issues (where allocation sum differs from estimate)
    const reconciliationIssues: Array<{
      elementId: string;
      elementCode: string;
      elementName: string;
      estimatedCost: number;
      allocatedTotal: number;
      difference: number;
    }> = [];
    
    allElements.forEach(element => {
      const allocationSum = allocationSumByElement.get(element.id) || 0;
      const estimated = safeNumber(element.estimatedCost);
      
      if (allocationSum > 0 && estimated > 0 && Math.abs(allocationSum - estimated) > 0.01) {
        reconciliationIssues.push({
          elementId: element.id,
          elementCode: element.code,
          elementName: element.name,
          estimatedCost: estimated,
          allocatedTotal: allocationSum,
          difference: allocationSum - estimated
        });
      }
    });
    
    // Pass hierarchical structure to breakdown functions (they will flatten internally)
    const costCategoryBreakdown = this.calculateCostCategoryBreakdown(elements, allocationSumByElement);
    const levelBreakdown = this.calculateLevelBreakdown(elements, allocationSumByElement);
    
    return {
      totalEstimatedCost: trueEstimatedTotal,
      totalAllocatedCost,
      managementReserveAmount,
      managementReservePercentage,
      totalWithMR,
      elementCount,
      requiredElementCount,
      optionalElementCount,
      costCategoryBreakdown,
      levelBreakdown,
      reconciliationIssues
    };
  }

  /**
   * Calculate aggregated cost for an element (sum of all leaf descendants)
   * For leaf elements, returns allocation sum if available, else estimated cost
   * For parent elements, returns the sum of all leaf children (using allocations if available)
   */
  static calculateElementAggregatedCost(
    element: BOEElement, 
    elementAllocations: any[] = []
  ): number {
    const hasChildren = element.childElements && element.childElements.length > 0;
    
    // Get allocation sum for this element
    const allocationSum = elementAllocations
      .filter(a => a.boeElementId === element.id)
      .reduce((sum, a) => sum + safeNumber(a.totalAmount), 0);
    
    if (!hasChildren) {
      // Leaf element: return allocation sum if available, else estimated cost
      return allocationSum > 0 ? allocationSum : safeNumber(element.estimatedCost);
    }
    
    // Parent element: sum all leaf descendants (using allocations if available)
    let total = 0;
    const sumLeafCosts = (elements: BOEElement[]) => {
      elements.forEach(el => {
        const isLeaf = !el.childElements || el.childElements.length === 0;
        if (isLeaf) {
          const childAllocationSum = elementAllocations
            .filter(a => a.boeElementId === el.id)
            .reduce((sum, a) => sum + safeNumber(a.totalAmount), 0);
          total += childAllocationSum > 0 ? childAllocationSum : safeNumber(el.estimatedCost);
        } else {
          // Recursively process children
          sumLeafCosts(el.childElements!);
        }
      });
    };
    
    sumLeafCosts(element.childElements!);
    return total;
  }

  /**
   * Flatten hierarchical elements into a flat array (deduplicated by ID)
   */
  static flattenElements(elements: BOEElement[]): BOEElement[] {
    const result: BOEElement[] = [];
    const seenIds = new Set<string>();
    
    const flatten = (items: BOEElement[]) => {
      items.forEach(item => {
        // Only add element if we haven't seen it before (prevent duplicates)
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          result.push(item);
        }
        if (item.childElements && item.childElements.length > 0) {
          flatten(item.childElements);
        }
      });
    };
    
    flatten(elements);
    return result;
  }

  /**
   * Sort WBS codes numerically (e.g., "1.0", "1.1", "2.0", "10.0")
   */
  private static sortByCode(elements: BOEElement[]): BOEElement[] {
    return elements.sort((a, b) => {
      const codeA = a.code || '';
      const codeB = b.code || '';
      
      // Split codes into parts (e.g., "1.2.3" -> [1, 2, 3])
      const partsA = codeA.split('.').map(Number);
      const partsB = codeB.split('.').map(Number);
      
      // Compare each part
      const maxLength = Math.max(partsA.length, partsB.length);
      for (let i = 0; i < maxLength; i++) {
        const partA = partsA[i] || 0;
        const partB = partsB[i] || 0;
        if (partA !== partB) {
          return partA - partB;
        }
      }
      return 0;
    });
  }

  /**
   * Recursively sort children within each element
   */
  private static sortChildrenRecursive(elements: BOEElement[]): void {
    elements.forEach(element => {
      if (element.childElements && element.childElements.length > 0) {
        element.childElements = this.sortByCode(element.childElements);
        this.sortChildrenRecursive(element.childElements);
      }
    });
  }

  /**
   * Build hierarchical structure from flat array
   */
  static buildHierarchicalStructure(elements: BOEElement[]): BOEElement[] {
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
    
    // Sort root elements by code
    const sortedRoots = this.sortByCode(rootElements);
    
    // Recursively sort children
    this.sortChildrenRecursive(sortedRoots);
    
    return sortedRoots;
  }

  /**
   * Calculate cost category breakdown
   * Only counts leaf elements and uses estimated costs only (never allocations)
   */
  static calculateCostCategoryBreakdown(
    elements: BOEElement[], 
    allocationSumByElement?: Map<string, number>
  ): CostCategoryBreakdown[] {
    const breakdown = new Map<string, CostCategoryBreakdown>();
    
    // Flatten and identify leaf elements (elements that are not parents)
    const allElements = this.flattenElements(elements);
    const parentIds = new Set<string>();
    allElements.forEach(el => {
      if (el.parentElementId) {
        parentIds.add(el.parentElementId);
      }
    });
    
    // Also check for elements that have childElements in the hierarchical structure
    const elementsWithChildren = new Set<string>();
    const checkForChildren = (els: BOEElement[]) => {
      els.forEach(el => {
        if (el.childElements && el.childElements.length > 0) {
          elementsWithChildren.add(el.id);
          checkForChildren(el.childElements);
        }
      });
    };
    checkForChildren(elements);
    
    // Leaf elements are those that: 1) don't appear as a parentElementId, AND 2) don't have childElements
    const leafElementIds = new Set(
      allElements
        .filter(el => !parentIds.has(el.id) && !elementsWithChildren.has(el.id))
        .map(el => el.id)
    );
    
    // Create a deduplicated map of elements by ID (in case of duplicates)
    const uniqueElements = new Map<string, BOEElement>();
    allElements.forEach(el => {
      if (!uniqueElements.has(el.id)) {
        uniqueElements.set(el.id, el);
      }
    });
    
    // Process only leaf elements for the breakdown (using unique elements only)
    Array.from(uniqueElements.values()).forEach(element => {
      // Skip non-leaf elements - they shouldn't be in the breakdown
      if (!leafElementIds.has(element.id)) {
        return;
      }
      
      const categoryId = element.costCategoryId || 'uncategorized';
      const categoryName = element.costCategoryId ? 'Categorized' : 'Uncategorized';
      
      if (!breakdown.has(categoryId)) {
        breakdown.set(categoryId, {
          costCategoryId: categoryId,
          costCategoryName: categoryName,
          estimatedCost: 0,
          allocatedCost: 0,
          elementCount: 0
        });
      }
      
      const category = breakdown.get(categoryId)!;
      const allocationSum = allocationSumByElement?.get(element.id) || 0;
      const estimatedCost = safeNumber(element.estimatedCost);
      
      // Only add estimated costs (never allocations) for leaf elements
      category.estimatedCost += estimatedCost;
      
      // Track allocated costs separately (for display only)
      category.allocatedCost += allocationSum;
      
      // Count leaf elements
      category.elementCount += 1;
    });
    
    return Array.from(breakdown.values()).sort((a, b) => b.estimatedCost - a.estimatedCost);
  }

  /**
   * Calculate level breakdown
   * Only counts leaf elements and uses estimated costs only
   */
  static calculateLevelBreakdown(
    elements: BOEElement[], 
    allocationSumByElement?: Map<string, number>
  ): LevelBreakdown[] {
    const breakdown = new Map<number, LevelBreakdown>();
    
    // Identify leaf elements (elements that are not parents)
    // We need to check both: elements that don't appear as parentElementId AND don't have childElements
    const allElements = this.flattenElements(elements);
    const parentIds = new Set<string>();
    allElements.forEach(el => {
      if (el.parentElementId) {
        parentIds.add(el.parentElementId);
      }
    });
    
    // Also check for elements that have childElements in the hierarchical structure
    const elementsWithChildren = new Set<string>();
    const checkForChildren = (els: BOEElement[]) => {
      els.forEach(el => {
        if (el.childElements && el.childElements.length > 0) {
          elementsWithChildren.add(el.id);
          checkForChildren(el.childElements);
        }
      });
    };
    checkForChildren(elements);
    
    // Leaf elements are those that: 1) don't appear as a parentElementId, AND 2) don't have childElements
    const leafElementIds = new Set(
      allElements
        .filter(el => !parentIds.has(el.id) && !elementsWithChildren.has(el.id))
        .map(el => el.id)
    );
    
    // Create a deduplicated map of elements by ID (in case of duplicates)
    const uniqueElements = new Map<string, BOEElement>();
    allElements.forEach(el => {
      if (!uniqueElements.has(el.id)) {
        uniqueElements.set(el.id, el);
      }
    });
    
    // Process only leaf elements - skip parents entirely (using unique elements only)
    Array.from(uniqueElements.values()).forEach(element => {
      // Skip non-leaf elements completely
      if (!leafElementIds.has(element.id)) {
        return;
      }
      
      const level = element.level;
      
      if (!breakdown.has(level)) {
        breakdown.set(level, {
          level,
          estimatedCost: 0,
          allocatedCost: 0,
          elementCount: 0
        });
      }
      
      const levelData = breakdown.get(level)!;
      const allocationSum = allocationSumByElement?.get(element.id) || 0;
      const estimatedCost = safeNumber(element.estimatedCost);
      
      // Add estimated costs for leaf elements only
      levelData.estimatedCost += estimatedCost;
      levelData.elementCount += 1;
      
      // Track allocated costs separately
      levelData.allocatedCost += allocationSum;
    });
    
    return Array.from(breakdown.values()).sort((a, b) => a.level - b.level);
  }

  /**
   * Calculate management reserve based on different methods
   */
  static calculateManagementReserve(
    totalCost: number, 
    method: 'Standard' | 'Risk-Based' | 'Custom' = 'Standard',
    customPercentage?: number
  ): { amount: number; percentage: number } {
    let percentage: number;

    switch (method) {
      case 'Standard':
        // Industry standard: 5-15% based on project complexity
        percentage = totalCost > 1000000 ? 10 : totalCost > 500000 ? 12 : 15;
        break;
      case 'Risk-Based':
        // Risk-based calculation (simplified)
        percentage = totalCost > 1000000 ? 8 : totalCost > 500000 ? 10 : 12;
        break;
      case 'Custom':
        percentage = customPercentage || 10;
        break;
      default:
        percentage = 10;
    }

    const amount = totalCost > 0 ? (totalCost * percentage) / 100 : 0;

    return {
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      percentage: Math.round(percentage * 100) / 100
    };
  }

  /**
   * Validate BOE structure
   */
  static validateBOEStructure(elements: BOEElement[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Build a map to identify leaf elements before flattening
    const leafElementIds = new Set<string>();
    const allElementsFlat = this.flattenElements(elements);
    
    // Mark all elements as potential leaves first
    allElementsFlat.forEach(el => leafElementIds.add(el.id));
    
    // Remove parent elements from leaf set (they have children)
    const markParents = (elements: BOEElement[]) => {
      elements.forEach(element => {
        if (element.childElements && element.childElements.length > 0) {
          leafElementIds.delete(element.id);
          markParents(element.childElements);
        }
      });
    };
    markParents(elements);

    // Check for required elements - only validate leaf elements for cost categories
    const requiredElements = allElementsFlat.filter(e => e.isRequired);
    for (const element of requiredElements) {
      const isLeaf = leafElementIds.has(element.id);
      
      // Cost validation: only check leaf elements
      if (isLeaf) {
        if (!element.estimatedCost || element.estimatedCost <= 0) {
          errors.push(`Required element "${element.code} ${element.name}" has no estimated cost`);
        }
        if (!element.costCategoryId) {
          errors.push(`Required element "${element.code} ${element.name}" has no cost category assigned`);
        }
      } else {
        // For parent elements, calculate aggregated cost from children and validate that
        const aggregatedCost = this.calculateElementAggregatedCost(element);
        if (aggregatedCost <= 0) {
          errors.push(`Required element "${element.code} ${element.name}" has no estimated cost`);
        }
        // Don't require cost category on parents
      }
    }

    // Check for hierarchical structure
    const rootElements = elements.filter(e => !e.parentElementId);
    if (rootElements.length === 0) {
      errors.push('BOE must have at least one root element');
    }

    // Check for duplicate codes
    const codes = allElementsFlat.map(e => e.code);
    const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
    if (duplicateCodes.length > 0) {
      errors.push(`Duplicate element codes found: ${duplicateCodes.join(', ')}`);
    }

    // Check for circular references
    const hasCircularReference = this.checkCircularReferences(elements);
    if (hasCircularReference) {
      errors.push('Circular reference detected in element hierarchy');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for circular references in element hierarchy
   */
  private static checkCircularReferences(elements: BOEElement[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (elementId: string): boolean => {
      if (recursionStack.has(elementId)) {
        return true;
      }
      if (visited.has(elementId)) {
        return false;
      }

      visited.add(elementId);
      recursionStack.add(elementId);

      const element = this.findElementById(elements, elementId);
      if (element && element.childElements) {
        for (const child of element.childElements) {
          if (hasCycle(child.id)) {
            return true;
          }
        }
      }

      recursionStack.delete(elementId);
      return false;
    };

    for (const element of elements) {
      if (!visited.has(element.id)) {
        if (hasCycle(element.id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Find element by ID in hierarchical structure
   */
  private static findElementById(elements: BOEElement[], id: string): BOEElement | null {
    for (const element of elements) {
      if (element.id === id) {
        return element;
      }
      if (element.childElements) {
        const found = this.findElementById(element.childElements, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Get element path (breadcrumb) for a given element
   */
  static getElementPath(elements: BOEElement[], elementId: string): BOEElement[] {
    const path: BOEElement[] = [];
    
    const findPath = (items: BOEElement[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.unshift(item);
          return true;
        }
        if (item.childElements) {
          if (findPath(item.childElements, targetId)) {
            path.unshift(item);
            return true;
          }
        }
      }
      return false;
    };
    
    findPath(elements, elementId);
    return path;
  }

  /**
   * Calculate completion percentage based on required elements
   */
  static calculateCompletionPercentage(elements: BOEElement[]): number {
    const allElements = this.flattenElements(elements);
    const requiredElements = allElements.filter(e => e.isRequired);
    
    if (requiredElements.length === 0) {
      return 100;
    }
    
    const completedElements = requiredElements.filter(e => 
      e.estimatedCost > 0 && e.costCategoryId
    );
    
    return Math.round((completedElements.length / requiredElements.length) * 100);
  }
}

export default BOECalculationService; 