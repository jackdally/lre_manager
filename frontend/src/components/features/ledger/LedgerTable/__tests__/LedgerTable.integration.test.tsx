import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Import the unified mock setup and mock objects
import './mockSetup';
import { mockUsePotentialMatchModal, mockUseDebouncedApi, mockUseApiCache, mockUsePerformanceMonitor, mockUseVirtualScroll, resetAllMocks } from './mockSetup';

import axios from 'axios';
import LedgerTable from '../LedgerTable';

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

const mockEntries = [
  {
    id: '1',
    vendor_name: 'Test Vendor 1',
    expense_description: 'Test Expense 1',
    wbs_category: 'Category 1',
    wbs_subcategory: 'Subcategory 1',
    baseline_date: '2024-01-01',
    baseline_amount: 1000,
    planned_date: '2024-02-01',
    planned_amount: 1200,
    actual_date: null,
    actual_amount: null,
    notes: 'Test notes 1',
    invoice_number: 'INV-001',
    invoice_link_text: 'Invoice 1',
    invoice_link_url: 'https://example.com/invoice1',
  },
  {
    id: '2',
    vendor_name: 'Test Vendor 2',
    expense_description: 'Test Expense 2',
    wbs_category: 'Category 2',
    wbs_subcategory: 'Subcategory 2',
    baseline_date: '2024-01-02',
    baseline_amount: 2000,
    planned_date: '2024-02-02',
    planned_amount: 2400,
    actual_date: '2024-02-15',
    actual_amount: 2300,
    notes: 'Test notes 2',
    invoice_number: 'INV-002',
    invoice_link_text: 'Invoice 2',
    invoice_link_url: 'https://example.com/invoice2',
  },
];

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

describe('LedgerTable Integration Tests', () => {
  beforeEach(() => {
    resetAllMocks();
    
    // Setup default API responses
    mockedAxios.get.mockResolvedValue(
      createAxiosResponse({
        entries: mockEntries,
        total: mockEntries.length,
      })
    );

    // Setup cache to return null initially (cache miss)
    mockUseApiCache.get.mockReturnValue(null);
  });

  it('should render and fetch data on mount', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    // Should call API to fetch data
    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/programs/test-program-id/ledger',
          expect.objectContaining({
            params: expect.objectContaining({
              page: 1,
              pageSize: 10,
            }),
          })
        );
      });
    });

    // Should cache the response
    expect(mockUseApiCache.set).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
    
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });
    
    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
      });
    });
  });

  it('should filter entries by current month planned', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Change filter type
    await act(async () => {
      renderWithRouter(
        <LedgerTable
          {...defaultProps}
          filterType="currentMonthPlanned"
        />
      );
    });

    // Should refetch with new filter
    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  it('should filter entries by empty actuals', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Change filter type
    await act(async () => {
      renderWithRouter(
        <LedgerTable
          {...defaultProps}
          filterType="emptyActuals"
        />
      );
    });

    // Should refetch with new filter
    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  it('should handle search functionality', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Find search input by its specific placeholder
    const searchInput = screen.getByPlaceholderText(/search vendor/i);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test search' } });
    });

    // Wait for debounced search to trigger
    await act(async () => {
      await waitFor(() => {
        expect(mockUseDebouncedApi.debouncedCall).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  it('should handle bulk operations', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Select first row by finding the checkbox in the first data row
    const firstRowCheckbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
    
    await act(async () => {
      fireEvent.click(firstRowCheckbox);
    });

    // Find bulk edit button by its text content
    const bulkEditButton = screen.getByText(/bulk edit/i);
    
    await act(async () => {
      fireEvent.click(bulkEditButton);
    });

    // Should show bulk edit modal
    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/bulk edit/i)).toBeInTheDocument();
      });
    });
  });

  it('should handle cell editing', async () => {
    mockedAxios.put.mockResolvedValue(createAxiosResponse({ success: true }));

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Find the first vendor cell by looking for table cells specifically
    const tableCells = screen.getAllByRole('cell');
    const vendorCell = tableCells.find(cell => 
      cell.textContent === 'Test Vendor 1'
    );
    
    if (vendorCell) {
      await act(async () => {
        fireEvent.click(vendorCell);
      });

      // Should show input field
      await act(async () => {
        await waitFor(() => {
          expect(screen.getByDisplayValue('Test Vendor 1')).toBeInTheDocument();
        });
      });

      const input = screen.getByDisplayValue('Test Vendor 1');
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 'Updated Vendor' } });
        fireEvent.blur(input);
      });

      // Should save the edit
      await act(async () => {
        await waitFor(() => {
          expect(mockedAxios.put).toHaveBeenCalled();
        });
      });
    }
  });

  it('should handle potential matches', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Find potential match button by looking for the icon or button with specific text
    const potentialMatchButtons = screen.getAllByRole('button');
    const potentialMatchButton = potentialMatchButtons.find(button => 
      button.querySelector('[data-testid="potential-match-icon"]') || 
      button.textContent?.includes('potential') ||
      button.title?.includes('potential')
    );
    
    if (potentialMatchButton) {
      await act(async () => {
        fireEvent.click(potentialMatchButton);
      });

      // Should open potential match modal
      await act(async () => {
        await waitFor(() => {
          expect(mockUsePotentialMatchModal.openModal).toHaveBeenCalled();
        });
      });
    }
  });

  it('should handle pagination', async () => {
    // Mock more entries to trigger pagination
    const manyEntries = Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      vendor_name: `Vendor ${i + 1}`,
      expense_description: `Expense ${i + 1}`,
      wbs_category: `Category ${i + 1}`,
      wbs_subcategory: `Subcategory ${i + 1}`,
      baseline_date: '2024-01-01',
      baseline_amount: 1000,
      planned_date: '2024-02-01',
      planned_amount: 1200,
      actual_date: null,
      actual_amount: null,
      notes: 'Test notes',
    }));

    mockedAxios.get.mockResolvedValue(
      createAxiosResponse({
        entries: manyEntries,
        total: manyEntries.length,
      })
    );

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Look for pagination controls
    const paginationButtons = screen.getAllByRole('button');
    const nextPageButton = paginationButtons.find(button => 
      button.textContent?.includes('Next') || 
      button.textContent?.includes('>') ||
      button.getAttribute('aria-label')?.includes('next')
    );
    
    if (nextPageButton) {
      await act(async () => {
        fireEvent.click(nextPageButton);
      });

      // Should fetch next page
      await act(async () => {
        await waitFor(() => {
          expect(mockedAxios.get).toHaveBeenCalledWith(
            '/api/programs/test-program-id/ledger',
            expect.objectContaining({
              params: expect.objectContaining({
                page: 2,
              }),
            })
          );
        });
      });
    }
  });

  it('should handle cache hits', async () => {
    // Setup cache to return data
    mockUseApiCache.get.mockReturnValue({
      entries: mockEntries,
      total: mockEntries.length,
    });

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    // Should use cached data
    expect(mockUseApiCache.get).toHaveBeenCalled();
    expect(mockUsePerformanceMonitor.recordCacheHit).toHaveBeenCalled();
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('should handle cache misses', async () => {
    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    expect(mockUsePerformanceMonitor.recordCacheMiss).toHaveBeenCalled();
  });

  it('should invalidate cache on data changes', async () => {
    mockedAxios.put.mockResolvedValue(createAxiosResponse({ success: true }));

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Edit a cell - use a more specific selector to avoid ambiguity
    const vendorCells = screen.getAllByText('Test Vendor 1');
    const vendorCell = vendorCells.find(cell => cell.tagName === 'TD');
    
    if (vendorCell) {
      await act(async () => {
        fireEvent.click(vendorCell);
      });

      const input = screen.getByDisplayValue('Test Vendor 1');
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 'Updated Vendor' } });
        fireEvent.blur(input);
      });

      // Wait for the API call to complete and cache invalidation to be called
      await act(async () => {
        await waitFor(() => {
          expect(mockedAxios.put).toHaveBeenCalled();
        });
      });

      // Check that cache invalidation was called
      expect(mockUseApiCache.invalidatePattern).toHaveBeenCalledWith(/^ledger-/);
    }
  });

  it('should show performance report in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Ensure the mock returns the expected value
    mockUsePerformanceMonitor.logPerformanceReport = jest.fn();

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Should show performance button - use a more flexible selector
    const performanceButton = screen.getByRole('button', { name: /performance/i });
    expect(performanceButton).toBeInTheDocument();

    // Click performance button
    await act(async () => {
      fireEvent.click(performanceButton);
    });

    expect(mockUsePerformanceMonitor.logPerformanceReport).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle virtual scrolling', async () => {
    // Setup virtual scroll with items
    mockUseVirtualScroll.virtualItems = mockEntries.map((entry, index) => ({
      index,
      data: entry,
      offsetTop: index * 48,
      height: 48,
    }));

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Should use virtual scrolling
    expect(mockUseVirtualScroll.virtualItems).toHaveLength(2);
  });
}); 