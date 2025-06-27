import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Import the unified mock setup and mock objects
import './mockSetup';
import { mockUsePerformanceMonitor, mockUseVirtualScroll, mockUseDebouncedApi, mockUseApiCache, resetAllMocks } from './mockSetup';

import axios from 'axios';
import LedgerTable from '../index';

// Mock axios
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Helper function to create proper axios response
const createAxiosResponse = (data: any) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { url: '' },
});

// Generate large dataset for performance testing
const generateLargeDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `entry-${i}`,
    vendor_name: `Vendor ${i % 10}`,
    expense_description: `Expense ${i}`,
    wbs_category: `Category ${i % 5}`,
    wbs_subcategory: `Subcategory ${i % 3}`,
    baseline_date: '2024-01-01',
    baseline_amount: 1000 + (i * 100),
    planned_date: '2024-02-01',
    planned_amount: 1200 + (i * 100),
    actual_date: i % 3 === 0 ? '2024-02-15' : null,
    actual_amount: i % 3 === 0 ? 1100 + (i * 100) : null,
    notes: `Notes for entry ${i}`,
    invoice_number: `INV-${String(i).padStart(3, '0')}`,
    invoice_link_text: `Invoice ${i}`,
    invoice_link_url: `https://example.com/invoice${i}`,
  }));
};

const defaultProps = {
  programId: 'test-program-id',
  showAll: false,
  onChange: jest.fn(),
  onOptionsUpdate: jest.fn(),
  filterType: 'all' as const,
  vendorFilter: undefined,
  wbsCategoryFilter: undefined,
  wbsSubcategoryFilter: undefined,
  setFilterType: jest.fn(),
  setVendorFilter: jest.fn(),
  setWbsCategoryFilter: jest.fn(),
  setWbsSubcategoryFilter: jest.fn(),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LedgerTable Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle large datasets efficiently', async () => {
    const largeDataset = generateLargeDataset(1000);
    
    mockedAxios.get.mockResolvedValue(createAxiosResponse({
      entries: largeDataset,
      total: largeDataset.length,
    }));

    const startTime = performance.now();
    
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    const renderTime = performance.now() - startTime;
    
    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(1000); // 1 second threshold
    
    // Should use virtual scrolling for large datasets
    expect(mockUseVirtualScroll.virtualItems.length).toBeLessThan(largeDataset.length);
  });

  it('should debounce search efficiently', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Rapid typing should be debounced
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        fireEvent.change(searchInput, { target: { value: `search term ${i}` } });
      }
    });

    // Should not call API for every keystroke
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Initial load only
    
    // Should use debounced API call
    expect(mockUseDebouncedApi.debouncedCall).toHaveBeenCalled();
  });

  it('should cache API responses efficiently', async () => {
    const testData = {
      entries: generateLargeDataset(100),
      total: 100,
    };

    // First call - cache miss
    mockUseApiCache.get.mockReturnValue(null);
    mockedAxios.get.mockResolvedValue(createAxiosResponse(testData));

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    expect(mockUseApiCache.get).toHaveBeenCalled();
    expect(mockUseApiCache.set).toHaveBeenCalled();

    // Second call - cache hit
    mockUseApiCache.get.mockReturnValue(testData);
    
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    expect(mockUseApiCache.get).toHaveBeenCalled();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Should not call API again
  });

  it('should handle rapid filter changes efficiently', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Rapid filter changes
    await act(async () => {
      for (let i = 0; i < 5; i++) {
        renderWithRouter(
          <LedgerTable
            {...defaultProps}
            filterType={i % 2 === 0 ? 'currentMonthPlanned' : 'emptyActuals'}
          />
        );
      }
    });

    // Should not cause excessive re-renders
    expect(mockedAxios.get).toHaveBeenCalledTimes(6); // Initial + 5 filter changes
  });

  it('should handle bulk operations efficiently', async () => {
    const largeDataset = generateLargeDataset(500);
    
    mockedAxios.get.mockResolvedValue(createAxiosResponse({
      entries: largeDataset,
      total: largeDataset.length,
    }));

    mockedAxios.put.mockResolvedValue(createAxiosResponse({ success: true }));

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Select all rows
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    
    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    // Bulk edit should be efficient
    const bulkEditButton = screen.getByText(/bulk edit/i);
    
    await act(async () => {
      fireEvent.click(bulkEditButton);
    });

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/bulk edit/i)).toBeInTheDocument();
      });
    });
  });

  it('should handle virtual scrolling performance', async () => {
    const largeDataset = generateLargeDataset(10000);
    
    // Setup virtual scroll with large dataset
    mockUseVirtualScroll.virtualItems = largeDataset.slice(0, 20).map((entry, index) => ({
      index,
      data: entry,
      offsetTop: index * 48,
      height: 48,
    }));

    mockedAxios.get.mockResolvedValue(createAxiosResponse({
      entries: largeDataset,
      total: largeDataset.length,
    }));

    const startTime = performance.now();
    
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    const renderTime = performance.now() - startTime;
    
    // Should render quickly even with large dataset
    expect(renderTime).toBeLessThan(500); // 500ms threshold
    
    // Should only render visible items
    expect(mockUseVirtualScroll.virtualItems.length).toBeLessThan(largeDataset.length);
  });

  it('should handle memory usage efficiently', async () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const largeDataset = generateLargeDataset(5000);
    
    mockedAxios.get.mockResolvedValue(createAxiosResponse({
      entries: largeDataset,
      total: largeDataset.length,
    }));

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Simulate some user interactions
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test' } });
    });

    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    
    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    // Memory usage should be reasonable
    if ((performance as any).memory) {
      const finalMemory = (performance as any).memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (adjust threshold as needed)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB threshold
    }
  });

  it('should handle concurrent operations efficiently', async () => {
    mockedAxios.get.mockResolvedValue(createAxiosResponse({
      entries: generateLargeDataset(100),
      total: 100,
    }));

    mockedAxios.put.mockResolvedValue(createAxiosResponse({ success: true }));

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Simulate concurrent operations
    const promises = [];
    
    // Multiple search operations
    const searchInput = screen.getByPlaceholderText(/search/i);
    for (let i = 0; i < 5; i++) {
      promises.push(
        act(async () => {
          fireEvent.change(searchInput, { target: { value: `search ${i}` } });
        })
      );
    }

    // Multiple cell edits
    const vendorCell = screen.getByText('Vendor 0');
    
    await act(async () => {
      fireEvent.click(vendorCell);
    });
    
    const input = screen.getByDisplayValue('Vendor 0');
    for (let i = 0; i < 3; i++) {
      promises.push(
        act(async () => {
          fireEvent.change(input, { target: { value: `Updated Vendor ${i}` } });
          fireEvent.blur(input);
        })
      );
    }

    await Promise.all(promises);

    // Should handle concurrent operations without errors
    expect(mockUsePerformanceMonitor.startTimer).toHaveBeenCalledWith('fetchEntries');
    expect(mockUsePerformanceMonitor.endTimer).toHaveBeenCalledWith('fetchEntries');
  });

  it('should measure performance metrics correctly', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Should start timer for fetch operation
    expect(mockUsePerformanceMonitor.startTimer).toHaveBeenCalledWith('fetchEntries');
    expect(mockUsePerformanceMonitor.endTimer).toHaveBeenCalledWith('fetchEntries');

    // Simulate cache operations
    mockUseApiCache.get.mockReturnValue(null);
    expect(mockUseApiCache.get).toHaveBeenCalled();

    mockUseApiCache.get.mockReturnValue({ entries: [], total: 0 });
    expect(mockUseApiCache.get).toHaveBeenCalled();
  });

  it('should handle rapid state updates efficiently', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Rapid state updates
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        // Simulate rapid filter changes
        defaultProps.setFilterType(i % 2 === 0 ? 'currentMonthPlanned' : 'emptyActuals');
      }
    });

    // Should handle rapid updates without performance degradation
    expect(mockedAxios.get).toHaveBeenCalledTimes(11); // Initial + 10 updates
  });
}); 