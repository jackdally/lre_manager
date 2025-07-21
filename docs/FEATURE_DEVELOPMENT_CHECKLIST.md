# Feature Development Session Checklist

## Pre-Session Setup

### **Required Context Files**
Before starting any feature development session, ensure these files are attached or referenced:

#### **1. Project Standards & Process**
- [ ] `README.md` - Project overview and setup
- [ ] `docs/FEATURES.md` - High-level feature roadmap and status
- [ ] `docs/PROJECT_MANAGEMENT.md` - Development workflow and process
- [ ] `docs/TASK_MANAGEMENT_SUMMARY.md` - Task organization structure

#### **2. Current Task Management**
- [ ] `docs/tasks/README.md` - Task management overview and conventions
- [ ] `docs/tasks/active/` - Current active tasks by category
- [ ] `docs/tasks/completed/` - Reference for completed feature patterns

#### **3. Implementation Templates**
- [ ] `docs/implementation-plans/README.md` - Implementation plan structure
- [ ] `docs/implementation-plans/user-preferences.md` - Example active implementation plan
- [ ] `docs/implementation-plans/archive/2025/Q3/` - Reference completed implementation plans

#### **4. Development Scripts**
- [ ] `scripts/task-management.sh` - Task management helper script
- [ ] `scripts/archive-implementation.sh` - Implementation archiving script

## Feature Development Process

### **Phase 1: Planning & Setup**

#### **1.1 Feature Definition**
- [ ] Update `docs/FEATURES.md` - Add/expand feature details under appropriate section
- [ ] Determine feature priority and timeline
- [ ] Identify dependencies and blockers

#### **1.2 Implementation Planning**
- [ ] Create implementation plan in `docs/implementation-plans/`
  - [ ] Follow the established template structure
  - [ ] Include overview, requirements, architecture, phases, testing, success criteria
  - [ ] Add technical specifications (DB schema, API endpoints, Frontend interfaces)
  - [ ] Include risk assessment and mitigation strategies

#### **1.3 Task Organization**
- [ ] Create task file in `docs/tasks/active/`
  - [ ] Use naming convention: `feature-name.md`
  - [ ] Follow established task structure (Backend, Frontend, Integration, Testing)
  - [ ] Include task numbering convention (FEATURE-XXX format)
  - [ ] Add priority, dependencies, and estimated completion
- [ ] Update `docs/tasks/README.md` with new task file reference

#### **1.4 Documentation Updates**
- [ ] Update `docs/implementation-plans/README.md` with new active plan
- [ ] Update main `README.md` if new documentation sections are added

### **Phase 2: Development**

#### **2.1 Code Implementation**
- [ ] Follow implementation plan technical specifications
- [ ] Create/update backend models, API endpoints, and validation
- [ ] Create/update frontend components, stores, and interfaces
- [ ] Implement integration points with existing systems

#### **2.2 Task Status Updates**
- [ ] Update task status as work progresses:
  - [ ] `[ ]` - Not started
  - [ ] `[~]` - In progress
  - [ ] `[x]` - Completed
  - [ ] `[BLOCKED]` - Blocked by external dependency
- [ ] Move tasks between sections as needed (e.g., "In Progress" to "Completed")
- [ ] Add notes about blockers, dependencies, or important decisions

#### **2.3 Documentation Maintenance**
- [ ] Update implementation plan with progress notes
- [ ] Update API documentation if new endpoints are added
- [ ] Update user guides if UI changes affect user workflow
- [ ] Update architecture documentation if system changes occur

### **Phase 3: Testing & Validation**

#### **3.1 Testing Implementation**
- [ ] Write unit tests for new functionality
- [ ] Create integration tests for API endpoints
- [ ] Perform user acceptance testing
- [ ] Test error handling and edge cases

#### **3.2 Task Completion**
- [ ] Mark all tasks as completed `[x]`
- [ ] Add completion notes and final status
- [ ] Update implementation plan with final status

### **Phase 4: Completion & Archiving**

#### **4.1 Feature Completion**
- [ ] Update `docs/FEATURES.md` - Mark feature as completed ✅
- [ ] Add completion date and final notes
- [ ] Update any related documentation

#### **4.2 Implementation Plan Archiving**
- [ ] Use archiving script: `./scripts/archive-implementation.sh <feature-name> <completion-date> <effort-weeks>`
- [ ] Verify implementation plan is moved to correct archive directory
- [ ] Update `docs/implementation-plans/README.md` to reflect archived status

#### **4.3 Task File Archiving**
- [ ] Use task management script: `./scripts/task-management.sh archive <feature-name>`
- [ ] Verify task file is moved from `active/` to `completed/`
- [ ] Update `docs/tasks/README.md` to reflect archived status

#### **4.4 Final Documentation Updates**
- [ ] Update `docs/tasks/README.md` with new statistics
- [ ] Update main `README.md` if project structure changed
- [ ] Commit all changes with descriptive commit messages

## Quick Reference Commands

### **Task Management**
```bash
# List all active tasks
./scripts/task-management.sh list

# Create new feature task file
./scripts/task-management.sh create-feature <feature-name>

# Archive completed feature
./scripts/task-management.sh archive <feature-name>

# Show task statistics
./scripts/task-management.sh stats
```

### **Implementation Plan Management**
```bash
# Archive completed implementation plan
./scripts/archive-implementation.sh <feature-name> <completion-date> <effort-weeks>
```

## Consistency Checklist

### **File Naming Conventions**
- [ ] Feature names use kebab-case (e.g., `user-preferences.md`)
- [ ] Task numbering uses FEATURE-XXX format (e.g., `UP-001`)
- [ ] Implementation plans use same naming as task files
- [ ] Archive directories follow YYYY/Q# structure

### **Documentation Standards**
- [ ] All files include "Last updated" timestamps
- [ ] Implementation plans follow established template
- [ ] Task files include priority, dependencies, and estimates
- [ ] Completed features include post-implementation metrics

### **Process Compliance**
- [ ] Feature planning starts with `docs/FEATURES.md` update
- [ ] Implementation plans created before development begins
- [ ] Task files created and maintained throughout development
- [ ] Archiving process followed for completed features
- [ ] All documentation updated consistently

## Session Success Criteria

A successful feature development session should result in:

- [ ] Feature properly defined in `docs/FEATURES.md`
- [ ] Implementation plan created and maintained
- [ ] Task file created and updated throughout development
- [ ] All tasks completed and archived
- [ ] Implementation plan archived with completion details
- [ ] Documentation updated and consistent
- [ ] Project structure maintained and organized

## Troubleshooting

### **Common Issues**
- **Missing context files**: Ensure all required files are attached/referenced
- **Inconsistent naming**: Follow established naming conventions
- **Incomplete archiving**: Use provided scripts for consistent archiving
- **Documentation drift**: Update documentation as development progresses

### **Getting Help**
- Reference `docs/PROJECT_MANAGEMENT.md` for workflow details
- Use `docs/TASK_MANAGEMENT_SUMMARY.md` for task organization guidance
- Check completed features in archive for examples and patterns

---
*Last updated: [Current Date]* 