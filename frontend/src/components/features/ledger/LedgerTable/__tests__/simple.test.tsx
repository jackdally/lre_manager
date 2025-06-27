import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Import the unified mock setup
import './mockSetup';

// Now import the component
import LedgerTable from '../index';

// Import axios mock
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Simple LedgerTable Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: {
        entries: [],
        total: 0,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });
  });

  it('should render without crashing', () => {
    const props = {
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

    expect(() => {
      render(
        <BrowserRouter>
          <LedgerTable {...props} />
        </BrowserRouter>
      );
    }).not.toThrow();
  });
}); 