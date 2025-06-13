# LRE Manager

A full-stack web application for managing program budgets and financial tracking. Built with React, Node.js, Express, and PostgreSQL.

## Features

- Program Directory with search and filtering capabilities
- Support for both Annual and Period of Performance programs
- Modern, responsive UI built with Material-UI
- RESTful API with Swagger documentation
- Docker support for easy deployment

## Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose
- PostgreSQL (if running locally)

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd lre-manager
```

2. Install dependencies:
```bash
npm run install:all
```

3. Start the development environment:
```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/api-docs

## Development

### Frontend
- Built with React and TypeScript
- Uses Material-UI for components
- Located in the `frontend` directory

### Backend
- Built with Node.js, Express, and TypeScript
- Uses TypeORM for database operations
- Located in the `backend` directory

### Database
- PostgreSQL database
- Schema is automatically created using TypeORM

## API Documentation

The API documentation is available at http://localhost:4000/api-docs when running the application. It provides detailed information about all available endpoints and their usage.

## Deployment

The application is containerized and can be deployed to any environment that supports Docker. The `docker-compose.yml` file includes all necessary services:

- Frontend (React)
- Backend (Node.js/Express)
- Database (PostgreSQL)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 