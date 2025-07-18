export const usePerformanceMonitor = jest.fn(() => ({
  startTimer: jest.fn(),
  endTimer: jest.fn(),
  recordCacheHit: jest.fn(),
  recordCacheMiss: jest.fn(),
  getMetrics: jest.fn(),
  getStats: jest.fn(),
  clearMetrics: jest.fn(),
  logPerformanceReport: jest.fn(),
})); 