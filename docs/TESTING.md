# Testing Guidelines

## Overview

This project uses Jest for testing both frontend and backend code. We follow a combination of unit tests, integration tests, and end-to-end tests.

## Test Structure

```
src/
  __tests__/
    unit/         # Unit tests
    integration/  # Integration tests
    e2e/         # End-to-end tests
```

## Frontend Testing

### Component Testing

```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<MyComponent />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
// Example hook test
import { renderHook, act } from '@testing-library/react-hooks';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);
  });
});
```

## Backend Testing

### API Testing

```typescript
// Example API test
import request from 'supertest';
import { app } from '../src/app';

describe('Program API', () => {
  it('creates a new program', async () => {
    const response = await request(app)
      .post('/api/programs')
      .send({
        name: 'Test Program',
        budget: 1000000,
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### Service Testing

```typescript
// Example service test
import { ProgramService } from '../src/services/ProgramService';

describe('ProgramService', () => {
  it('calculates total budget', () => {
    const service = new ProgramService();
    const total = service.calculateTotalBudget([
      { amount: 1000 },
      { amount: 2000 },
    ]);
    expect(total).toBe(3000);
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test

# Run tests with coverage
npm test -- --coverage
```

## Best Practices

1. **Test Organization**
   - Group related tests using `describe` blocks
   - Use clear, descriptive test names
   - Follow the Arrange-Act-Assert pattern

2. **Test Coverage**
   - Aim for at least 80% code coverage
   - Focus on critical business logic
   - Don't test implementation details

3. **Mocking**
   - Mock external dependencies
   - Use mock data factories
   - Keep mocks simple and maintainable

4. **Continuous Integration**
   - All tests must pass before merging
   - Run tests on every pull request
   - Monitor test coverage trends

## Common Issues

1. **Async Testing**
   - Use `async/await` for asynchronous tests
   - Handle promises correctly
   - Use appropriate timeouts

2. **State Management**
   - Reset state between tests
   - Use `beforeEach` and `afterEach` hooks
   - Avoid test interdependence

3. **Environment Setup**
   - Use test environment variables
   - Mock external services
   - Clean up test data 