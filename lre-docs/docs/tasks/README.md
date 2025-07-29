# Task Management

## Overview
This directory contains all project tasks organized by category and status. **Note: Tasks are now consolidated with features in the main sidebar for better organization.**

## New Consolidated Structure
Tasks are now organized by feature in the main sidebar under **Features & Implementation**:

### Cross-Cutting Tasks
- [Bugs](active/bugs.md) - Bug fixes and critical issues
- [General](active/general.md) - Infrastructure, refactoring, documentation

### Feature-Specific Tasks
Each active feature now has its tasks grouped with its implementation plan:
- **BOE System**
  - [Implementation Plan](../../docs/implementation-plans/boe-system)
  - [Tasks](active/boe-system.md)
- **Risk & Opportunity System**
  - [Implementation Plan](../../docs/implementation-plans/risk-opportunity-system)
  - [Tasks](active/risk-opportunity-system.md)
- **User Preferences**
  - [Implementation Plan](../../docs/implementation-plans/user-preferences)
  - [Tasks](active/user-preferences.md)

### Planned Features
- [Multi-Currency](active/multi-currency.md) - Multi-currency support system

## Directory Structure
- `active/` - Currently in progress or planned tasks
- `completed/` - Archived completed tasks
- `backlog/` - Future feature tasks

## Task Categories
 - **Feature-Specific** - Tasks for implementing specific features (now grouped with features)
 - **Bugs** - Bug fixes and critical issues (cross-cutting)
 - **General** - Infrastructure, refactoring, documentation, etc. (cross-cutting)

## Task Naming Conventions
- Feature tasks: `feature-name.md`
- Bugs: `bugs.md`
- General: `general.md`

## Task Status Tracking
- [ ] Not started
- [~] In progress
- [x] Completed
- [BLOCKED] Blocked by external dependency

## Priority Levels
- **Critical** - Must be fixed immediately
- **High** - Important for current sprint
- **Medium** - Important but not urgent
- **Low** - Nice to have

## How to Use
 - Add new tasks to appropriate category file
 - Update status as work progresses
 - Move completed feature tasks to `completed/` directory
 - Archive completed bugs and general tasks (remove or mark as completed)
 - **New**: Navigate to features via the main sidebar for feature-specific tasks

## Benefits of New Structure
- **Feature-Centric Organization**: All related information (overview, implementation plan, tasks) is grouped together
- **Reduced Navigation**: Fewer tabs to switch between
- **Better Context**: Tasks are viewed in the context of their feature
- **Cross-Cutting Visibility**: Bugs and general tasks remain easily accessible at the top level

## Current Active Tasks
### Cross-Cutting
- [Bugs](active/bugs.md) - Bug fixes and critical issues
- [General](active/general.md) - Infrastructure, refactoring, documentation

### Feature-Specific
- [User Preferences](active/user-preferences.md) - User preference management feature
- [Multi-Currency](active/multi-currency.md) - Multi-currency support system
- [BOE System](active/boe-system.md) - BOE (Basis of Estimate) system
- [Risk & Opportunity System](active/risk-opportunity-system.md) - Risk & Opportunity management system

## Completed Tasks
- [Vendor Management](completed/vendor-management.md) - Vendor management system
- [NetSuite Integration](completed/netsuite-actuals-upload.md) - NetSuite actuals upload
- [Settings Configuration](completed/settings-configuration.md) - Settings and configuration system
- [Ledger Management](completed/ledger-management.md) - Ledger management system
- [Program Management](completed/program-management.md) - Program management system

## Task Statistics
- **Active Tasks:** 6 categories
- **Completed Tasks:** 5 major features
- **Total Tasks Tracked:** 300+ individual tasks
- **Completion Rate:** 100% for Q3 2025 features

---
*Last updated: [Current Date]*
*Note: This page is now primarily for reference. For active work, use the consolidated Features & Implementation sidebar.* 