// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock fetch to prevent actual network requests in tests
global.fetch = jest.fn((url: string) => {
  // Handle different URL patterns
  if (url && url.includes('potential-match-ids')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(['1', '2', '3']),
      status: 200,
      statusText: 'OK',
    });
  }
  if (url && url.includes('rejected-match-ids')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(['4', '5']),
      status: 200,
      statusText: 'OK',
    });
  }
  // Default response for any other URL
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    status: 200,
    statusText: 'OK',
  });
}) as jest.Mock;

// Mock axios to avoid ES module import issues
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

// Mock performance.now for consistent testing
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => 1234567890),
  },
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: `ReactDOMTestUtils.act` is deprecated') ||
       args[0].includes('Warning: ReactDOM.render is no longer supported'))
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}); 