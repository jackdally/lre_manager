import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useMatchOperations } from '../useMatchOperations';

// Mock fetch globally
global.fetch = jest.fn();

describe('useMatchOperations', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct methods', () => {
    const { result } = renderHook(() => useMatchOperations({
      onSuccess: mockOnSuccess,
      onError: mockOnError
    }));

    expect(typeof result.current.confirmMatch).toBe('function');
    expect(typeof result.current.rejectMatch).toBe('function');
    expect(typeof result.current.undoReject).toBe('function');
    expect(typeof result.current.isProcessing).toBe('boolean');
    expect(typeof result.current.currentOperation).toBe('object');
  });

  it('should confirm match successfully', async () => {
    const mockResponse = { success: true };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useMatchOperations({
      onSuccess: mockOnSuccess,
      onError: mockOnError
    }));

    const transactionId = 'test-transaction-id';
    const ledgerEntryId = 'test-ledger-id';

    await act(async () => {
      const success = await result.current.confirmMatch(transactionId, ledgerEntryId);
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(
      `/api/import/transaction/${transactionId}/confirm-match`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ ledgerEntryId })
      })
    );

    expect(mockOnSuccess).toHaveBeenCalledWith('confirm');
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should reject match successfully', async () => {
    const mockResponse = { success: true };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useMatchOperations({
      onSuccess: mockOnSuccess,
      onError: mockOnError
    }));

    const transactionId = 'test-transaction-id';
    const ledgerEntryId = 'test-ledger-id';

    await act(async () => {
      const success = await result.current.rejectMatch(transactionId, ledgerEntryId);
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(
      `/api/import/transaction/${transactionId}/reject`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ ledgerEntryId })
      })
    );

    expect(mockOnSuccess).toHaveBeenCalledWith('reject');
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should undo reject successfully', async () => {
    const mockResponse = { success: true };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useMatchOperations({
      onSuccess: mockOnSuccess,
      onError: mockOnError
    }));

    const transactionId = 'test-transaction-id';
    const ledgerEntryId = 'test-ledger-id';

    await act(async () => {
      const success = await result.current.undoReject(transactionId, ledgerEntryId);
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(
      `/api/import/transaction/${transactionId}/undo-reject`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ ledgerEntryId })
      })
    );

    expect(mockOnSuccess).toHaveBeenCalledWith('undo');
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should handle API errors during confirm', async () => {
    const mockError = new Error('Network error');
    (fetch as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useMatchOperations({
      onSuccess: mockOnSuccess,
      onError: mockOnError
    }));

    const transactionId = 'test-transaction-id';
    const ledgerEntryId = 'test-ledger-id';

    await act(async () => {
      const success = await result.current.confirmMatch(transactionId, ledgerEntryId);
      expect(success).toBe(false);
    });

    expect(mockOnError).toHaveBeenCalledWith('confirm', expect.any(Error));
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should handle API errors during reject', async () => {
    const mockError = new Error('Network error');
    (fetch as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useMatchOperations({
      onSuccess: mockOnSuccess,
      onError: mockOnError
    }));

    const transactionId = 'test-transaction-id';
    const ledgerEntryId = 'test-ledger-id';

    await act(async () => {
      const success = await result.current.rejectMatch(transactionId, ledgerEntryId);
      expect(success).toBe(false);
    });

    expect(mockOnError).toHaveBeenCalledWith('reject', expect.any(Error));
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should handle non-OK responses', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const { result } = renderHook(() => useMatchOperations({
      onSuccess: mockOnSuccess,
      onError: mockOnError
    }));

    const transactionId = 'test-transaction-id';
    const ledgerEntryId = 'test-ledger-id';

    await act(async () => {
      const success = await result.current.confirmMatch(transactionId, ledgerEntryId);
      expect(success).toBe(false);
    });

    expect(mockOnError).toHaveBeenCalledWith('confirm', expect.any(Error));
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should set processing state during operations', async () => {
    let resolvePromise: (value: any) => void;
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (fetch as jest.Mock).mockReturnValueOnce(mockPromise);

    const { result } = renderHook(() => useMatchOperations({
      onSuccess: mockOnSuccess,
      onError: mockOnError
    }));

    const transactionId = 'test-transaction-id';
    const ledgerEntryId = 'test-ledger-id';

    // Start the operation
    let operationPromise: Promise<boolean>;
    await act(async () => {
      operationPromise = result.current.confirmMatch(transactionId, ledgerEntryId);
    });

    // Wait for state to update
    await act(async () => {
      // Give React time to update state
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Check processing state
    expect(result.current.isProcessing).toBe(true);
    expect(result.current.currentOperation).toEqual({
      type: 'confirm',
      transactionId,
      ledgerEntryId
    });

    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true })
      });
      await operationPromise!;
    });

    // Check processing state after completion
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.currentOperation).toBe(null);
  });

  it('should handle concurrent operations efficiently', async () => {
    const mockResponse = { success: true };
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

    const { result } = renderHook(() => useMatchOperations({
      onSuccess: mockOnSuccess,
      onError: mockOnError
    }));

    const transactionId1 = 'test-transaction-id-1';
    const transactionId2 = 'test-transaction-id-2';
    const ledgerEntryId = 'test-ledger-id';

    // Start two operations sequentially (since the hook only allows one at a time)
    await act(async () => {
      const result1 = await result.current.confirmMatch(transactionId1, ledgerEntryId);
      const result2 = await result.current.rejectMatch(transactionId2, ledgerEntryId);
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(mockOnSuccess).toHaveBeenCalledTimes(2);
  });

  it('should work without callbacks', async () => {
    const mockResponse = { success: true };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useMatchOperations({}));

    const transactionId = 'test-transaction-id';
    const ledgerEntryId = 'test-ledger-id';

    await act(async () => {
      const success = await result.current.confirmMatch(transactionId, ledgerEntryId);
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    // Should not throw when callbacks are not provided
  });
}); 