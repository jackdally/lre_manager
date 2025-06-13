# LRE Manager

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/jackdally/lre_manager/actions)
[![Issues](https://img.shields.io/github/issues/jackdally/lre_manager.svg)](https://github.com/jackdally/lre_manager/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/jackdally/lre_manager.svg)](https://github.com/jackdally/lre_manager/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/jackdally/lre_manager.svg)](https://github.com/jackdally/lre_manager/commits)

A full-stack web application for managing program budgets and financial tracking. Built with React, Tailwind CSS, Node.js, Express, and PostgreSQL.

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
   git clone <repository-url>
   cd lre_manager_take2
   ```

2. **Install dependencies:**
   ```bash
   cd frontend && npm install && cd ../backend && npm install && cd ..
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both `frontend` and `backend` directories and update as needed.

4. **Start the development environment:**
   - With Docker (recommended):
     ```bash
     docker-compose up
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

- `frontend/` — React + Tailwind CSS UI
- `backend/` — Node.js/Express API (TypeScript, TypeORM)
- `.env.example` — Example environment config
- `docker-compose.yml` — Multi-service orchestration

## UI Overview

- **Program Directory:**
  - Search, filter, sort, add, edit, and delete programs
  - Table and card views with modern dashboard layout
  - Navigation to individual Program Dashboards
- **Program Dashboard:**
  - Summary bar with logo, program info, type, dates, and financials
  - Placeholders for charts and ledger/transactions

## API Documentation

The API documentation is available at [http://localhost:4000/api-docs](http://localhost:4000/api-docs) when running the application.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 