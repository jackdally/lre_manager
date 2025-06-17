# Backend

The backend service for LRE Manager, built with Node.js, Express, and TypeScript.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run format` - Format code with Prettier

### Project Structure

```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── middleware/    # Express middleware
│   ├── utils/         # Utility functions
│   └── app.ts         # Application setup
├── tests/             # Test files
└── dist/             # Compiled output
```

### API Documentation

API documentation is available at `/api-docs` when running the server.

### Database

The application uses PostgreSQL with TypeORM. Database migrations are managed through TypeORM's migration system.

To run migrations:
```bash
npm run migration:run
```

To create a new migration:
```bash
npm run migration:create
```

### Testing

Tests are written using Jest. Run the test suite:
```bash
npm test
```

For test coverage:
```bash
npm run test:coverage
```

## Deployment

The backend is containerized using Docker. Build the image:
```bash
docker build -t lre-manager-backend .
```

## Contributing

1. Follow the coding standards
2. Write tests for new features
3. Update documentation
4. Submit a pull request

## Troubleshooting

Common issues and solutions:

1. **Database Connection**
   - Check PostgreSQL is running
   - Verify connection string in .env
   - Check network connectivity

2. **Port Conflicts**
   - Default port is 4000
   - Change port in .env if needed

3. **TypeScript Errors**
   - Run `npm run build` to check for errors
   - Check tsconfig.json settings 