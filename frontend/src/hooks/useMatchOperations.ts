import { useCallback, useState } from 'react';

interface UseMatchOperationsOptions {
  onSuccess?: (operation: string) => void;
  onError?: (operation: string, error: Error) => void;
}

interface MatchOperation {
  type: 'confirm' | 'reject' | 'undo';
  transactionId: string;
  ledgerEntryId: string;
}

export const useMatchOperations = (options: UseMatchOperationsOptions = {}) => {
  const { onSuccess, onError } = options;
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<MatchOperation | null>(null);

  const confirmMatch = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    setIsProcessing(true);
    setCurrentOperation({ type: 'confirm', transactionId, ledgerEntryId });

    try {
      const response = await fetch(`/api/import/transaction/${transactionId}/confirm-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerEntryId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to confirm match: ${response.status} ${response.statusText}`);
      }

      onSuccess?.('confirm');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Confirm match failed:', errorMessage);
      onError?.('confirm', new Error(errorMessage));
      return false;
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
    }
  }, [onSuccess, onError]);

  const rejectMatch = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    setIsProcessing(true);
    setCurrentOperation({ type: 'reject', transactionId, ledgerEntryId });

    try {
      const response = await fetch(`/api/import/transaction/${transactionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerEntryId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject match: ${response.status} ${response.statusText}`);
      }

      onSuccess?.('reject');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Reject match failed:', errorMessage);
      onError?.('reject', new Error(errorMessage));
      return false;
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
    }
  }, [onSuccess, onError]);

  const undoReject = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    setIsProcessing(true);
    setCurrentOperation({ type: 'undo', transactionId, ledgerEntryId });

    try {
      const response = await fetch(`/api/import/transaction/${transactionId}/undo-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerEntryId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to undo rejection: ${response.status} ${response.statusText}`);
      }

      onSuccess?.('undo');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Undo rejection failed:', errorMessage);
      onError?.('undo', new Error(errorMessage));
      return false;
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
    }
  }, [onSuccess, onError]);

  return {
    confirmMatch,
    rejectMatch,
    undoReject,
    isProcessing,
    currentOperation,
  };
}; 