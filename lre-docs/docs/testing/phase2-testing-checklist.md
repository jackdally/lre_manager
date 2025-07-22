# Phase 2 Testing Checklist - BOE System

## Overview
This checklist covers the testing of Phase 2 BOE System functionality, including the newly implemented Time Allocation System.

## Prerequisites
- ✅ Docker containers running (`docker-compose -f docker/docker-compose.dev.yml up -d`)
- ✅ Frontend accessible at http://localhost:3000
- ✅ Backend API accessible at http://localhost:4000
- ✅ Database running and connected

## 1. Basic Navigation Testing

### 1.1 Application Access
- [ ] Navigate to http://localhost:3000
- [ ] Verify application loads without errors
- [ ] Check browser console for any JavaScript errors
- [ ] Verify navigation menu is functional

### 1.2 BOE Page Access
- [ ] Navigate to Programs section
- [ ] Select a program with BOE data (e.g., "NASA SBIR")
- [ ] Click on BOE tab/section
- [ ] Verify BOE page loads with tabs: Overview, Details, Time Allocations, Approval, History

## 2. Time Allocation System Testing (New Feature)

### 2.1 Time Allocations Tab
- [ ] Click on "Time Allocations" tab
- [ ] Verify tab content loads without errors
- [ ] Check for three main sections:
  - [ ] Time Allocation Manager (Create new allocations)
  - [ ] Time Allocation Summary (View existing allocations)
  - [ ] Time Allocation Actions (Manage allocations)

### 2.2 Time Allocation Manager Testing
- [ ] **Create New Allocation Form**:
  - [ ] Fill in allocation name (e.g., "Q1 Development")
  - [ ] Add description (e.g., "First quarter development activities")
  - [ ] Set total amount (e.g., 100000)
  - [ ] Select allocation type:
    - [ ] Test "Linear" allocation
    - [ ] Test "Front-Loaded" allocation
    - [ ] Test "Back-Loaded" allocation
    - [ ] Test "Custom" allocation
  - [ ] Set start date and end date
  - [ ] Verify monthly breakdown preview updates
  - [ ] Add notes, assumptions, and risks
  - [ ] Submit the form
  - [ ] Verify success message and form reset

### 2.3 Time Allocation Summary Testing
- [ ] **View Summary Data**:
  - [ ] Verify total allocations count displays
  - [ ] Check total amount vs allocated amount
  - [ ] Verify variance calculations
  - [ ] Test monthly breakdown visualization
  - [ ] Check variance indicators (green/red/yellow)
  - [ ] Verify allocation status indicators (locked/unlocked)

### 2.4 Time Allocation Actions Testing
- [ ] **Select Allocations**:
  - [ ] Check/uncheck allocation checkboxes
  - [ ] Verify bulk selection works
  - [ ] Test "Select All" functionality
- [ ] **Push to Ledger**:
  - [ ] Select one or more allocations
  - [ ] Click "Push to Ledger" button
  - [ ] Verify confirmation dialog appears
  - [ ] Confirm the action
  - [ ] Check for success message
- [ ] **Update Actuals**:
  - [ ] Select allocations with actual data
  - [ ] Click "Update Actuals" button
  - [ ] Verify data updates in summary
- [ ] **Lock/Unlock Allocations**:
  - [ ] Select allocations
  - [ ] Click "Lock" or "Unlock" button
  - [ ] Verify status changes in summary
- [ ] **Export Functionality**:
  - [ ] Click "Export" button
  - [ ] Verify export file downloads

## 3. Existing BOE Features Testing

### 3.1 BOE Overview Tab
- [ ] **View BOE Summary**:
  - [ ] Verify total estimated cost displays
  - [ ] Check management reserve amount
  - [ ] Verify WBS element count
  - [ ] Test cost breakdown visualization
  - [ ] Check approval status indicators

### 3.2 BOE Details Tab
- [ ] **WBS Structure**:
  - [ ] Verify hierarchical tree structure
  - [ ] Test expand/collapse functionality
  - [ ] Check parent-child relationships
  - [ ] Verify element codes and names
- [ ] **Cost Information**:
  - [ ] Check estimated costs per element
  - [ ] Verify cost category assignments
  - [ ] Test vendor assignments
  - [ ] Check variance calculations
- [ ] **Element Management**:
  - [ ] Test adding new elements
  - [ ] Verify editing existing elements
  - [ ] Check deletion functionality
  - [ ] Test drag-and-drop reordering

### 3.3 BOE Approval Tab
- [ ] **Approval Workflow**:
  - [ ] Verify approval levels display
  - [ ] Check approver information
  - [ ] Test submission functionality
  - [ ] Verify approval/rejection actions
  - [ ] Check approval history

### 3.4 BOE History Tab
- [ ] **Version History**:
  - [ ] Verify version list displays
  - [ ] Check version details
  - [ ] Test version comparison
  - [ ] Verify change summaries

## 4. Integration Testing

### 4.1 BOE to Ledger Integration
- [ ] **Push BOE to Ledger**:
  - [ ] Navigate to BOE Details
  - [ ] Click "Push to Ledger" button
  - [ ] Verify confirmation dialog
  - [ ] Check ledger entries created
  - [ ] Verify cost categories assigned
- [ ] **Time Allocation to Ledger**:
  - [ ] Create time allocation
  - [ ] Push to ledger from Time Allocations
  - [ ] Verify monthly ledger entries
  - [ ] Check baseline budget creation

### 4.2 WBS Template Integration
- [ ] **Import WBS Template**:
  - [ ] Navigate to BOE creation
  - [ ] Select WBS template
  - [ ] Verify template elements import
  - [ ] Check cost assignments
- [ ] **Export WBS to Program**:
  - [ ] Test WBS export functionality
  - [ ] Verify program WBS updates

## 5. Error Handling Testing

### 5.1 Form Validation
- [ ] **Required Fields**:
  - [ ] Submit forms with missing required fields
  - [ ] Verify validation messages appear
  - [ ] Check field highlighting
- [ ] **Data Validation**:
  - [ ] Test invalid date ranges
  - [ ] Verify negative amount validation
  - [ ] Check percentage validation
  - [ ] Test UUID format validation

### 5.2 API Error Handling
- [ ] **Network Errors**:
  - [ ] Disconnect network temporarily
  - [ ] Verify error messages display
  - [ ] Check retry functionality
- [ ] **Server Errors**:
  - [ ] Test with invalid program IDs
  - [ ] Verify 404/500 error handling
  - [ ] Check error message clarity

## 6. Performance Testing

### 6.1 Load Testing
- [ ] **Large Datasets**:
  - [ ] Test with programs having many WBS elements
  - [ ] Verify tree rendering performance
  - [ ] Check calculation speed
- [ ] **Multiple Allocations**:
  - [ ] Create 10+ time allocations
  - [ ] Verify summary performance
  - [ ] Check monthly breakdown rendering

### 6.2 Responsiveness
- [ ] **Mobile Testing**:
  - [ ] Test on mobile browser
  - [ ] Verify responsive design
  - [ ] Check touch interactions
- [ ] **Tablet Testing**:
  - [ ] Test on tablet browser
  - [ ] Verify layout adaptation

## 7. Browser Compatibility Testing

### 7.1 Browser Testing
- [ ] **Chrome**: Test all functionality
- [ ] **Firefox**: Test all functionality
- [ ] **Safari**: Test all functionality
- [ ] **Edge**: Test all functionality

### 7.2 Console Errors
- [ ] **JavaScript Errors**: Check browser console
- [ ] **Network Errors**: Monitor network tab
- [ ] **Performance Issues**: Check performance tab

## 8. Data Persistence Testing

### 8.1 Save/Load Testing
- [ ] **Create Data**: Create new allocations
- [ ] **Refresh Page**: Verify data persists
- [ ] **Navigate Away/Back**: Check data retention
- [ ] **Browser Restart**: Verify data still available

### 8.2 Database Consistency
- [ ] **Check Database**: Verify data in PostgreSQL
- [ ] **Data Integrity**: Check foreign key relationships
- [ ] **Transaction Rollback**: Test error scenarios

## Test Results Summary

### ✅ Passed Tests
- [ ] Infrastructure setup
- [ ] API endpoints
- [ ] Basic navigation
- [ ] Time Allocation creation
- [ ] Time Allocation summary display
- [ ] Time Allocation actions
- [ ] BOE overview functionality
- [ ] BOE details functionality
- [ ] Integration with ledger
- [ ] Error handling
- [ ] Performance
- [ ] Browser compatibility
- [ ] Data persistence

### ❌ Failed Tests
- [ ] List any failed tests here
- [ ] Document specific issues
- [ ] Note error messages

### 🔄 Incomplete Tests
- [ ] List any tests that couldn't be completed
- [ ] Note reasons for incompletion

## Recommendations

### For Production
- [ ] Add comprehensive unit tests
- [ ] Implement end-to-end testing
- [ ] Set up automated testing pipeline
- [ ] Add performance monitoring
- [ ] Implement error tracking

### For Development
- [ ] Add more detailed logging
- [ ] Implement better error messages
- [ ] Add loading states for all operations
- [ ] Improve form validation feedback

## Notes
- Test completed on: [Date]
- Tester: [Name]
- Environment: Docker Development
- Browser: [Browser and Version]
- Any additional notes or observations 