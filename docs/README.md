# LRE Manager Documentation

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/jackdally/lre_manager/actions)
[![Issues](https://img.shields.io/github/issues/jackdally/lre_manager.svg)](https://github.com/jackdally/lre_manager/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/jackdally/lre_manager.svg)](https://github.com/jackdally/lre_manager/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/jackdally/lre_manager.svg)](https://github.com/jackdally/lre_manager/commits)

## Documentation Index

### Getting Started
- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Architecture Overview](ARCHITECTURE.md) - System design and components
- [FAQ](FAQ.md) - Frequently asked questions

### Development
- [API Documentation](API.md) - API endpoints and specifications
- [API Examples](API_EXAMPLES.md) - Practical API usage examples
- [Testing Guide](TESTING.md) - Testing procedures and guidelines

### Security & Compliance
- [Risk Register](RISK_REGISTER.md) - Known security risks and mitigations

### Contributing
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community standards and guidelines

## Features

- Program Directory with search, filter, sort, add, edit, and delete
- Toggleable table and card views for programs
- Modern, responsive UI built with Tailwind CSS
- Program Dashboard with summary, charts, and ledger placeholders
- RESTful API with Swagger documentation
- Docker support for easy deployment

## Screenshots

### Program Directory (Table View)
![Program Directory Table View](screenshots/program-directory-table.png)

### Program Directory (Card View)
![Program Directory Card View](screenshots/program-directory-card.png)

### Program Dashboard
![Program Dashboard](screenshots/program-dashboard.png)

> To update screenshots, place your images in the `screenshots/` folder and update the paths above as needed.

## Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose (optional, for containerized setup)
- PostgreSQL (if running locally)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/lre_manager.git
   cd lre_manager
   ```

2. **Install dependencies:**
   ```bash
   # Install backend dependencies
   cd backend && npm install
   cd ..

   # Install frontend dependencies
   cd frontend && npm install
   cd ..
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both `frontend` and `backend` directories and update as needed.

4. **Start the development environment:**
   - With Docker (recommended):
     ```bash
     # If you make changes to backend TypeScript code:
     cd backend
     npm run build
     cd ..
     # Then restart the backend container:
     docker-compose -f docker/docker-compose.yml restart backend
     # Start the environment (if not already running):
     docker-compose -f docker/docker-compose.yml up
     ```
   - Or run frontend and backend separately:
     ```bash
     cd backend && npm run dev
     # In a new terminal:
     cd frontend && npm start
     ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/api-docs

## Project Structure

```
lre_manager/
├── backend/           # Backend API server
├── frontend/         # React frontend application
├── docker/          # Docker configuration files
├── scripts/         # Utility scripts
└── docs/           # Documentation
```

## Key Files

- `docker/docker-compose.yml` — Multi-service orchestration
- `docker/Dockerfile.frontend` — Frontend container configuration
- `docker/Dockerfile.backend` — Backend container configuration
- `docker/Dockerfile.db` — Database container configuration

## UI Overview

- **Program Directory:**
  - Search, filter, sort, add, edit, and delete programs
  - Table and card views with modern dashboard layout
  - Navigation to individual Program Dashboards
- **Program Dashboard:**
  - Summary bar with logo, program info, type, dates, and financials
  - Placeholders for charts and ledger/transactions

## Support

For additional help:
- Check the [FAQ](FAQ.md)
- Open an issue on GitHub
- Contact the maintainers

## License

This project is licensed under the MIT License - see the LICENSE file for details.

> **Note:** If you change backend TypeScript files, always run `npm run build` in the backend directory and restart the backend container to see your changes take effect. 