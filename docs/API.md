# API Documentation

## Base URL
```
http://localhost:4000/api
```

## Authentication
All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

To obtain a token:
1. Register a new user: `POST /api/auth/register`
2. Login: `POST /api/auth/login`

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user

## Endpoints

### Programs

#### GET /programs
Retrieve all programs.

**Query Parameters**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field (default: 'createdAt')
- `order`: Sort order ('asc' or 'desc')

**Response**
```json
{
  "programs": [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "description": "string",
      "status": "ACTIVE" | "INACTIVE",
      "startDate": "string",
      "endDate": "string",
      "totalBudget": "number",
      "type": "ANNUAL" | "PERIOD_OF_PERFORMANCE"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
```

#### POST /programs
Create a new program.

**Request Body**
```json
{
  "code": "string",
  "name": "string",
  "description": "string",
  "startDate": "string",
  "endDate": "string",
  "totalBudget": "number",
  "type": "ANNUAL" | "PERIOD_OF_PERFORMANCE"
}
```

### Transactions

#### GET /transactions
Retrieve all transactions.

**Query Parameters**
- `programId`: Filter by program ID
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field (default: 'date')
- `order`: Sort order ('asc' or 'desc')

**Response**
```json
{
  "transactions": [
    {
      "id": "string",
      "programId": "string",
      "date": "string",
      "vendor": "string",
      "description": "string",
      "amount": "number",
      "status": "PENDING" | "APPROVED" | "REJECTED"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
```

#### POST /transactions
Create a new transaction.

**Request Body**
```json
{
  "programId": "string",
  "date": "string",
  "vendor": "string",
  "description": "string",
  "amount": "number"
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object" // Optional additional error details
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Authentication required
- `INVALID_REQUEST`: Invalid request parameters
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `VALIDATION_ERROR`: Request validation failed

## WebSocket Events

The API also supports WebSocket connections for real-time updates:

```
ws://localhost:4000/api/ws
```

### Events
- `program.created`: New program created
- `program.updated`: Program updated
- `transaction.created`: New transaction created
- `transaction.updated`: Transaction updated

## API Versioning

The API is versioned in the URL:
```
http://localhost:4000/api/v1/...
```

Current version: v1
