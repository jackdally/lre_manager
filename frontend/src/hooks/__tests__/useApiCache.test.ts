import { renderHook, act } from '@testing-library/react';
import { useApiCache } from '../useApiCache';

describe('useApiCache', () => {
  let mockDateNow: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
    mockDateNow.mockRestore();
  });

  it('should initialize with default options', () => {
    const { result } = renderHook(() => useApiCache<string>());

    expect(typeof result.current.get).toBe('function');
    expect(typeof result.current.set).toBe('function');
    expect(typeof result.current.invalidate).toBe('function');
    expect(typeof result.current.invalidatePattern).toBe('function');
    expect(typeof result.current.getStats).toBe('function');
  });

  it('should store and retrieve data correctly', () => {
    const { result } = renderHook(() => useApiCache<string>());
    const testData = 'test data';

    act(() => {
      result.current.set('test-key', testData);
    });

    const retrieved = result.current.get('test-key');
    expect(retrieved).toBe(testData);
  });

  it('should return null for non-existent keys', () => {
    const { result } = renderHook(() => useApiCache<string>());

    const retrieved = result.current.get('non-existent-key');
    expect(retrieved).toBe(null);
  });

  it('should expire entries after TTL', () => {
    const { result } = renderHook(() => useApiCache<string>({ ttl: 1000 }));
    const testData = 'test data';

    act(() => {
      result.current.set('test-key', testData);
    });

    // Check that data is available immediately
    expect(result.current.get('test-key')).toBe(testData);

    // Fast forward time past TTL
    act(() => {
      jest.advanceTimersByTime(1001);
      mockDateNow.mockReturnValue(1001);
    });

    // Data should be expired
    expect(result.current.get('test-key')).toBe(null);
  });

  it('should respect custom TTL', () => {
    const { result } = renderHook(() => useApiCache<string>({ ttl: 5000 }));
    const testData = 'test data';

    act(() => {
      result.current.set('test-key', testData);
    });

    // Fast forward time but not past TTL
    act(() => {
      jest.advanceTimersByTime(3000);
      mockDateNow.mockReturnValue(3000);
    });

    // Data should still be available
    expect(result.current.get('test-key')).toBe(testData);

    // Fast forward past TTL
    act(() => {
      jest.advanceTimersByTime(2001);
      mockDateNow.mockReturnValue(5001);
    });

    // Data should be expired
    expect(result.current.get('test-key')).toBe(null);
  });

  it('should limit cache size', () => {
    const { result } = renderHook(() => useApiCache<string>({ maxSize: 2 }));

    act(() => {
      result.current.set('key1', 'data1');
      result.current.set('key2', 'data2');
      result.current.set('key3', 'data3');
    });

    // Oldest entry should be removed
    expect(result.current.get('key1')).toBe(null);
    expect(result.current.get('key2')).toBe('data2');
    expect(result.current.get('key3')).toBe('data3');
  });

  it('should invalidate specific keys', () => {
    const { result } = renderHook(() => useApiCache<string>());

    act(() => {
      result.current.set('key1', 'data1');
      result.current.set('key2', 'data2');
    });

    act(() => {
      result.current.invalidate('key1');
    });

    expect(result.current.get('key1')).toBe(null);
    expect(result.current.get('key2')).toBe('data2');
  });

  it('should invalidate all keys when no key provided', () => {
    const { result } = renderHook(() => useApiCache<string>());

    act(() => {
      result.current.set('key1', 'data1');
      result.current.set('key2', 'data2');
    });

    act(() => {
      result.current.invalidate();
    });

    expect(result.current.get('key1')).toBe(null);
    expect(result.current.get('key2')).toBe(null);
  });

  it('should invalidate keys matching pattern', () => {
    const { result } = renderHook(() => useApiCache<string>());

    act(() => {
      result.current.set('user-1', 'data1');
      result.current.set('user-2', 'data2');
      result.current.set('post-1', 'data3');
    });

    act(() => {
      result.current.invalidatePattern(/^user-/);
    });

    expect(result.current.get('user-1')).toBe(null);
    expect(result.current.get('user-2')).toBe(null);
    expect(result.current.get('post-1')).toBe('data3');
  });

  it('should provide accurate stats', () => {
    const { result } = renderHook(() => useApiCache<string>({ ttl: 1000 }));

    // Set key1 at t=0
    mockDateNow.mockReturnValue(0);
    act(() => {
      result.current.set('key1', 'data1');
    });

    // Advance time to t=500 and set key2
    act(() => {
      jest.advanceTimersByTime(500);
      mockDateNow.mockReturnValue(500);
      result.current.set('key2', 'data2');
    });

    // Initial stats: both valid
    let stats = result.current.getStats();
    expect(stats.total).toBe(2);
    expect(stats.valid).toBe(2);
    expect(stats.expired).toBe(0);

    // Advance to t=1001 (key1 expired, key2 still valid)
    act(() => {
      jest.advanceTimersByTime(501);
      mockDateNow.mockReturnValue(1001);
    });

    stats = result.current.getStats();
    expect(stats.total).toBe(2);
    expect(stats.valid).toBe(1);
    expect(stats.expired).toBe(1);

    // Trigger cleanup by setting a new entry
    act(() => {
      result.current.set('key3', 'data3');
    });

    stats = result.current.getStats();
    expect(stats.total).toBe(2); // key2 and key3
    expect(stats.valid).toBe(2);
    expect(stats.expired).toBe(0);

    expect(result.current.get('key1')).toBe(null);
    expect(result.current.get('key2')).toBe('data2');
    expect(result.current.get('key3')).toBe('data3');
  });

  it('should clean up expired entries on set', () => {
    const { result } = renderHook(() => useApiCache<string>({ ttl: 1000 }));

    act(() => {
      result.current.set('key1', 'data1');
    });

    // Expire the entry
    act(() => {
      jest.advanceTimersByTime(1001);
      mockDateNow.mockReturnValue(1001);
    });

    // Set a new entry to trigger cleanup
    act(() => {
      result.current.set('key2', 'data2');
    });

    const stats = result.current.getStats();
    expect(stats.total).toBe(1);
    expect(stats.valid).toBe(1);
    expect(stats.expired).toBe(0);
  });

  it('should handle complex data types', () => {
    interface ComplexData {
      id: string;
      items: string[];
      metadata: { [key: string]: any };
    }

    const { result } = renderHook(() => useApiCache<ComplexData>());
    const testData: ComplexData = {
      id: 'test-id',
      items: ['item1', 'item2'],
      metadata: { key1: 'value1', key2: 123 }
    };

    act(() => {
      result.current.set('complex-key', testData);
    });

    const retrieved = result.current.get('complex-key');
    expect(retrieved).toEqual(testData);
    expect(retrieved?.items).toEqual(['item1', 'item2']);
    expect(retrieved?.metadata.key1).toBe('value1');
  });

  it('should handle concurrent operations', () => {
    const { result } = renderHook(() => useApiCache<string>());

    act(() => {
      // Multiple operations in the same act
      result.current.set('key1', 'data1');
      result.current.set('key2', 'data2');
      result.current.invalidate('key1');
      result.current.set('key3', 'data3');
    });

    expect(result.current.get('key1')).toBe(null);
    expect(result.current.get('key2')).toBe('data2');
    expect(result.current.get('key3')).toBe('data3');
  });
}); 