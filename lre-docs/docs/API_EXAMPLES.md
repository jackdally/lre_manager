# API Examples

This document provides practical examples of using the LRE Manager API.

## Authentication

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Programs

### Create a New Program
```bash
curl -X POST http://localhost:4000/api/programs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "POP-003",
    "name": "New Period of Performance",
    "description": "A new PoP program",
    "startDate": "2024-01-01",
    "endDate": "2025-12-31",
    "totalBudget": 15000000,
    "type": "PERIOD_OF_PERFORMANCE"
  }'
```

### Get Programs with Filtering
```bash
curl -X GET "http://localhost:4000/api/programs?type=ANNUAL&status=ACTIVE&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Transactions

### Create a Transaction
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "1",
    "date": "2024-01-15",
    "vendor": "Acme Corp",
    "description": "Software License",
    "amount": 5000,
    "wbsCategory": "Software",
    "wbsSubcategory": "Licenses"
  }'
```

### Get Transactions with Date Range
```bash
curl -X GET "http://localhost:4000/api/transactions?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## WBS Categories

### Create a WBS Category
```bash
curl -X POST http://localhost:4000/api/wbs-categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "1",
    "name": "Hardware",
    "description": "Computer hardware expenses"
  }'
```

### Create a WBS Subcategory
```bash
curl -X POST http://localhost:4000/api/wbs-subcategories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "1",
    "name": "Servers",
    "description": "Server hardware expenses"
  }'
```

## Reports

### Get Program Summary
```bash
curl -X GET "http://localhost:4000/api/reports/program-summary/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "program": {
    "id": "1",
    "name": "Annual Program 2024",
    "totalBudget": 10000000,
    "spent": 2500000,
    "remaining": 7500000
  },
  "transactions": {
    "total": 50,
    "byCategory": {
      "Hardware": 1000000,
      "Software": 800000,
      "Services": 700000
    }
  }
}
```

### Get Budget vs Actual Report
```bash
curl -X GET "http://localhost:4000/api/reports/budget-vs-actual?programId=1&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

### Invalid Request
```bash
curl -X POST http://localhost:4000/api/programs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Program"
  }'
```

Response:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "code": "Required field",
      "startDate": "Required field",
      "endDate": "Required field",
      "totalBudget": "Required field"
    }
  }
}
```

### Authentication Error
```bash
curl -X GET http://localhost:4000/api/programs
```

Response:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

## WebSocket Examples

### Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:4000/api/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Subscribe to Program Updates
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'program.1'
}));
```

## Rate Limiting

When rate limit is exceeded:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "retryAfter": 60
    }
  }
}
```

## Best Practices

 - **Error Handling**
   - Always check for error responses
   - Implement retry logic for transient errors
   - Handle rate limiting appropriately

 - **Authentication**
   - Store tokens securely
   - Implement token refresh logic
   - Handle authentication errors gracefully

 - **Performance**
   - Use pagination for large datasets
   - Implement caching where appropriate
   - Use WebSocket for real-time updates

 - **Security**
   - Never store tokens in client-side code
   - Validate all input data
   - Use HTTPS in production 