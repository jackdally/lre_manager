import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useDebouncedApi } from '../useDebouncedApi';

describe('useDebouncedApi', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should initialize with default options', () => {
    const { result } = renderHook(() => useDebouncedApi());

    expect(typeof result.current.debouncedCall).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
  });

  it('should debounce API calls with default delay', async () => {
    const mockApiCall = jest.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useDebouncedApi());

    let promise: Promise<any>;
    await act(async () => {
      promise = result.current.debouncedCall(mockApiCall);
    });

    // API call should not be made immediately
    expect(mockApiCall).not.toHaveBeenCalled();

    // Fast forward time to trigger the debounced call
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {
      const response = await promise!;
      expect(response).toBe('success');
    });

    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });

  it('should debounce API calls with custom delay', async () => {
    const mockApiCall = jest.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useDebouncedApi({ delay: 500 }));

    let promise: Promise<any>;
    await act(async () => {
      promise = result.current.debouncedCall(mockApiCall);
    });

    // API call should not be made immediately
    expect(mockApiCall).not.toHaveBeenCalled();

    // Fast forward time but not enough to trigger
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(mockApiCall).not.toHaveBeenCalled();

    // Fast forward to trigger the debounced call
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    await act(async () => {
      const response = await promise!;
      expect(response).toBe('success');
    });

    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });

  it('should make immediate API calls when immediate is true', async () => {
    const mockApiCall = jest.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useDebouncedApi());

    let promise: Promise<any>;
    await act(async () => {
      promise = result.current.debouncedCall(mockApiCall, true);
    });

    // API call should be made immediately
    expect(mockApiCall).toHaveBeenCalledTimes(1);

    await act(async () => {
      const response = await promise!;
      expect(response).toBe('success');
    });
  });

  it('should cancel previous calls when new call is made', async () => {
    const mockApiCall1 = jest.fn().mockResolvedValue('first');
    const mockApiCall2 = jest.fn().mockResolvedValue('second');
    const { result } = renderHook(() => useDebouncedApi());

    // Make first call
    let promise1: Promise<any>;
    await act(async () => {
      promise1 = result.current.debouncedCall(mockApiCall1);
    });

    // Make second call immediately (this should cancel the first)
    let promise2: Promise<any>;
    await act(async () => {
      promise2 = result.current.debouncedCall(mockApiCall2);
    });

    // Fast forward to trigger the second call
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // Wait for both promises to resolve
    await act(async () => {
      const response1 = await promise1!;
      const response2 = await promise2!;
      expect(response1).toBe(null); // First call should be cancelled
      expect(response2).toBe('second');
    });

    expect(mockApiCall1).not.toHaveBeenCalled();
    expect(mockApiCall2).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors gracefully', async () => {
    const mockError = new Error('API Error');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);
    const mockOnError = jest.fn();
    const { result } = renderHook(() => useDebouncedApi({ onError: mockOnError }));

    let promise: Promise<any>;
    await act(async () => {
      promise = result.current.debouncedCall(mockApiCall);
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {
      const response = await promise!;
      expect(response).toBe(null);
    });

    expect(mockOnError).toHaveBeenCalledWith(mockError);
  });

  it('should handle immediate API errors', async () => {
    const mockError = new Error('API Error');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);
    const mockOnError = jest.fn();
    const { result } = renderHook(() => useDebouncedApi({ onError: mockOnError }));

    let promise: Promise<any>;
    await act(async () => {
      promise = result.current.debouncedCall(mockApiCall, true);
    });

    await act(async () => {
      const response = await promise!;
      expect(response).toBe(null);
    });

    expect(mockOnError).toHaveBeenCalledWith(mockError);
  });

  it('should cancel pending calls when cancel is called', async () => {
    const mockApiCall = jest.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useDebouncedApi());

    let promise: Promise<any>;
    await act(async () => {
      promise = result.current.debouncedCall(mockApiCall);
    });

    // Cancel before the timeout
    await act(async () => {
      result.current.cancel();
    });

    // Fast forward time
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {
      const response = await promise!;
      expect(response).toBe(null);
    });

    expect(mockApiCall).not.toHaveBeenCalled();
  });

  it('should handle abort signal correctly', async () => {
    const mockApiCall = jest.fn().mockImplementation((signal) => {
      // Simulate the API call being made but then aborted
      if (signal?.aborted) {
        throw new Error('AbortError');
      }
      return Promise.resolve('success');
    });
    const { result } = renderHook(() => useDebouncedApi());

    let promise: Promise<any>;
    await act(async () => {
      promise = result.current.debouncedCall(mockApiCall);
    });

    // Fast forward to trigger the API call
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {
      const response = await promise!;
      expect(response).toBe('success');
    });

    expect(mockApiCall).toHaveBeenCalled();
  });

  it('should not call onError for AbortError', async () => {
    const mockApiCall = jest.fn().mockRejectedValue(new Error('AbortError'));
    const mockOnError = jest.fn();
    const { result } = renderHook(() => useDebouncedApi({ onError: mockOnError }));

    let promise: Promise<any>;
    await act(async () => {
      promise = result.current.debouncedCall(mockApiCall);
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {
      const response = await promise!;
      expect(response).toBe(null);
    });

    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should work without onError callback', async () => {
    const mockError = new Error('API Error');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);
    const { result } = renderHook(() => useDebouncedApi());

    let promise: Promise<any>;
    await act(async () => {
      promise = result.current.debouncedCall(mockApiCall);
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {
      const response = await promise!;
      expect(response).toBe(null);
    });

    // Should not throw when onError is not provided
  });
}); 