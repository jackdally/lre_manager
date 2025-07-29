import { BOEElement } from '../store/boeStore';
import { safeNumber } from '../utils/currencyUtils';

export interface BOECalculationResult {
  totalEstimatedCost: number;
  totalActualCost: number;
  totalVariance: number;
  managementReserveAmount: number;
  managementReservePercentage: number;
  totalWithMR: number;
  elementCount: number;
  requiredElementCount: number;
  optionalElementCount: number;
  costCategoryBreakdown: CostCategoryBreakdown[];
  levelBreakdown: LevelBreakdown[];
}

export interface CostCategoryBreakdown {
  costCategoryId: string;
  costCategoryName: string;
  estimatedCost: number;
  actualCost: number;
  variance: number;
  elementCount: number;
}

export interface LevelBreakdown {
  level: number;
  estimatedCost: number;
  actualCost: number;
  variance: number;
  elementCount: number;
}

export class BOECalculationService {
  /**
   * Calculate comprehensive BOE totals and breakdowns
   */
  static calculateBOETotals(elements: BOEElement[], managementReservePercentage: number = 10): BOECalculationResult {
    const allElements = this.flattenElements(elements);
    
    const totalEstimatedCost = allElements.reduce((sum, element) => sum + safeNumber(element.estimatedCost), 0);
    const totalActualCost = allElements.reduce((sum, element) => sum + safeNumber(element.actualCost), 0);
    const totalVariance = totalActualCost - totalEstimatedCost;
    
    const managementReserveAmount = (totalEstimatedCost * managementReservePercentage) / 100;
    const totalWithMR = totalEstimatedCost + managementReserveAmount;
    
    const elementCount = allElements.length;
    const requiredElementCount = allElements.filter(e => e.isRequired).length;
    const optionalElementCount = allElements.filter(e => e.isOptional).length;
    
    const costCategoryBreakdown = this.calculateCostCategoryBreakdown(allElements);
    const levelBreakdown = this.calculateLevelBreakdown(allElements);
    
    return {
      totalEstimatedCost,
      totalActualCost,
      totalVariance,
      managementReserveAmount,
      managementReservePercentage,
      totalWithMR,
      elementCount,
      requiredElementCount,
      optionalElementCount,
      costCategoryBreakdown,
      levelBreakdown
    };
  }

  /**
   * Flatten hierarchical elements into a flat array
   */
  static flattenElements(elements: BOEElement[]): BOEElement[] {
    const result: BOEElement[] = [];
    
    const flatten = (items: BOEElement[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.childElements && item.childElements.length > 0) {
          flatten(item.childElements);
        }
      });
    };
    
    flatten(elements);
    return result;
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
    
    return rootElements;
  }

  /**
   * Calculate cost category breakdown
   */
  static calculateCostCategoryBreakdown(elements: BOEElement[]): CostCategoryBreakdown[] {
    const breakdown = new Map<string, CostCategoryBreakdown>();
    
    elements.forEach(element => {
      const categoryId = element.costCategoryId || 'uncategorized';
      const categoryName = element.costCategoryId ? 'Categorized' : 'Uncategorized';
      
      if (!breakdown.has(categoryId)) {
        breakdown.set(categoryId, {
          costCategoryId: categoryId,
          costCategoryName: categoryName,
          estimatedCost: 0,
          actualCost: 0,
          variance: 0,
          elementCount: 0
        });
      }
      
      const category = breakdown.get(categoryId)!;
      category.estimatedCost += safeNumber(element.estimatedCost);
      category.actualCost += safeNumber(element.actualCost);
      category.variance += safeNumber(element.actualCost) - safeNumber(element.estimatedCost);
      category.elementCount += 1;
    });
    
    return Array.from(breakdown.values()).sort((a, b) => b.estimatedCost - a.estimatedCost);
  }

  /**
   * Calculate level breakdown
   */
  static calculateLevelBreakdown(elements: BOEElement[]): LevelBreakdown[] {
    const breakdown = new Map<number, LevelBreakdown>();
    
    elements.forEach(element => {
      const level = element.level;
      
      if (!breakdown.has(level)) {
        breakdown.set(level, {
          level,
          estimatedCost: 0,
          actualCost: 0,
          variance: 0,
          elementCount: 0
        });
      }
      
      const levelData = breakdown.get(level)!;
      levelData.estimatedCost += safeNumber(element.estimatedCost);
      levelData.actualCost += safeNumber(element.actualCost);
      levelData.variance += safeNumber(element.actualCost) - safeNumber(element.estimatedCost);
      levelData.elementCount += 1;
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
    const allElements = this.flattenElements(elements);

    // Check for required elements
    const requiredElements = allElements.filter(e => e.isRequired);
    for (const element of requiredElements) {
      if (!element.estimatedCost || element.estimatedCost <= 0) {
        errors.push(`Required element "${element.name}" has no estimated cost`);
      }
      if (!element.costCategoryId) {
        errors.push(`Required element "${element.name}" has no cost category assigned`);
      }
    }

    // Check for hierarchical structure
    const rootElements = elements.filter(e => !e.parentElementId);
    if (rootElements.length === 0) {
      errors.push('BOE must have at least one root element');
    }

    // Check for duplicate codes
    const codes = allElements.map(e => e.code);
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