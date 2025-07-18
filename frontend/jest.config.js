module.exports = {
  // Use the existing React Scripts configuration as base
  preset: 'react-scripts',
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Transform ignore patterns - allow axios
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)',
  ],
  
  // Test timeout
  testTimeout: 30000,
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts'
  ],
}; 