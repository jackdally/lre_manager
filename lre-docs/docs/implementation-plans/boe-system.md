# BOE (Basis of Estimate) System Implementation Plan

## Overview
- **Feature**: BOE (Basis of Estimate) System from docs/FEATURES.md
- **Priority**: High Priority
- **Estimated Effort**: 6-8 weeks (3-4 sprints)
- **Dependencies**: Existing ledger management system, WBS templates, vendor management
- **Task Tracking**: [BOE System Tasks](../tasks/active/boe-system.md)

## Requirements
- [ ] Comprehensive BOE page with ledger creation workflow
- [ ] BOE templates and wizards for different project types
- [ ] BOE approval workflow and versioning
- [ ] User-friendly forms for entering baseline estimates
- [ ] Preliminary Management Reserve calculation based on industry standards
- [ ] Integration with existing ledger management system
- [ ] **Time-based cost allocation system for direct labor/contractor costs**
  - [ ] Support for linear, front-loaded, back-loaded, and custom allocation patterns
  - [ ] Automatic monthly breakdown calculation
  - [ ] Integration with ledger system for baseline budget creation
  - [ ] Real-time tracking of actual vs. allocated amounts

## Architecture

### Backend Changes
- [x] **Database Schema Updates**
  - [x] Create `BOETemplate` entity with hierarchical structure
  - [x] Create `BOEVersion` entity for versioning support
  - [x] Create `BOEApproval` entity for workflow tracking
  - [x] Create `ManagementReserve` entity for MR calculations
  - [x] Add BOE-related fields to existing `Program` entity
  - [x] Create `BOETimeAllocation` entity for time-based cost allocation

- [x] **API Endpoints**
  - [x] `GET /api/programs/:id/boe` - Get current BOE for program
  - [x] `POST /api/programs/:id/boe` - Create new BOE version
  - [x] `PUT /api/programs/:id/boe/:version` - Update BOE version
  - [x] `GET /api/boe-templates` - Get available BOE templates
  - [x] `POST /api/boe-templates` - Create new BOE template
  - [x] `POST /api/programs/:id/boe/approve` - Submit for approval
  - [x] `POST /api/programs/:id/boe/approve/:version` - Approve specific version
  - [x] `POST /api/programs/:id/boe/:versionId/push-to-ledger` - Push entire BOE to ledger
  - [x] `GET /api/programs/:id/time-allocations` - Get time allocations for program
  - [x] `POST /api/programs/:id/time-allocations` - Create new time allocation
  - [x] `POST /api/time-allocations/:id/push-to-ledger` - Push allocation to ledger
  - [x] `POST /api/time-allocations/:id/update-actuals` - Update actuals from ledger

- [x] **Business Logic**
  - [x] BOE calculation engine with WBS integration
  - [x] Management Reserve calculation algorithms
  - [x] Approval workflow state management
  - [x] Version control and change tracking
  - [x] Time allocation calculation engine with multiple allocation patterns
  - [x] Monthly breakdown generation and ledger integration
  - [ ] Integration with ledger system for actuals comparison

- [x] **Validation Rules**
  - [x] BOE structure validation (WBS compliance)
  - [x] Cost category validation
  - [x] Vendor assignment validation
  - [x] Approval workflow validation
  - [x] Management Reserve percentage validation (5-15% range)

### Frontend Changes
- [x] **UI Components**
  - [x] BOEPage component with tab navigation
  - [x] BOEWizard component for guided creation
  - [x] BOETemplateSelector component
  - [x] BOEOverview component with placeholder content
  - [x] BOEDetails component with placeholder content
  - [x] BOEApproval component with placeholder content
  - [x] BOEHistory component with placeholder content
  - [ ] BOEForm component with hierarchical editing
  - [ ] ManagementReserveCalculator component
  - [ ] BOEApprovalWorkflow component
  - [ ] BOEVersionHistory component

- [x] **State Management**
  - [x] BOE store with Zustand
  - [x] BOE template store
  - [x] Approval workflow store
  - [x] Integration with existing program and ledger stores

- [x] **API Integration**
  - [x] BOE API service layer
  - [x] Real-time validation and error handling
  - [x] Optimistic updates for better UX
  - [ ] Offline support for draft BOEs

- [x] **User Experience**
  - [x] Guided wizard for new BOE creation
  - [x] Tab navigation with proper styling
  - [x] Visual indicators for approval status
  - [x] Consistent UI formatting matching Settings page
  - [ ] Inline editing for BOE entries
  - [ ] Real-time calculations and totals
  - [ ] Export capabilities (PDF, Excel)

### Integration Points
- [ ] **Existing System Integration**
  - [ ] WBS template system integration
  - [ ] Vendor management system integration
  - [ ] Ledger management system integration
  - [ ] Program management system integration

- [ ] **External System Integration**
  - [ ] NetSuite integration for cost data
  - [ ] Document management system for approvals
  - [ ] Email notification system for approvals

- [ ] **Data Migration**
  - [ ] Migrate existing program estimates to BOE format
  - [ ] Create default BOE templates from existing WBS templates
  - [ ] Set up initial approval workflows

## Implementation Phases

### Phase 1: Foundation & Database (Week 1-2) ✅ **COMPLETED**
**Tasks**: See [BOE System Tasks](../tasks/active/boe-system.md) for detailed task breakdown
- ✅ Database schema design and implementation
- ✅ BOE entities and API endpoints
- ✅ Business logic and calculation engine
- ✅ API routes and validation
- ✅ Successfully tested with real data

### Phase 2: Core BOE Functionality (Week 3-4) ✅ **COMPLETED**
**Tasks**: See [BOE System Tasks](../tasks/active/boe-system.md) for detailed task breakdown
- ✅ BOE template system with creation wizard and editing capabilities
- ✅ Frontend foundation with tab navigation and placeholder content
- ✅ Consistent UI styling matching Settings page
- ✅ **Hierarchical WBS editing functionality** - Expandable/collapsible tree with parent-child relationships
- ✅ **Cost category and vendor integration** - Full integration with existing systems
- ✅ **BOE to Ledger integration** - "Push to Ledger" functionality with confirmation dialogs
- ✅ **Real-time calculation engine** - WBS roll-ups, cost breakdowns, and validation
- ✅ **Enhanced UI components** - BOE Overview and Details with comprehensive data display
- ✅ **Time Allocation System** - Complete time-based cost allocation functionality:
  - ✅ TimeAllocationManager with creation form and monthly breakdown preview
  - ✅ TimeAllocationSummary with variance analysis and visualization
  - ✅ TimeAllocationActions with ledger integration and locking
  - ✅ Complete time allocation API integration
  - ✅ Time allocation tab integrated into BOE page

### Phase 3: BOE Element Allocations & Advanced Features (Week 5-7)
**Tasks**: See [BOE System Tasks](../tasks/active/boe-system.md) for detailed task breakdown

#### Phase 3A: BOE Element Allocations (Week 5)
- **BOE Element Allocation System**: Bridge BOE WBS elements with monthly time allocations
- **Flexible Monthly Planning**: Monthly allocation planning with drag-and-drop reallocation
- **Allocation Management**: CRUD operations for element-level allocations
- **Quantity Tracking**: Support for both amount and quantity-based allocations

#### Phase 3B: Ledger Integration & Invoice Processing (Week 6)
- **Enhanced Invoice Processing**: Link invoices to specific ledger entries (created from allocations)
- **Ledger Entry Splitting**: Split ledger entries when invoices don't match planned quantities
- **Re-forecasting Tools**: Adjust planned amounts and dates based on actual invoice timing
- **Flexible Quantity Mapping**: Support for hardware quantities and contractor hours
- **Baseline vs. Planned Tracking**: Maintain baseline amounts from BOE while allowing planned amount adjustments
- **Audit Trail System**: Track individual changes and re-forecasting sessions

#### Phase 3C: Management Reserve & Reporting (Week 7)
- **Management Reserve calculation engine**
- **BOE versioning and approval workflow**
- **Enhanced reporting with allocation insights**
- **Cash flow projections based on allocation status**

### Phase 4: Integration & Testing (Week 7-8)
**Tasks**: See [BOE System Tasks](../tasks/active/boe-system.md) for detailed task breakdown
- Ledger system integration
- Performance optimization and testing
- User acceptance testing and refinement

## Testing Strategy
- [ ] **Unit Tests**
  - [ ] BOE calculation engine tests
  - [ ] Management Reserve calculation tests
  - [ ] API endpoint tests
  - [ ] Component tests for UI elements

- [ ] **Integration Tests**
  - [ ] BOE workflow integration tests
  - [ ] Ledger system integration tests
  - [ ] WBS template integration tests
  - [ ] Vendor system integration tests

- [ ] **User Acceptance Tests**
  - [ ] BOE creation workflow testing
  - [ ] Approval process testing
  - [ ] Export and reporting testing
  - [ ] Performance testing with large datasets

- [ ] **Performance Tests**
  - [ ] BOE calculation performance
  - [ ] Large WBS structure handling
  - [ ] Concurrent user testing
  - [ ] Database query optimization

## Success Criteria
- [ ] **Functional Requirements**
  - [ ] Users can create BOEs using templates and wizards
  - [ ] BOE calculations are accurate and real-time
  - [ ] Management Reserve is calculated automatically
  - [ ] Approval workflow functions correctly
  - [ ] BOE integrates seamlessly with ledger system

- [ ] **Performance Requirements**
  - [ ] BOE page loads in under 3 seconds
  - [ ] Calculations update in real-time (less than 500ms)
  - [ ] Supports BOEs with 1000+ line items
  - [ ] Concurrent users can work on different BOEs

- [ ] **User Experience Requirements**
  - [ ] Intuitive wizard-based BOE creation
  - [ ] Clear approval status indicators
  - [ ] Comprehensive error messages and validation
  - [ ] Mobile-responsive design

- [ ] **Integration Requirements**
  - [ ] Seamless integration with existing systems
  - [ ] Data consistency across all systems
  - [ ] Proper error handling and rollback
  - [ ] Audit trail for all changes

## Risk Assessment
- **Risk**: Complex approval workflow requirements - **Mitigation**: Start with simple workflow, iterate based on user feedback
- **Risk**: Performance issues with large BOEs - **Mitigation**: Implement pagination, lazy loading, and optimization from start
- **Risk**: Integration complexity with existing systems - **Mitigation**: Create comprehensive integration tests and fallback mechanisms
- **Risk**: User adoption of new workflow - **Mitigation**: Provide training materials and gradual rollout

## Technical Considerations

### Performance Optimization
- Implement virtual scrolling for large BOE lists
- Use React.memo and useMemo for expensive calculations
- Implement database indexing for BOE queries
- Add caching for frequently accessed BOE templates

### Security Considerations
- Implement role-based access control for BOE operations
- Add audit logging for all BOE changes
- Validate all user inputs and prevent injection attacks
- Implement proper session management for approvals

### Scalability Considerations
- Design for horizontal scaling of BOE calculations
- Implement queue system for background processing
- Use database partitioning for large BOE datasets
- Plan for multi-tenant architecture if needed

## Dependencies
- [ ] Existing ledger management system
- [ ] WBS template system
- [ ] Vendor management system
- [ ] Program management system
- [ ] Authentication and authorization system
- [ ] Notification system for approvals

## Notes
- This implementation builds on the existing ledger and program management systems
- The BOE system will serve as the foundation for the upcoming Risks & Opportunities system
- Consider implementing a preview mode for BOE changes before approval
- Plan for future integration with the Executive Management Dashboard

## Phase 1 & 2 Progress Summary ✅
**Last Updated**: January 27, 2025

### What Was Accomplished
- ✅ **Database Schema**: All 5 entities created with proper relationships
- ✅ **API Endpoints**: 7 core endpoints implemented and tested
- ✅ **Business Logic**: Calculation engine and validation rules working
- ✅ **Integration**: Successfully integrated with existing Program entity
- ✅ **Frontend Foundation**: Complete UI structure with tab navigation
- ✅ **State Management**: Zustand store with all BOE state and actions
- ✅ **API Service**: Complete frontend API service layer
- ✅ **Testing**: All endpoints tested with real data in Docker environment

### Key Features Implemented
- BOE template management with hierarchical structure
- BOE versioning with full CRUD operations
- Management Reserve calculations (5-15% industry standard)
- Approval workflow foundation
- Real-time cost calculations and totals
- Comprehensive validation and error handling
- **Frontend**: Complete tab-based UI with placeholder content
- **Styling**: Consistent Tailwind CSS matching Settings page design

### **Phase 2 COMPLETED Features**
- ✅ **Hierarchical WBS Editing**: Expandable/collapsible tree with parent-child relationships
- ✅ **Cost Category Integration**: Full integration with existing cost category system
- ✅ **Vendor Integration**: Complete vendor search and selection functionality
- ✅ **BOE to Ledger Integration**: "Push to Ledger" with confirmation dialogs and status updates
- ✅ **Real-time Calculation Engine**: WBS roll-ups, cost breakdowns, validation, and error handling
- ✅ **Enhanced UI Components**: BOE Overview with status indicators and BOE Details with comprehensive breakdowns
- ✅ **Time Allocation System**: Complete time-based cost allocation functionality:
  - ✅ TimeAllocationManager with creation form and monthly breakdown preview
  - ✅ TimeAllocationSummary with variance analysis and visualization
  - ✅ TimeAllocationActions with ledger integration and locking
  - ✅ Complete time allocation API integration
  - ✅ Time allocation tab integrated into BOE page

### Technical Achievements
- **Database**: 6 new tables with proper indexes and relationships
- **API**: RESTful endpoints with Swagger documentation
- **Business Logic**: Service layer with calculation engine
- **Frontend**: 7 React components with proper TypeScript types
- **State Management**: Zustand store with comprehensive state handling
- **Testing**: End-to-end testing in development environment
- **NEW**: BOECalculationService with real-time calculations and validation
- **NEW**: Enhanced BOEForm with hierarchical editing and search
- **NEW**: Enhanced BOEOverview with "Push to Ledger" functionality
- **NEW**: Enhanced BOEDetails with cost breakdowns and validation
- **NEW**: TimeAllocationManager with creation form and monthly breakdown preview
- **NEW**: TimeAllocationSummary with variance analysis and visualization
- **NEW**: TimeAllocationActions with ledger integration and locking
- **NEW**: Complete time allocation API integration
- **NEW**: Time allocation tab integrated into BOE page

### Next Steps
- **Phase 3**: Management Reserve & Advanced Features (approval workflow, versioning)
- **Phase 4**: Integration and optimization

---
*Created: [Current Date]*  
*Status: Phase 1 Complete - Phase 2 Partially Complete*  
*Next Step: Complete Phase 2 - Hierarchical WBS Editing & Integration* 