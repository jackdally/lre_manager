import axios from 'axios';

// Types matching the backend service
export type AdjustmentScenario = 'partial_delivery' | 'cost_overrun' | 'cost_underspend' | 'schedule_change';

export interface ScenarioOption {
  id: AdjustmentScenario;
  title: string;
  description: string;
  recommended: boolean;
  available: boolean;
}

export interface AvailableScenarios {
  recommended: AdjustmentScenario;
  available: ScenarioOption[];
}

export interface AllocationImpactRequest {
  ledgerEntryId: string;
  scenario: AdjustmentScenario;
  remainingAmount?: number;
  remainingDate?: string;
  splits?: Array<{
    amount: number;
    date: string;
    description?: string;
  }>;
  relevelingScope?: 'single' | 'remaining' | 'entire';
  relevelingAlgorithm?: 'linear' | 'front-loaded' | 'back-loaded' | 'custom';
  weightIntensity?: number;
  customDistribution?: Record<string, number>;
  newPlannedDate?: string;
  actualAmount?: number; // Add actual transaction amount
  actualDate?: string; // Add actual transaction date
}

export interface AllocationImpact {
  totalChange: number;
  entriesAffected: number;
  scenario: AdjustmentScenario;
  futureAllocations: Array<{
    id: string;
    originalPlanned: number;
    newPlanned: number;
    change: number;
    plannedDate: string;
    description: string;
  }>;
  warnings: string[];
  notes: string[];
}

export interface PartialDeliveryRequest {
  ledgerEntryId: string;
  splits: Array<{
    amount: number;
    date: string;
    description?: string;
  }>;
  reason: string;
  userId?: string;
  actualAmount?: number;
  actualDate?: string;
}

export interface ReForecastRequest {
  ledgerEntryId: string;
  scenario: 'cost_overrun' | 'cost_underspend';
  relevelingScope: 'single' | 'remaining' | 'entire';
  relevelingAlgorithm: 'linear' | 'front-loaded' | 'back-loaded' | 'custom';
  weightIntensity?: number;
  customDistribution?: Record<string, number>;
  baselineExceedanceJustification?: string;
  reason: string;
  userId?: string;
  actualAmount?: number;
  actualDate?: string;
}

export interface ScheduleChangeRequest {
  ledgerEntryId: string;
  newPlannedDate: string;
  reason: string;
  userId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class TransactionAdjustmentApi {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/transaction-adjustment') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get available adjustment scenarios for a ledger entry
   */
  async getAvailableScenarios(
    ledgerEntryId: string,
    actualAmount?: number,
    actualDate?: string
  ): Promise<AvailableScenarios> {
    try {
      const params = new URLSearchParams();
      if (actualAmount !== undefined) {
        params.append('actualAmount', actualAmount.toString());
      }
      if (actualDate) {
        params.append('actualDate', actualDate);
      }

      const response = await axios.get(`${this.baseUrl}/${ledgerEntryId}/scenarios?${params}`);
      return response.data as AvailableScenarios;
    } catch (error) {
      console.error('Error getting available scenarios:', error);
      throw error;
    }
  }

  /**
   * Calculate the impact of an adjustment on future allocations
   */
  async calculateAllocationImpact(request: AllocationImpactRequest): Promise<AllocationImpact> {
    try {
      const response = await axios.post(`${this.baseUrl}/${request.ledgerEntryId}/allocation-impact`, request);
      return response.data as AllocationImpact;
    } catch (error) {
      console.error('Error calculating allocation impact:', error);
      throw error;
    }
  }

  /**
   * Apply a transaction adjustment (split, re-forecast, or schedule change)
   */
  async applyAdjustment(
    ledgerEntryId: string,
    scenario: AdjustmentScenario,
    config: PartialDeliveryRequest | ReForecastRequest | ScheduleChangeRequest
  ): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/${ledgerEntryId}/apply`, {
        scenario,
        ...config
      });
      return response.data;
    } catch (error) {
      console.error('Error applying adjustment:', error);
      throw error;
    }
  }

  /**
   * Validate an adjustment configuration
   */
  async validateAdjustment(request: AllocationImpactRequest): Promise<ValidationResult> {
    try {
      const response = await axios.post(`${this.baseUrl}/${request.ledgerEntryId}/validate`, request);
      return response.data as ValidationResult;
    } catch (error) {
      console.error('Error validating adjustment:', error);
      throw error;
    }
  }

  /**
   * Apply a partial delivery adjustment
   */
  async applyPartialDelivery(request: PartialDeliveryRequest): Promise<any> {
    return this.applyAdjustment(request.ledgerEntryId, 'partial_delivery', request);
  }

  /**
   * Apply a re-forecast adjustment
   */
  async applyReForecast(request: ReForecastRequest): Promise<any> {
    return this.applyAdjustment(request.ledgerEntryId, request.scenario, request);
  }

  /**
   * Apply a schedule change adjustment
   */
  async applyScheduleChange(request: ScheduleChangeRequest): Promise<any> {
    return this.applyAdjustment(request.ledgerEntryId, 'schedule_change', request);
  }
}

// Export a default instance
export const transactionAdjustmentApi = new TransactionAdjustmentApi();