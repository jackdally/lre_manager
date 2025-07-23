import React, { useEffect, useState } from 'react';

interface BOEContextData {
  allocation: {
    id: string;
    name: string;
    description: string;
    allocationType: string;
    totalAmount: number;
    monthlyAmount: number;
    startDate: string;
    endDate: string;
    numberOfMonths: number;
    isActive: boolean;
    isLocked: boolean;
  };
  boeElement: {
    id: string;
    name: string;
    description: string;
    code: string;
    vendor: any;
  };
  boeVersion: {
    id: string;
    name: string;
    versionNumber: number;
    status: string;
  };
  monthlyContext: {
    month: string;
    monthlyAllocated: number;
    remainingAmount: number;
    actualAmount: number;
  };
}

interface BOEContextPanelProps {
  ledgerEntryId: string;
  transactionAmount: number;
  isVisible: boolean;
}

const BOEContextPanel: React.FC<BOEContextPanelProps> = ({
  ledgerEntryId,
  transactionAmount,
  isVisible
}) => {
  const [boeContext, setBoeContext] = useState<BOEContextData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible || !ledgerEntryId) {
      setBoeContext(null);
      return;
    }

    const fetchBOEContext = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/import/ledger-entry/${ledgerEntryId}/boe-context`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // No BOE context found - this is normal for non-BOE entries
            setBoeContext(null);
            return;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setBoeContext(data);
      } catch (err) {
        console.error('Error fetching BOE context:', err);
        setError(err instanceof Error ? err.message : 'Failed to load BOE context');
      } finally {
        setLoading(false);
      }
    };

    fetchBOEContext();
  }, [ledgerEntryId, isVisible]);

  if (!isVisible) return null;
  
  if (loading) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
          <span className="text-amber-700 text-sm">Loading BOE context...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="text-red-700 text-sm">
          <strong>Error loading BOE context:</strong> {error}
        </div>
      </div>
    );
  }

  if (!boeContext) {
    return null; // No BOE context to display
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAmountValidationStatus = () => {
    if (!boeContext.monthlyContext.remainingAmount) {
      return { status: 'error', message: 'No remaining allocation for this month' };
    }
    
    if (transactionAmount > boeContext.monthlyContext.remainingAmount) {
      return { 
        status: 'warning', 
        message: `Transaction amount (${formatCurrency(transactionAmount)}) exceeds remaining allocation (${formatCurrency(boeContext.monthlyContext.remainingAmount)})` 
      };
    }
    
    return { 
      status: 'success', 
      message: `Transaction amount (${formatCurrency(transactionAmount)}) is within remaining allocation (${formatCurrency(boeContext.monthlyContext.remainingAmount)})` 
    };
  };

  const amountValidation = getAmountValidationStatus();

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-3">
        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
        <h4 className="text-amber-800 font-semibold text-sm">BOE Allocation Context</h4>
      </div>
      
      {/* BOE Element Info */}
      <div className="mb-3">
        <div className="text-xs text-amber-700 font-medium mb-1">BOE Element</div>
        <div className="text-sm text-amber-900 font-semibold">{boeContext.boeElement.name}</div>
        {boeContext.boeElement.description && (
          <div className="text-xs text-amber-700 mt-1">{boeContext.boeElement.description}</div>
        )}
        <div className="text-xs text-amber-600 mt-1">Code: {boeContext.boeElement.code}</div>
      </div>

      {/* Allocation Info */}
      <div className="mb-3">
        <div className="text-xs text-amber-700 font-medium mb-1">Allocation</div>
        <div className="text-sm text-amber-900 font-semibold">{boeContext.allocation.name}</div>
        <div className="text-xs text-amber-700 mt-1">
          {boeContext.allocation.allocationType} • {boeContext.allocation.numberOfMonths} months
        </div>
        <div className="text-xs text-amber-700">
          {formatDate(boeContext.allocation.startDate)} - {formatDate(boeContext.allocation.endDate)}
        </div>
      </div>

      {/* Monthly Context */}
      <div className="mb-3">
        <div className="text-xs text-amber-700 font-medium mb-1">Monthly Allocation ({boeContext.monthlyContext.month})</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-amber-600">Allocated:</span>
            <span className="text-amber-900 font-semibold ml-1">{formatCurrency(boeContext.monthlyContext.monthlyAllocated)}</span>
          </div>
          <div>
            <span className="text-amber-600">Spent:</span>
            <span className="text-amber-900 font-semibold ml-1">{formatCurrency(boeContext.monthlyContext.actualAmount)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-amber-600">Remaining:</span>
            <span className="text-amber-900 font-semibold ml-1">{formatCurrency(boeContext.monthlyContext.remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Amount Validation */}
      <div className={`border rounded p-2 ${
        amountValidation.status === 'error' ? 'bg-red-50 border-red-200' :
        amountValidation.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
        'bg-green-50 border-green-200'
      }`}>
        <div className={`text-xs font-medium ${
          amountValidation.status === 'error' ? 'text-red-700' :
          amountValidation.status === 'warning' ? 'text-yellow-700' :
          'text-green-700'
        }`}>
          {amountValidation.message}
        </div>
      </div>

      {/* BOE Version Info */}
      <div className="mt-3 pt-3 border-t border-amber-200">
        <div className="text-xs text-amber-600">
          BOE Version: {boeContext.boeVersion.name} (v{boeContext.boeVersion.versionNumber})
        </div>
        <div className="text-xs text-amber-600">
          Status: <span className="font-medium">{boeContext.boeVersion.status}</span>
        </div>
      </div>
    </div>
  );
};

export default BOEContextPanel; 