export const useDebouncedApi = jest.fn(() => ({
  debouncedCall: jest.fn(),
  cancel: jest.fn(),
})); 