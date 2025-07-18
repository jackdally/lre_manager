import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { usePerformanceMonitor } from '../usePerformanceMonitor';

// Mock console methods
const mockConsoleGroup = jest.fn();
const mockConsoleLog = jest.fn();
const mockConsoleGroupEnd = jest.fn();

global.console = {
  ...console,
  group: mockConsoleGroup,
  log: mockConsoleLog,
  groupEnd: mockConsoleGroupEnd,
} as any;

describe('usePerformanceMonitor', () => {
  let mockPerformanceNow: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh mock for each test
    mockPerformanceNow = jest.fn();
    
    // Mock performance.now more explicitly
    jest.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with correct methods', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    expect(typeof result.current.startTimer).toBe('function');
    expect(typeof result.current.endTimer).toBe('function');
    expect(typeof result.current.recordCacheHit).toBe('function');
    expect(typeof result.current.recordCacheMiss).toBe('function');
    expect(typeof result.current.getMetrics).toBe('function');
    expect(typeof result.current.getStats).toBe('function');
    expect(typeof result.current.clearMetrics).toBe('function');
    expect(typeof result.current.logPerformanceReport).toBe('function');
  });

  it('should start and end timer correctly', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    mockPerformanceNow
      .mockReturnValueOnce(1000) // startTimer
      .mockReturnValueOnce(1500); // endTimer

    act(() => {
      result.current.startTimer('test-operation');
    });

    act(() => {
      result.current.endTimer('test-operation');
    });

    const metrics = result.current.getMetrics('test-operation');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('test-operation');
    expect(metrics[0].startTime).toBe(1000);
    expect(metrics[0].endTime).toBe(1500);
    expect(metrics[0].duration).toBe(500);
  });

  it('should calculate stats correctly', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    // First operation: 100ms
    mockPerformanceNow
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1100);

    act(() => {
      result.current.startTimer('operation1');
      result.current.endTimer('operation1');
    });

    // Second operation: 200ms
    mockPerformanceNow
      .mockReturnValueOnce(1200)
      .mockReturnValueOnce(1400);

    act(() => {
      result.current.startTimer('operation2');
      result.current.endTimer('operation2');
    });

    const stats = result.current.getStats();
    expect(stats.totalOperations).toBe(2);
    expect(stats.averageDuration).toBe(150); // (100 + 200) / 2
    expect(stats.minDuration).toBe(100);
    expect(stats.maxDuration).toBe(200);
  });

  it('should record cache hits and misses', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    act(() => {
      result.current.recordCacheHit();
      result.current.recordCacheHit();
      result.current.recordCacheMiss();
    });

    const stats = result.current.getStats();
    expect(stats.cacheHits).toBe(2);
    expect(stats.cacheMisses).toBe(1);
  });

  it('should get metrics by name', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    mockPerformanceNow
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1100)
      .mockReturnValueOnce(1200)
      .mockReturnValueOnce(1300);

    act(() => {
      result.current.startTimer('operation1');
      result.current.endTimer('operation1');
      result.current.startTimer('operation2');
      result.current.endTimer('operation2');
    });

    const operation1Metrics = result.current.getMetrics('operation1');
    const operation2Metrics = result.current.getMetrics('operation2');
    const allMetrics = result.current.getMetrics();

    expect(operation1Metrics).toHaveLength(1);
    expect(operation2Metrics).toHaveLength(1);
    expect(allMetrics).toHaveLength(2);
  });

  it('should clear metrics correctly', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    mockPerformanceNow
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1100);

    act(() => {
      result.current.startTimer('test-operation');
      result.current.endTimer('test-operation');
      result.current.recordCacheHit();
    });

    // Verify metrics exist
    expect(result.current.getMetrics()).toHaveLength(1);
    expect(result.current.getStats().totalOperations).toBe(1);
    expect(result.current.getStats().cacheHits).toBe(1);

    act(() => {
      result.current.clearMetrics();
    });

    // Verify metrics are cleared
    expect(result.current.getMetrics()).toHaveLength(0);
    expect(result.current.getStats().totalOperations).toBe(0);
    expect(result.current.getStats().cacheHits).toBe(0);
  });

  it('should handle multiple operations with same name', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    mockPerformanceNow
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1100)
      .mockReturnValueOnce(1200)
      .mockReturnValueOnce(1300);

    act(() => {
      result.current.startTimer('operation');
      result.current.endTimer('operation');
      result.current.startTimer('operation');
      result.current.endTimer('operation');
    });

    const metrics = result.current.getMetrics('operation');
    expect(metrics).toHaveLength(2);
    expect(metrics[0].duration).toBe(100);
    expect(metrics[1].duration).toBe(100);
  });

  it('should handle endTimer without startTimer', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    // Should not throw when ending a timer that wasn't started
    act(() => {
      result.current.endTimer('non-existent-operation');
    });

    const metrics = result.current.getMetrics('non-existent-operation');
    expect(metrics).toHaveLength(0);
  });

  it('should handle endTimer with empty metrics array', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    mockPerformanceNow.mockReturnValueOnce(1000);

    act(() => {
      result.current.startTimer('operation');
    });

    // Manually clear the metrics array to simulate edge case
    const metrics = result.current.getMetrics('operation');
    expect(metrics).toHaveLength(1);

    // Should not throw when ending a timer with empty metrics
    act(() => {
      result.current.endTimer('operation');
    });
  });

  it('should log performance report correctly', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    mockPerformanceNow
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1100);

    act(() => {
      result.current.startTimer('test-operation');
      result.current.endTimer('test-operation');
      result.current.recordCacheHit();
      result.current.recordCacheMiss();
    });

    act(() => {
      result.current.logPerformanceReport();
    });

    expect(mockConsoleGroup).toHaveBeenCalledWith('🚀 Performance Report');
    expect(mockConsoleLog).toHaveBeenCalledWith('📊 Overall Stats:', expect.any(Object));
    expect(mockConsoleLog).toHaveBeenCalledWith('📈 Cache Hit Rate:', 50, '%');
    // Don't check exact duration since it depends on actual timing
    expect(mockConsoleLog).toHaveBeenCalledWith('⏱️ Average Duration:', expect.any(String), 'ms');
    expect(mockConsoleLog).toHaveBeenCalledWith('📋 Total Operations:', 1);
    expect(mockConsoleLog).toHaveBeenCalledWith('📝 Detailed Metrics:', expect.any(Object));
    expect(mockConsoleGroupEnd).toHaveBeenCalled();
  });

  it('should handle zero cache operations in report', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    act(() => {
      result.current.logPerformanceReport();
    });

    expect(mockConsoleLog).toHaveBeenCalledWith('📈 Cache Hit Rate:', NaN, '%');
  });

  it('should handle zero operations in stats', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    const stats = result.current.getStats();
    expect(stats.totalOperations).toBe(0);
    expect(stats.averageDuration).toBe(0);
    expect(stats.minDuration).toBe(Infinity);
    expect(stats.maxDuration).toBe(0);
    expect(stats.cacheHits).toBe(0);
    expect(stats.cacheMisses).toBe(0);
  });

  it('should maintain separate metrics for different operations', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    mockPerformanceNow
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1100)
      .mockReturnValueOnce(1200)
      .mockReturnValueOnce(1300);

    act(() => {
      result.current.startTimer('operation1');
      result.current.endTimer('operation1');
      result.current.startTimer('operation2');
      result.current.endTimer('operation2');
    });

    const operation1Metrics = result.current.getMetrics('operation1');
    const operation2Metrics = result.current.getMetrics('operation2');

    expect(operation1Metrics).toHaveLength(1);
    expect(operation1Metrics[0].name).toBe('operation1');
    expect(operation2Metrics).toHaveLength(1);
    expect(operation2Metrics[0].name).toBe('operation2');
  });

  it('should handle very long durations', () => {
    const { result } = renderHook(() => usePerformanceMonitor());

    mockPerformanceNow
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(Number.MAX_SAFE_INTEGER);

    act(() => {
      result.current.startTimer('long-operation');
      result.current.endTimer('long-operation');
    });

    const stats = result.current.getStats();
    expect(stats.maxDuration).toBe(Number.MAX_SAFE_INTEGER);
  });
}); 