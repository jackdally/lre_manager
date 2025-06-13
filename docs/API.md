# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Endpoints

### Programs

#### GET /programs
Retrieve all programs.

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
  ]
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
  ]
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
    "message": "string"
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Authentication required
- `INVALID_REQUEST`: Invalid request parameters
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error
