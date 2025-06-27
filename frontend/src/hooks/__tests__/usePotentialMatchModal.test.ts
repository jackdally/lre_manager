import { renderHook, act, waitFor } from '@testing-library/react';
import { usePotentialMatchModal } from '../usePotentialMatchModal';

// Mock fetch
global.fetch = jest.fn();

describe('usePotentialMatchModal', () => {
  const mockProgramId = 'test-program-id';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePotentialMatchModal(mockProgramId));

    expect(result.current.isOpen).toBe(false);
    expect(result.current.currentTab).toBe('matched');
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.ledgerEntryId).toBe(null);
    expect(result.current.potentialMatches).toEqual([]);
    expect(result.current.rejectedMatches).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMatches).toBe(false);
    expect(result.current.totalMatches).toBe(0);
    expect(result.current.currentMatches).toEqual([]);
  });

  it('should open modal and fetch data successfully', async () => {
    const mockData = {
      matched: [
        { 
          id: '1', 
          vendorName: 'Test Vendor', 
          description: 'Test Description', 
          amount: 100, 
          transactionDate: '2024-01-01', 
          status: 'potential' 
        },
        { 
          id: '2', 
          vendorName: 'Test Vendor 2', 
          description: 'Test Description 2', 
          amount: 200, 
          transactionDate: '2024-01-02', 
          status: 'potential' 
        }
      ],
      rejected: [
        { 
          id: '3', 
          vendorName: 'Rejected Vendor', 
          description: 'Rejected Description', 
          amount: 300, 
          transactionDate: '2024-01-03', 
          status: 'rejected' 
        }
      ]
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() => usePotentialMatchModal(mockProgramId));

    await act(async () => {
      await result.current.openModal('test-entry-id');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.ledgerEntryId).toBe('test-entry-id');
    expect(result.current.currentTab).toBe('matched');
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.potentialMatches).toEqual(mockData.matched);
    expect(result.current.rejectedMatches).toEqual(mockData.rejected);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMatches).toBe(true);
    expect(result.current.totalMatches).toBe(2);
    expect(result.current.currentMatches).toEqual(mockData.matched);
  });

  it('should auto-switch to rejected tab when no potential matches', async () => {
    const mockData = {
      matched: [],
      rejected: [
        { 
          id: '3', 
          vendorName: 'Rejected Vendor', 
          description: 'Rejected Description', 
          amount: 300, 
          transactionDate: '2024-01-03', 
          status: 'rejected' 
        }
      ]
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() => usePotentialMatchModal(mockProgramId));

    await act(async () => {
      await result.current.openModal('test-entry-id');
    });

    expect(result.current.currentTab).toBe('rejected');
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.hasMatches).toBe(true);
    expect(result.current.totalMatches).toBe(1);
    expect(result.current.currentMatches).toEqual(mockData.rejected);
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePotentialMatchModal(mockProgramId));

    await act(async () => {
      await result.current.openModal('test-entry-id');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.potentialMatches).toEqual([]);
    expect(result.current.rejectedMatches).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMatches).toBe(false);
  });

  it('should close modal and reset state', () => {
    const { result } = renderHook(() => usePotentialMatchModal(mockProgramId));

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.ledgerEntryId).toBe(null);
    expect(result.current.currentTab).toBe('matched');
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.potentialMatches).toEqual([]);
    expect(result.current.rejectedMatches).toEqual([]);
  });

  it('should switch tabs correctly', () => {
    const { result } = renderHook(() => usePotentialMatchModal(mockProgramId));

    act(() => {
      result.current.switchTab('rejected');
    });

    expect(result.current.currentTab).toBe('rejected');
    expect(result.current.currentIndex).toBe(0);
  });

  it('should set index within bounds', async () => {
    const mockData = {
      matched: [
        { 
          id: '1', 
          vendorName: 'Test', 
          description: 'Test', 
          amount: 100, 
          transactionDate: '2024-01-01', 
          status: 'potential' 
        },
        { 
          id: '2', 
          vendorName: 'Test 2', 
          description: 'Test 2', 
          amount: 200, 
          transactionDate: '2024-01-02', 
          status: 'potential' 
        }
      ],
      rejected: []
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() => usePotentialMatchModal(mockProgramId));

    // First open modal to load data
    await act(async () => {
      await result.current.openModal('test-entry-id');
    });

    // Now set index to 1
    act(() => {
      result.current.setIndex(1);
    });

    expect(result.current.currentIndex).toBe(1);

    // Test bounds checking - should clamp to max index
    act(() => {
      result.current.setIndex(5);
    });

    expect(result.current.currentIndex).toBe(1); // Max index is 1 (2 items - 1)

    // Test bounds checking - should clamp to 0
    act(() => {
      result.current.setIndex(-1);
    });

    expect(result.current.currentIndex).toBe(0);
  });

  it('should refresh data correctly', async () => {
    const mockData = {
      matched: [
        { 
          id: '1', 
          vendorName: 'Test', 
          description: 'Test', 
          amount: 100, 
          transactionDate: '2024-01-01', 
          status: 'potential' 
        }
      ],
      rejected: []
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() => usePotentialMatchModal(mockProgramId));

    // First open modal
    await act(async () => {
      await result.current.openModal('test-entry-id');
    });

    // Then refresh
    await act(async () => {
      await result.current.refreshData();
    });

    expect(result.current.potentialMatches).toEqual(mockData.matched);
    expect(result.current.rejectedMatches).toEqual(mockData.rejected);
  });

  it('should not refresh when no ledger entry ID', async () => {
    const { result } = renderHook(() => usePotentialMatchModal(mockProgramId));

    await act(async () => {
      await result.current.refreshData();
    });

    expect(fetch).not.toHaveBeenCalled();
  });
}); 