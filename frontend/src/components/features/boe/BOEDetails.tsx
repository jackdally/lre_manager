import React, { useState, useEffect, useMemo } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { boeVersionsApi, boeElementsApi } from '../../../services/boeApi';
import BOECalculationService, { BOECalculationResult } from '../../../services/boeCalculationService';
import BOEForm from './BOEForm';
import Button from '../../common/Button';
import { formatCurrency, safeNumber } from '../../../utils/currencyUtils';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface BOEDetailsProps {
  programId: string;
}

const BOEDetails: React.FC<BOEDetailsProps> = ({ programId }) => {
  const { 
    currentBOE, 
    elements, 
    setElements, 
    setElementsLoading, 
    setElementsError,
    setCurrentBOE 
  } = useBOEStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validate before saving
      if (!validationResult.isValid) {
        alert('Please fix validation errors before saving');
        return;
      }
      
      // Save the current elements to the backend
      if (currentBOE) {
        await boeElementsApi.bulkUpdateElements(currentBOE.id, elements);
      }
      
      // Refresh BOE data after save
      await loadBOEData();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving BOE:', error);
      alert('Failed to save BOE changes');
    } finally {
      setLoading(false);
    }
  };

  const handleElementsChange = (newElements: any[]) => {
    setElements(newElements);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
    if (variance < 0) return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    return <ClockIcon className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
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

      {/* Cost Category Breakdown */}
      {calculationResult.costCategoryBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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

      {/* BOE Form */}
      <BOEForm
        programId={programId}
        boeVersionId={currentBOE.id}
        elements={elements}
        onElementsChange={handleElementsChange}
        onSave={handleSave}
        isReadOnly={!isEditing}
      />
    </div>
  );
};

export default BOEDetails; 