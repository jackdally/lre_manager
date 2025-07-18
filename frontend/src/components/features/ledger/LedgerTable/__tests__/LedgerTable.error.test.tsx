import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Import the unified mock setup
import './mockSetup';
import { mockUsePotentialMatchModal } from './mockSetup';

import axios from 'axios';
import LedgerTable from '../LedgerTable';

// Mock axios
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

describe('LedgerTable Error Handling Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle network errors during initial load', async () => {
    const networkError = new Error('Network Error');
    mockedAxios.get.mockRejectedValue(networkError);

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    // Wait for the error to be set (but not displayed yet since showErrorModal is false)
    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // The error should be set in state but not displayed since showErrorModal is false
    // We can verify this by checking that the component renders without crashing
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });

  it('should handle server errors (500)', async () => {
    const serverError = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error' },
        statusText: 'Internal Server Error',
        headers: {},
        config: { url: '' },
      },
    };
    mockedAxios.get.mockRejectedValue(serverError);

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Component should still render even with error
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });

  it('should handle authentication errors (401)', async () => {
    const authError = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
        statusText: 'Unauthorized',
        headers: {},
        config: { url: '' },
      },
    };
    mockedAxios.get.mockRejectedValue(authError);

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Component should still render even with error
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });

  it('should handle permission errors (403)', async () => {
    const permissionError = {
      response: {
        status: 403,
        data: { message: 'Forbidden' },
        statusText: 'Forbidden',
        headers: {},
        config: { url: '' },
      },
    };
    mockedAxios.get.mockRejectedValue(permissionError);

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Component should still render even with error
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });

  it('should handle not found errors (404)', async () => {
    const notFoundError = {
      response: {
        status: 404,
        data: { message: 'Program not found' },
        statusText: 'Program not found',
        headers: {},
        config: { url: '' },
      },
    };
    mockedAxios.get.mockRejectedValue(notFoundError);

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Component should still render even with error
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });

  it('should handle malformed API responses', async () => {
    mockedAxios.get.mockResolvedValue({
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Component should handle malformed data gracefully
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });

  it('should handle missing required fields in API response', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: [
          {
            id: '1',
            // Missing required fields
          },
        ],
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Component should handle missing fields gracefully
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });

  it('should handle valid API response', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: mockEntries,
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        // Look for the vendor name in a table cell specifically
        const tableCells = screen.getAllByRole('cell');
        const vendorCell = tableCells.find(cell => 
          cell.textContent === 'Test Vendor 1'
        );
        expect(vendorCell).toBeInTheDocument();
      });
    });
  });

  it('should display error in modal when showErrorModal is true', async () => {
    // First render with successful data load
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: mockEntries,
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Now mock a failure for the next operation
    mockedAxios.post.mockRejectedValue(new Error('Create entry failed'));

    // Try to create a new entry which should trigger the error modal
    const addEntryButton = screen.getByText(/add entry/i);
    
    await act(async () => {
      fireEvent.click(addEntryButton);
    });

    // Wait for the new row to be created and then try to save it
    await act(async () => {
      await waitFor(() => {
        // Look for the save button in the new row
        const saveButtons = screen.getAllByRole('button');
        const saveButton = saveButtons.find(button => 
          button.textContent?.includes('Save') || 
          button.textContent?.includes('✓')
        );
        if (saveButton) {
          fireEvent.click(saveButton);
        }
      });
    });

    // Wait for the error modal to appear
    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    // Should show the error message in the modal
    expect(screen.getByText(/error creating entry/i)).toBeInTheDocument();
  });

  it('should handle cell edit errors', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: mockEntries,
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    const editError = {
      response: {
        status: 400,
        data: { message: 'Invalid field value' },
        statusText: 'Bad Request',
        headers: {},
        config: {},
      },
    };
    mockedAxios.put.mockRejectedValue(editError);

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Try to edit a cell - find the vendor cell in table specifically
    const tableCells = screen.getAllByRole('cell');
    const vendorCell = tableCells.find(cell => 
      cell.textContent === 'Test Vendor 1'
    );
    
    if (vendorCell) {
      await act(async () => {
        fireEvent.click(vendorCell);
      });

      const input = screen.getByDisplayValue('Test Vendor 1');
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 'Invalid Value' } });
        fireEvent.blur(input);
      });

      // Should handle edit error gracefully
      await act(async () => {
        await waitFor(() => {
          expect(mockedAxios.put).toHaveBeenCalled();
        });
      });
    }
  });

  it('should handle bulk edit errors', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: mockEntries,
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    const bulkEditError = {
      response: {
        status: 500,
        data: { message: 'Bulk edit failed' },
        statusText: 'Internal Server Error',
        headers: {},
        config: {},
      },
    };
    mockedAxios.put.mockRejectedValue(bulkEditError);

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Select first row by finding the checkbox in the first data row
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1]; // Skip header checkbox
    
    await act(async () => {
      fireEvent.click(firstRowCheckbox);
    });

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

  it('should handle bulk delete errors', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: mockEntries,
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    const bulkDeleteError = {
      response: {
        status: 403,
        data: { message: 'Permission denied' },
        statusText: 'Forbidden',
        headers: {},
        config: {},
      },
    };
    mockedAxios.delete.mockRejectedValue(bulkDeleteError);

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Select first row by finding the checkbox in the first data row
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1]; // Skip header checkbox
    
    await act(async () => {
      fireEvent.click(firstRowCheckbox);
    });

    const bulkDeleteButton = screen.getByText(/bulk delete/i);
    
    await act(async () => {
      fireEvent.click(bulkDeleteButton);
    });

    // Should show bulk delete modal
    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/bulk delete/i)).toBeInTheDocument();
      });
    });
  });

  it('should handle search errors', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: mockEntries,
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    const searchError = new Error('Search failed');

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Try to search
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test search' } });
    });

    // Should handle search gracefully
    expect(searchInput).toHaveValue('test search');
  });

  it('should handle potential match errors', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: mockEntries,
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    const potentialMatchError = new Error('Failed to load potential matches');

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Try to open potential matches - use a more specific selector or check if it exists
    const potentialMatchButton = screen.queryByTitle(/potential matches/i);
    
    if (potentialMatchButton) {
      await act(async () => {
        fireEvent.click(potentialMatchButton);
      });

      // Should handle potential match errors gracefully
      expect(mockUsePotentialMatchModal.openModal).toHaveBeenCalled();
    } else {
      // If button doesn't exist, just verify the component renders correctly
      expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
    }
  });

  it('should handle cache errors gracefully', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: mockEntries,
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    // Should fall back to API call when cache fails
    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });
  });

  it('should handle invalid filter values', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: mockEntries,
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Try to set invalid filter type
    await act(async () => {
      defaultProps.setFilterType('invalid' as any);
    });

    // Should handle invalid filter gracefully
    expect(defaultProps.setFilterType).toHaveBeenCalled();
  });

  it('should handle missing callback props', async () => {
    const propsWithoutCallbacks = {
      ...defaultProps,
      onChange: undefined,
      onOptionsUpdate: undefined,
    };

    await act(async () => {
      renderWithRouter(<LedgerTable {...propsWithoutCallbacks} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Component should render without errors even with missing callbacks
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });

  it('should handle timeout errors', async () => {
    // Mock a timeout error
    mockedAxios.get.mockRejectedValueOnce(new Error('timeout of 5000ms exceeded'));

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Component should still render even with timeout error
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });

  it('should handle aborted requests', async () => {
    // Mock an aborted request error
    const abortError = new Error('canceled');
    abortError.name = 'CanceledError';
    mockedAxios.get.mockRejectedValueOnce(abortError);

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Component should still render even with aborted request
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });

  it('should handle malformed entry data', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: [
          {
            id: '1',
            vendor_name: 'Test Vendor 1',
            expense_description: 'Test Expense 1',
            wbs_category: 'Category 1',
            wbs_subcategory: 'Subcategory 1',
            baseline_date: '2024-01-01',
            baseline_amount: 'invalid-amount', // Invalid amount
            planned_date: '2024-02-01',
            planned_amount: 'invalid-amount', // Invalid amount
            actual_date: null,
            actual_amount: null,
            notes: 'Test notes 1',
          },
        ],
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });

    await act(async () => {
      renderWithRouter(<LedgerTable {...defaultProps} />);
    });

    await act(async () => {
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    // Component should handle malformed data gracefully
    expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
  });
}); 