// Unified mock setup for LedgerTable tests

// Mock axios
jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock custom hooks with consistent structure
const mockUsePotentialMatchModal = {
  isOpen: false,
  currentTab: 'matched' as const,
  currentIndex: 0,
  ledgerEntryId: null,
  potentialMatches: [] as any[],
  rejectedMatches: [] as any[],
  isLoading: false,
  hasMatches: false,
  totalMatches: 0,
  currentMatches: [] as any[],
  openModal: jest.fn(),
  closeModal: jest.fn(),
  switchTab: jest.fn(),
  setIndex: jest.fn(),
  refreshData: jest.fn(),
};

const mockUseDebouncedApi = {
  debouncedCall: jest.fn(),
  cancel: jest.fn(),
};

const mockUseMatchOperations = {
  acceptMatch: jest.fn(),
  rejectMatch: jest.fn(),
  isLoading: false,
};

const mockUseApiCache = {
  get: jest.fn(),
  set: jest.fn(),
  invalidate: jest.fn(),
  invalidatePattern: jest.fn(),
  getStats: jest.fn(),
};

const mockUseVirtualScroll = {
  virtualItems: [] as any[],
  totalHeight: 0,
  startIndex: 0,
  endIndex: 0,
  scrollTop: 0,
  setScrollTop: jest.fn(),
  containerRef: { current: null },
  scrollToItem: jest.fn(),
  scrollToTop: jest.fn(),
  scrollToBottom: jest.fn(),
  handleScroll: jest.fn(),
};

const mockUsePerformanceMonitor = {
  startTimer: jest.fn(),
  endTimer: jest.fn(),
  recordCacheHit: jest.fn(),
  recordCacheMiss: jest.fn(),
  getMetrics: jest.fn(),
  getStats: jest.fn(),
  clearMetrics: jest.fn(),
  logPerformanceReport: jest.fn(),
};

// Setup all hook mocks
jest.mock('../../../../../hooks/usePotentialMatchModal', () => ({
  usePotentialMatchModal: jest.fn(() => mockUsePotentialMatchModal),
}));

jest.mock('../../../../../hooks/useDebouncedApi', () => ({
  useDebouncedApi: jest.fn(() => mockUseDebouncedApi),
}));

jest.mock('../../../../../hooks/useMatchOperations', () => ({
  useMatchOperations: jest.fn(() => mockUseMatchOperations),
}));

jest.mock('../../../../../hooks/useApiCache', () => ({
  useApiCache: jest.fn(() => mockUseApiCache),
}));

jest.mock('../../../../../hooks/useVirtualScroll', () => ({
  useVirtualScroll: jest.fn(() => mockUseVirtualScroll),
}));

jest.mock('../../../../../hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: jest.fn(() => mockUsePerformanceMonitor),
}));

// Export mock objects for test access
export {
  mockUsePotentialMatchModal,
  mockUseDebouncedApi,
  mockUseMatchOperations,
  mockUseApiCache,
  mockUseVirtualScroll,
  mockUsePerformanceMonitor,
};

// Helper function to reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  
  // Reset mock return values to defaults
  mockUsePotentialMatchModal.isOpen = false;
  mockUsePotentialMatchModal.currentTab = 'matched';
  mockUsePotentialMatchModal.currentIndex = 0;
  mockUsePotentialMatchModal.ledgerEntryId = null;
  mockUsePotentialMatchModal.potentialMatches = [];
  mockUsePotentialMatchModal.rejectedMatches = [];
  mockUsePotentialMatchModal.isLoading = false;
  mockUsePotentialMatchModal.hasMatches = false;
  mockUsePotentialMatchModal.totalMatches = 0;
  mockUsePotentialMatchModal.currentMatches = [];
  
  mockUseDebouncedApi.debouncedCall.mockClear();
  mockUseDebouncedApi.cancel.mockClear();
  
  mockUseMatchOperations.acceptMatch.mockClear();
  mockUseMatchOperations.rejectMatch.mockClear();
  mockUseMatchOperations.isLoading = false;
  
  mockUseApiCache.get.mockClear();
  mockUseApiCache.set.mockClear();
  mockUseApiCache.invalidate.mockClear();
  mockUseApiCache.invalidatePattern.mockClear();
  mockUseApiCache.getStats.mockClear();
  
  mockUseVirtualScroll.virtualItems = [];
  mockUseVirtualScroll.totalHeight = 0;
  mockUseVirtualScroll.startIndex = 0;
  mockUseVirtualScroll.endIndex = 0;
  mockUseVirtualScroll.scrollTop = 0;
  mockUseVirtualScroll.setScrollTop.mockClear();
  mockUseVirtualScroll.containerRef = { current: null };
  mockUseVirtualScroll.scrollToItem.mockClear();
  mockUseVirtualScroll.scrollToTop.mockClear();
  mockUseVirtualScroll.scrollToBottom.mockClear();
  mockUseVirtualScroll.handleScroll.mockClear();
  
  mockUsePerformanceMonitor.startTimer.mockClear();
  mockUsePerformanceMonitor.endTimer.mockClear();
  mockUsePerformanceMonitor.recordCacheHit.mockClear();
  mockUsePerformanceMonitor.recordCacheMiss.mockClear();
  mockUsePerformanceMonitor.getMetrics.mockClear();
  mockUsePerformanceMonitor.getStats.mockClear();
  mockUsePerformanceMonitor.clearMetrics.mockClear();
  mockUsePerformanceMonitor.logPerformanceReport.mockClear();
};

// Add a simple test to prevent Jest from complaining about empty test suite
describe('Mock Setup', () => {
  it('should export mock objects', () => {
    expect(mockUsePotentialMatchModal).toBeDefined();
    expect(mockUseDebouncedApi).toBeDefined();
    expect(mockUseMatchOperations).toBeDefined();
    expect(mockUseApiCache).toBeDefined();
    expect(mockUseVirtualScroll).toBeDefined();
    expect(mockUsePerformanceMonitor).toBeDefined();
  });
}); 