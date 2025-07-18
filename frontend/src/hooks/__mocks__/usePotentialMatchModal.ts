export const usePotentialMatchModal = jest.fn(() => ({
  isOpen: false,
  currentTab: 'matched',
  currentIndex: 0,
  ledgerEntryId: null,
  potentialMatches: [],
  rejectedMatches: [],
  isLoading: false,
  hasMatches: false,
  totalMatches: 0,
  currentMatches: [],
  openModal: jest.fn(),
  closeModal: jest.fn(),
  switchTab: jest.fn(),
  setIndex: jest.fn(),
  refreshData: jest.fn(),
})); 