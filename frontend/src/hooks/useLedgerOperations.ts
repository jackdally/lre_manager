import { useCallback } from 'react';
import axios from 'axios';
import { LedgerEntry } from '../components/features/ledger/LedgerTable';

interface UseLedgerOperationsOptions {
  programId: string;
  onSuccess?: (operation: string) => void;
  onError?: (operation: string, error: Error) => void;
  invalidateCache?: () => void;
  fetchEntries?: () => void;
  refreshPotentialMatchIds?: () => Promise<void>;
  refreshRejectedMatchIds?: () => Promise<void>;
  onChange?: () => void;
}

interface BulkEditPayload {
  [field: string]: any;
}

export const useLedgerOperations = (options: UseLedgerOperationsOptions) => {
  const {
    programId,
    onSuccess,
    onError,
    invalidateCache,
    fetchEntries,
    refreshPotentialMatchIds,
    refreshRejectedMatchIds,
    onChange
  } = options;

  // Helper function to perform a data operation with proper cleanup
  const performOperation = useCallback(async (
    operation: () => Promise<any>,
    operationName: string,
    skipRefresh: boolean = false
  ) => {
    try {
      console.log(`🔄 Starting ${operationName} operation, skipRefresh:`, skipRefresh);
      const result = await operation();
      
      // Invalidate cache to ensure fresh data
      console.log(`🔄 Invalidating cache for ${operationName}`);
      invalidateCache?.();
      
      // Skip refresh for operations that need to preserve UI state (like cell editing)
      if (!skipRefresh) {
        console.log(`🔄 Performing full refresh for ${operationName} - this might cause scroll issues`);
        // Refresh main data
        fetchEntries?.();
        
        // Refresh related data
        await Promise.all([
          refreshPotentialMatchIds?.(),
          refreshRejectedMatchIds?.()
        ].filter(Boolean));
      } else {
        console.log(`🔄 Skipping refresh for ${operationName} - preserving UI state`);
      }
      
      // Notify parent components
      console.log(`🔄 Notifying parent components for ${operationName}`);
      onChange?.();
      onSuccess?.(operationName);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${operationName} failed:`, errorMessage);
      onError?.(operationName, new Error(errorMessage));
      throw error;
    }
  }, [programId, invalidateCache, fetchEntries, refreshPotentialMatchIds, refreshRejectedMatchIds, onChange, onSuccess, onError]);

  // Single entry operations
  const updateEntry = useCallback(async (entryId: string, updates: Partial<LedgerEntry>, skipRefresh: boolean = false) => {
    return performOperation(
      async () => {
        const response = await axios.put(`/api/programs/${programId}/ledger/${entryId}`, updates);
        return response.data;
      },
      'updateEntry',
      skipRefresh
    );
  }, [programId, performOperation]);

  const deleteEntry = useCallback(async (entryId: string) => {
    return performOperation(
      async () => {
        const response = await axios.delete(`/api/programs/${programId}/ledger/${entryId}`);
        return response.data;
      },
      'deleteEntry'
    );
  }, [programId, performOperation]);

  const createEntry = useCallback(async (entry: Omit<LedgerEntry, 'id'>) => {
    return performOperation(
      async () => {
        const response = await axios.post(`/api/programs/${programId}/ledger`, entry);
        return response.data;
      },
      'createEntry'
    );
  }, [programId, performOperation]);

  // Bulk operations
  const bulkUpdateEntries = useCallback(async (entryIds: string[], updates: BulkEditPayload) => {
    return performOperation(
      async () => {
        const promises = entryIds.map(id => 
          axios.put(`/api/programs/${programId}/ledger/${id}`, updates)
        );
        const responses = await Promise.all(promises);
        return responses.map(r => r.data);
      },
      'bulkUpdateEntries'
    );
  }, [programId, performOperation]);

  const bulkDeleteEntries = useCallback(async (entryIds: string[]) => {
    return performOperation(
      async () => {
        const promises = entryIds.map(id => 
          axios.delete(`/api/programs/${programId}/ledger/${id}`)
        );
        const responses = await Promise.all(promises);
        return responses.map(r => r.data);
      },
      'bulkDeleteEntries'
    );
  }, [programId, performOperation]);

  // Match operations
  const confirmMatch = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    return performOperation(
      async () => {
        const response = await fetch(`/api/import/transaction/${transactionId}/confirm-match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ledgerEntryId }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to confirm match: ${response.status}`);
        }
        
        return response.json();
      },
      'confirmMatch'
    );
  }, [performOperation]);

  const rejectMatch = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    return performOperation(
      async () => {
        const response = await fetch(`/api/import/transaction/${transactionId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ledgerEntryId }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to reject match: ${response.status}`);
        }
        
        return response.json();
      },
      'rejectMatch'
    );
  }, [performOperation]);

  const undoReject = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    return performOperation(
      async () => {
        const response = await fetch(`/api/import/transaction/${transactionId}/undo-reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ledgerEntryId }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to undo rejection: ${response.status}`);
        }
        
        return response.json();
      },
      'undoReject'
    );
  }, [performOperation]);

  const removeMatch = useCallback(async (transactionId: string) => {
    return performOperation(
      async () => {
        const response = await fetch(`/api/import/transaction/${transactionId}/remove-match`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to remove match: ${response.status}`);
        }
        
        return response.json();
      },
      'removeMatch'
    );
  }, [performOperation]);

  // Popover operations
  const updateInvoiceLink = useCallback(async (entryId: string, invoiceLinkText: string, invoiceLinkUrl: string) => {
    return performOperation(
      async () => {
        const response = await axios.put(`/api/programs/${programId}/ledger/${entryId}`, {
          invoice_link_text: invoiceLinkText,
          invoice_link_url: invoiceLinkUrl,
        });
        return response.data;
      },
      'updateInvoiceLink'
    );
  }, [programId, performOperation]);

  return {
    // Single entry operations
    updateEntry,
    deleteEntry,
    createEntry,
    
    // Bulk operations
    bulkUpdateEntries,
    bulkDeleteEntries,
    
    // Match operations
    confirmMatch,
    rejectMatch,
    undoReject,
    removeMatch,
    
    // Other operations
    updateInvoiceLink,
  };
}; 