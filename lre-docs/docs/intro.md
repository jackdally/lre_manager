---
sidebar_position: 1
---

# Welcome to LRE Manager

LRE Manager is a comprehensive tool for managing Latest Revised Estimate (LRE) programs, tracking expenses, and maintaining financial records.

## What is LRE Manager?

LRE Manager is a full-stack web application designed to streamline the management of estimate programs and financial tracking. It provides:

- **Program Management** - Create and manage estimate programs with hierarchical WBS structures
- **Expense Tracking** - Track costs against budgets with detailed ledger management
- **Financial Reporting** - Generate reports and analyze financial performance
- **NetSuite Integration** - Upload and automatically match NetSuite transaction exports
- **Vendor Management** - Centralized vendor database with performance tracking
- **Settings & Configuration** - Flexible system configuration and standardization

## Key Features

### 🚀 **Core Functionality**
- **Program Creation & Management** - Hierarchical WBS structure support
- **Ledger Management** - Comprehensive expense tracking and categorization
- **NetSuite Integration** - Smart matching of actual transactions
- **Vendor Management** - Centralized vendor database with NetSuite sync
- **Settings & Configuration** - WBS templates, cost categories, currencies

### 📊 **Advanced Features**
- **Smart Transaction Matching** - AI-powered matching with confidence scoring
- **Bulk Import/Export** - Excel and CSV support for data operations
- **Real-time Validation** - Comprehensive data validation and error handling
- **Multi-currency Support** - Currency management with exchange rates
- **User Preferences** - Customizable interface and settings

### 🔧 **Technical Stack**
- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with TypeORM
- **State Management**: Zustand
- **Deployment**: Docker with Docker Compose

## Quick Start

### Prerequisites
- Node.js v18 or later
- npm v8 or later
- Docker and Docker Compose
- PostgreSQL 14 or later (if running without Docker)

### Installation

 - **Clone the repository**
   ```bash
   git clone https://github.com/jackdally/lre_manager.git
   cd lre_manager
   ```

 - **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend && npm install
   cd ..
   
   # Install frontend dependencies
   cd frontend && npm install
   cd ..
   ```

 - **Start the development environment**
   ```bash
   docker-compose -f docker/docker-compose.dev.yml up
   ```

 - **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## Documentation Structure

This documentation is organized into several sections:

### 📚 **Documentation**
- **Getting Started** - Setup, architecture, API examples
- **Project Management** - Development workflow and processes

### 🎯 **Features**
- **Feature Roadmap** - Planned, in-progress, and completed features
- **Implementation Details** - Technical specifications and requirements

### 📋 **Tasks**
- **Task Management** - Organized task tracking by category
- **Active Tasks** - Current work in progress
- **Completed Tasks** - Archived completed work

### 🔧 **Implementation**
- **Implementation Plans** - Detailed technical plans for features
- **Sprint Planning** - Development sprints and planning
- **Archived Plans** - Completed implementation documentation

## Project Status

### ✅ **Completed (Q3 2025)**
- Vendor Management System
- NetSuite Actuals Upload & Smart Matching
- Settings & Configuration System
- Ledger Management System
- Program Management System

### 🚧 **In Progress**
- User Preference Management

### 📋 **Planned**
- BOE (Basis of Estimate) System
- Risks & Opportunities System
- Executive Management Dashboard
- Finance Team Integration
- Advanced Reporting & Analytics

## Contributing

This is currently a one-person project, but contributions are welcome! Please see the [Project Management](PROJECT_MANAGEMENT) section for development guidelines and processes.

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/jackdally/lre_manager/issues)
- **Documentation**: This site contains comprehensive documentation
- **Code**: [View source code](https://github.com/jackdally/lre_manager)

---

*Last updated: [Current Date]*
