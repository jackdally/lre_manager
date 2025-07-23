import { useCallback } from 'react';
import { useBOEStore } from '../store/boeStore';
import { managementReserveApi } from '../services/boeApi';
import { ManagementReserve } from '../store/boeStore';

export const useManagementReserve = (boeVersionId?: string) => {
  const {
    managementReserve,
    mrLoading,
    mrError,
    mrUtilizationHistory,
    mrUtilizationLoading,
    mrUtilizationError,
    setManagementReserve,
    setMRLoading,
    setMRError,
    setMRUtilizationHistory,
    setMRUtilizationLoading,
    setMRUtilizationError,
  } = useBOEStore();

  // Load MR data
  const loadManagementReserve = useCallback(async () => {
    if (!boeVersionId) return;

    setMRLoading(true);
    setMRError(null);
    
    try {
      const mr = await managementReserveApi.getManagementReserve(boeVersionId);
      setManagementReserve(mr);
    } catch (error: any) {
      setMRError(error instanceof Error ? error.message : 'Failed to load management reserve');
    } finally {
      setMRLoading(false);
    }
  }, [boeVersionId, setManagementReserve, setMRLoading, setMRError]);

  // Update MR
  const updateManagementReserve = useCallback(async (mrData: Partial<ManagementReserve>) => {
    if (!boeVersionId) return;

    setMRLoading(true);
    setMRError(null);
    try {
      const updatedMR = await managementReserveApi.updateManagementReserve(boeVersionId, mrData);
      setManagementReserve(updatedMR);
      return updatedMR;
    } catch (error) {
      setMRError(error instanceof Error ? error.message : 'Failed to update management reserve');
      throw error;
    } finally {
      setMRLoading(false);
    }
  }, [boeVersionId, setManagementReserve, setMRLoading, setMRError]);

  // Calculate MR
  const calculateManagementReserve = useCallback(async (
    method: string, 
    customPercentage?: number,
    projectComplexity?: string,
    riskFactors?: string[]
  ) => {
    if (!boeVersionId) return;

    setMRLoading(true);
    setMRError(null);
    try {
      const calculationData = {
        method,
        customPercentage,
        projectComplexity,
        riskFactors,
      };

      const result = await managementReserveApi.calculateMRWithBreakdown(boeVersionId, calculationData);
      return result;
    } catch (error) {
      setMRError(error instanceof Error ? error.message : 'Failed to calculate management reserve');
      throw error;
    } finally {
      setMRLoading(false);
    }
  }, [boeVersionId, setMRLoading, setMRError]);

  // Utilize MR
  const utilizeManagementReserve = useCallback(async (
    amount: number, 
    reason: string, 
    description?: string
  ) => {
    if (!boeVersionId) return;

    setMRLoading(true);
    setMRError(null);
    try {
      const updatedMR = await managementReserveApi.utilizeManagementReserve(boeVersionId, amount, reason, description);
      setManagementReserve(updatedMR);
      return updatedMR;
    } catch (error) {
      setMRError(error instanceof Error ? error.message : 'Failed to utilize management reserve');
      throw error;
    } finally {
      setMRLoading(false);
    }
  }, [boeVersionId, setManagementReserve, setMRLoading, setMRError]);

  // Load MR utilization history
  const loadMRUtilizationHistory = useCallback(async () => {
    if (!boeVersionId) return;

    setMRUtilizationLoading(true);
    setMRUtilizationError(null);
    
    try {
      const history = await managementReserveApi.getManagementReserveHistory(boeVersionId);
      setMRUtilizationHistory(history);
    } catch (error: any) {
      setMRUtilizationError(error instanceof Error ? error.message : 'Failed to load MR utilization history');
    } finally {
      setMRUtilizationLoading(false);
    }
  }, [boeVersionId, setMRUtilizationHistory, setMRUtilizationLoading, setMRUtilizationError]);

  // Load MR utilization data
  const loadMRUtilization = useCallback(async () => {
    if (!boeVersionId) return;

    setMRUtilizationLoading(true);
    setMRUtilizationError(null);
    try {
      const utilization = await managementReserveApi.getManagementReserveUtilization(boeVersionId);
      return utilization;
    } catch (error) {
      setMRUtilizationError(error instanceof Error ? error.message : 'Failed to load MR utilization data');
      throw error;
    } finally {
      setMRUtilizationLoading(false);
    }
  }, [boeVersionId, setMRUtilizationLoading, setMRUtilizationError]);

  // R&O Integration placeholders (for future use)
  const getRiskMatrix = useCallback(async () => {
    if (!boeVersionId) return null;

    try {
      const riskMatrix = await managementReserveApi.getRiskMatrix(boeVersionId);
      return riskMatrix;
    } catch (error: any) {
      // Handle 404 errors when R&O system is not yet implemented
      if (error?.response?.status === 404) {
        return null;
      }
      console.log('R&O system not yet implemented - using placeholder');
      return null;
    }
  }, [boeVersionId]);

  const calculateRODrivenMR = useCallback(async (riskMatrixData: any) => {
    if (!boeVersionId) return;

    setMRLoading(true);
    setMRError(null);
    try {
      const updatedMR = await managementReserveApi.calculateRODrivenMR(boeVersionId, riskMatrixData);
      setManagementReserve(updatedMR);
      return updatedMR;
    } catch (error) {
      setMRError(error instanceof Error ? error.message : 'Failed to calculate R&O-driven MR');
      throw error;
    } finally {
      setMRLoading(false);
    }
  }, [boeVersionId, setManagementReserve, setMRLoading, setMRError]);

  return {
    // State
    managementReserve,
    mrLoading,
    mrError,
    mrUtilizationHistory,
    mrUtilizationLoading,
    mrUtilizationError,

    // Actions
    loadManagementReserve,
    updateManagementReserve,
    calculateManagementReserve,
    utilizeManagementReserve,
    loadMRUtilizationHistory,
    loadMRUtilization,

    // R&O Integration placeholders
    getRiskMatrix,
    calculateRODrivenMR,
  };
}; 