export const useApiCache = jest.fn(() => ({
  get: jest.fn(),
  set: jest.fn(),
  invalidate: jest.fn(),
  invalidatePattern: jest.fn(),
  getStats: jest.fn(),
})); 