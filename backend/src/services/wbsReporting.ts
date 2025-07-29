import { AppDataSource } from '../config/database';
import { WbsElement } from '../entities/WbsElement';
import { LedgerEntry } from '../entities/LedgerEntry';

export interface WbsCostSummary {
  elementId: string;
  elementCode: string;
  elementName: string;
  level: number;
  parentId?: string;
  baselineTotal: number;
  plannedTotal: number;
  actualTotal: number;
  childCount: number;
  hasChildren: boolean;
  children?: WbsCostSummary[];
}

export interface WbsRollupReport {
  programId: string;
  totalBaseline: number;
  totalPlanned: number;
  totalActual: number;
  elements: WbsCostSummary[];
  summary: {
    baselineVariance: number;
    plannedVariance: number;
    costPerformanceIndex: number;
    schedulePerformanceIndex: number;
  };
}

export class WbsReportingService {
  private wbsElementRepo = AppDataSource.getRepository(WbsElement);
  private ledgerRepo = AppDataSource.getRepository(LedgerEntry);

  /**
   * Get roll-up cost report for a program's WBS structure
   */
  async getRollupReport(programId: string): Promise<WbsRollupReport> {
    // Get all WBS elements for the program
    const elements = await this.wbsElementRepo.find({
      where: { program: { id: programId } },
      order: { code: 'ASC' }
    });

    // Get all ledger entries for the program
    const ledgerEntries = await this.ledgerRepo.find({
      where: { program: { id: programId } },
      relations: ['wbsElement']
    });

    // Calculate costs for each element
    const elementCosts = await this.calculateElementCosts(elements, ledgerEntries);

    // Build hierarchical structure
    const hierarchicalCosts = this.buildHierarchicalCosts(elementCosts);

    // Calculate totals
    const totalBaseline = hierarchicalCosts.reduce((sum, el) => sum + el.baselineTotal, 0);
    const totalPlanned = hierarchicalCosts.reduce((sum, el) => sum + el.plannedTotal, 0);
    const totalActual = hierarchicalCosts.reduce((sum, el) => sum + el.actualTotal, 0);

    // Calculate performance indices
    const baselineVariance = totalActual - totalBaseline;
    const plannedVariance = totalActual - totalPlanned;
    const costPerformanceIndex = totalActual !== 0 ? totalPlanned / totalActual : 0;
    const schedulePerformanceIndex = totalBaseline !== 0 ? totalActual / totalBaseline : 0;

    return {
      programId,
      totalBaseline,
      totalPlanned,
      totalActual,
      elements: hierarchicalCosts,
      summary: {
        baselineVariance,
        plannedVariance,
        costPerformanceIndex,
        schedulePerformanceIndex
      }
    };
  }

  /**
   * Calculate costs for each WBS element
   */
  private async calculateElementCosts(
    elements: WbsElement[], 
    ledgerEntries: LedgerEntry[]
  ): Promise<WbsCostSummary[]> {
    return elements.map(element => {
      // Find ledger entries that reference this element
      const elementEntries = ledgerEntries.filter(entry => 
        entry.wbsElementId === element.id
      );

      // Calculate totals for this element
      const baselineTotal = elementEntries.reduce((sum, entry) => 
        sum + (entry.baseline_amount || 0), 0
      );
      const plannedTotal = elementEntries.reduce((sum, entry) => 
        sum + (entry.planned_amount || 0), 0
      );
      const actualTotal = elementEntries.reduce((sum, entry) => 
        sum + (entry.actual_amount || 0), 0
      );

      // Count direct children
      const childCount = elements.filter(el => el.parentId === element.id).length;

      return {
        elementId: element.id,
        elementCode: element.code,
        elementName: element.name,
        level: element.level,
        parentId: element.parentId,
        baselineTotal,
        plannedTotal,
        actualTotal,
        childCount,
        hasChildren: childCount > 0
      };
    });
  }

  /**
   * Build hierarchical cost structure with roll-up calculations
   */
  private buildHierarchicalCosts(elementCosts: WbsCostSummary[]): WbsCostSummary[] {
    const elementMap = new Map<string, WbsCostSummary>();
    const rootElements: WbsCostSummary[] = [];

    // Create map of all elements
    elementCosts.forEach(element => {
      elementMap.set(element.elementId, { ...element, children: [] });
    });

    // Build hierarchy and calculate roll-ups
    elementCosts.forEach(element => {
      const elementWithChildren = elementMap.get(element.elementId)!;
      
      if (element.parentId) {
        const parent = elementMap.get(element.parentId);
        if (parent) {
          parent.children!.push(elementWithChildren);
        }
      } else {
        rootElements.push(elementWithChildren);
      }
    });

    // Calculate roll-up totals (children costs added to parent totals)
    this.calculateRollupTotals(rootElements);

    return rootElements;
  }

  /**
   * Recursively calculate roll-up totals from children to parents
   */
  private calculateRollupTotals(elements: WbsCostSummary[]): void {
    elements.forEach(element => {
      if (element.children && element.children.length > 0) {
        // Calculate roll-up totals from children
        this.calculateRollupTotals(element.children);
        
        // Add child totals to parent
        element.baselineTotal += element.children.reduce((sum, child) => 
          sum + child.baselineTotal, 0
        );
        element.plannedTotal += element.children.reduce((sum, child) => 
          sum + child.plannedTotal, 0
        );
        element.actualTotal += element.children.reduce((sum, child) => 
          sum + child.actualTotal, 0
        );
      }
    });
  }

  /**
   * Get cost breakdown by WBS level
   */
  async getCostBreakdownByLevel(programId: string): Promise<{
    level: number;
    totalBaseline: number;
    totalPlanned: number;
    totalActual: number;
    elementCount: number;
  }[]> {
    const elements = await this.wbsElementRepo.find({
      where: { program: { id: programId } }
    });

    const ledgerEntries = await this.ledgerRepo.find({
      where: { program: { id: programId } },
      relations: ['wbsElement']
    });

    // Group by level
    const levelMap = new Map<number, {
      level: number;
      totalBaseline: number;
      totalPlanned: number;
      totalActual: number;
      elementCount: number;
    }>();

    elements.forEach(element => {
      const elementEntries = ledgerEntries.filter(entry => 
        entry.wbsElementId === element.id
      );

      const baselineTotal = elementEntries.reduce((sum, entry) => 
        sum + (entry.baseline_amount || 0), 0
      );
      const plannedTotal = elementEntries.reduce((sum, entry) => 
        sum + (entry.planned_amount || 0), 0
      );
      const actualTotal = elementEntries.reduce((sum, entry) => 
        sum + (entry.actual_amount || 0), 0
      );

      const existing = levelMap.get(element.level) || {
        level: element.level,
        totalBaseline: 0,
        totalPlanned: 0,
        totalActual: 0,
        elementCount: 0
      };

      existing.totalBaseline += baselineTotal;
      existing.totalPlanned += plannedTotal;
      existing.totalActual += actualTotal;
      existing.elementCount += 1;

      levelMap.set(element.level, existing);
    });

    return Array.from(levelMap.values()).sort((a, b) => a.level - b.level);
  }

  /**
   * Get cost variance analysis for a specific WBS element
   */
  async getElementVarianceAnalysis(elementId: string): Promise<{
    element: WbsCostSummary;
    variance: {
      baselineVariance: number;
      plannedVariance: number;
      baselineVariancePercent: number;
      plannedVariancePercent: number;
    };
    performance: {
      costPerformanceIndex: number;
      schedulePerformanceIndex: number;
    };
  } | null> {
    const element = await this.wbsElementRepo.findOne({
      where: { id: elementId },
      relations: ['program']
    });

    if (!element) return null;

    const report = await this.getRollupReport(element.program.id);
    const elementCost = report.elements.find(el => el.elementId === elementId);

    if (!elementCost) return null;

    const baselineVariance = elementCost.actualTotal - elementCost.baselineTotal;
    const plannedVariance = elementCost.actualTotal - elementCost.plannedTotal;
    const baselineVariancePercent = elementCost.baselineTotal !== 0 ? 
      (baselineVariance / elementCost.baselineTotal) * 100 : 0;
    const plannedVariancePercent = elementCost.plannedTotal !== 0 ? 
      (plannedVariance / elementCost.plannedTotal) * 100 : 0;

    const costPerformanceIndex = elementCost.actualTotal !== 0 ? 
      elementCost.plannedTotal / elementCost.actualTotal : 0;
    const schedulePerformanceIndex = elementCost.baselineTotal !== 0 ? 
      elementCost.actualTotal / elementCost.baselineTotal : 0;

    return {
      element: elementCost,
      variance: {
        baselineVariance,
        plannedVariance,
        baselineVariancePercent,
        plannedVariancePercent
      },
      performance: {
        costPerformanceIndex,
        schedulePerformanceIndex
      }
    };
  }
} 