# Directory Structure Improvements

## Current Issues Analysis

### **Monolithic Components** 🚨
- `ActualsUploadPage.tsx` (83KB, 1877 lines) - Too large, handles multiple concerns
- `LedgerTable.tsx` (73KB, 1325 lines) - Complex table with many features
- `ProgramDashboard.tsx` (62KB, 1315 lines) - Dashboard with multiple widgets
- `ProgramDirectory.tsx` (37KB, 793 lines) - Program listing with complex logic

### **Backend Organization Issues** 🚨
- Missing middleware directory
- No utils/helpers directory
- No types directory
- Large service files (importService.ts: 43KB, 1155 lines)
- Routes contain business logic

### **Scripts Organization** ⚠️
- Mixed purposes (dev, prod, testing, data)
- No clear categorization
- Some scripts could be consolidated

## Recommended Structure

### **Frontend Structure** (`frontend/src/`)

```
src/
├── components/
│   ├── common/                    # Reusable UI components
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Table/
│   │   ├── Form/
│   │   └── Loading/
│   ├── layout/                    # Layout components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Navigation.tsx
│   ├── features/                  # Feature-based organization
│   │   ├── programs/
│   │   │   ├── ProgramDirectory/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── ProgramCard.tsx
│   │   │   │   ├── ProgramTable.tsx
│   │   │   │   └── ProgramForm.tsx
│   │   │   ├── ProgramDashboard/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── BudgetChart.tsx
│   │   │   │   ├── TimelineChart.tsx
│   │   │   │   └── SummaryCards.tsx
│   │   │   └── ProgramSettings/
│   │   │       ├── index.tsx
│   │   │       ├── GeneralSettings.tsx
│   │   │       └── WbsSettings.tsx
│   │   ├── ledger/
│   │   │   ├── LedgerPage/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── LedgerTable.tsx
│   │   │   │   ├── LedgerFilters.tsx
│   │   │   │   └── LedgerSummary.tsx
│   │   │   ├── LedgerEntry/
│   │   │   │   ├── EntryForm.tsx
│   │   │   │   └── EntryDetails.tsx
│   │   │   └── BulkImport/
│   │   │       ├── BulkImportModal.tsx
│   │   │       ├── TemplateDownload.tsx
│   │   │       └── ImportProgress.tsx
│   │   └── actuals/
│   │       ├── ActualsUploadPage/
│   │       │   ├── index.tsx
│   │       │   ├── FileUpload.tsx
│   │       │   ├── UploadConfig.tsx
│   │       │   └── UploadProgress.tsx
│   │       ├── TransactionMatchModal/
│   │       │   ├── index.tsx
│   │       │   ├── MatchList.tsx
│   │       │   └── MatchDetails.tsx
│   │       └── UploadSessionDetails/
│   │           ├── index.tsx
│   │           ├── SessionSummary.tsx
│   │           └── TransactionList.tsx
│   └── pages/                     # Page-level components
│       ├── HomePage.tsx
│       ├── NotFoundPage.tsx
│       └── ErrorPage.tsx
├── hooks/                         # Custom React hooks
│   ├── useApi.ts
│   ├── usePrograms.ts
│   ├── useLedger.ts
│   ├── useActuals.ts
│   └── useAuth.ts
├── services/                      # API service layer
│   ├── api.ts
│   ├── programs.ts
│   ├── ledger.ts
│   └── actuals.ts
├── utils/                         # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   ├── constants.ts
│   └── helpers.ts
├── types/                         # TypeScript type definitions
│   ├── api.ts
│   ├── programs.ts
│   ├── ledger.ts
│   └── actuals.ts
├── styles/                        # Global styles
│   ├── globals.css
│   ├── components.css
│   └── variables.css
├── assets/                        # Static assets
│   ├── images/
│   └── icons/
├── context/                       # React context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── App.tsx
├── index.tsx
└── index.css
```

### **Backend Structure** (`backend/src/`)

```
src/
├── controllers/                   # Request handlers
│   ├── programController.ts
│   ├── ledgerController.ts
│   ├── actualsController.ts
│   └── wbsController.ts
├── services/                      # Business logic
│   ├── programService.ts
│   ├── ledgerService.ts
│   ├── actualsService.ts
│   ├── wbsService.ts
│   └── cacheService.ts
├── routes/                        # Route definitions
│   ├── programRoutes.ts
│   ├── ledgerRoutes.ts
│   ├── actualsRoutes.ts
│   ├── wbsRoutes.ts
│   └── healthRoutes.ts
├── middleware/                    # Express middleware
│   ├── auth.ts
│   ├── validation.ts
│   ├── errorHandler.ts
│   ├── security.ts
│   ├── logging.ts
│   └── rateLimit.ts
├── entities/                      # TypeORM entities
│   ├── Program.ts
│   ├── LedgerEntry.ts
│   ├── ImportSession.ts
│   ├── ImportTransaction.ts
│   ├── WbsCategory.ts
│   └── WbsSubcategory.ts
├── repositories/                  # Custom repositories
│   ├── ProgramRepository.ts
│   ├── LedgerRepository.ts
│   └── ActualsRepository.ts
├── utils/                         # Utility functions
│   ├── logger.ts
│   ├── validators.ts
│   ├── formatters.ts
│   └── helpers.ts
├── types/                         # TypeScript types
│   ├── api.ts
│   ├── entities.ts
│   └── middleware.ts
├── config/                        # Configuration
│   ├── database.ts
│   ├── app.ts
│   └── environment.ts
├── migrations/                    # Database migrations
├── seeds/                         # Database seeds
├── tests/                         # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── index.ts
```

### **Scripts Organization** (`scripts/`)

```
scripts/
├── development/                   # Development scripts
│   ├── setup-dev.sh
│   ├── start-dev.sh
│   └── clean-dev.sh
├── production/                    # Production scripts
│   ├── setup-prod.sh
│   ├── deploy.sh
│   └── backup.sh
├── database/                      # Database scripts
│   ├── reset.sh
│   ├── backup.sh
│   ├── migrate.sh
│   └── seed.sh
├── testing/                       # Testing scripts
│   ├── test-all.sh
│   ├── test-unit.sh
│   └── test-e2e.sh
├── maintenance/                   # Maintenance scripts
│   ├── clean-uploads.sh
│   ├── cleanup.sh
│   └── health-check.sh
└── utils/                         # Utility scripts
    ├── check-requirements.sh
    └── manage-containers.sh
```

## Implementation Plan

### **Phase 1: Backend Reorganization (Week 1)**

 - **Create Missing Directories**
   ```bash
   mkdir -p backend/src/{controllers,repositories,middleware,utils,types,migrations,seeds,tests/{unit,integration,e2e}}
   ```

 - **Extract Controllers from Routes**
   - Move business logic from routes to controllers
   - Keep routes focused on HTTP concerns

 - **Create Middleware**
   - Move validation logic to middleware
   - Create reusable middleware functions

 - **Organize Services**
   - Split large services into smaller, focused services
   - Create service interfaces

### **Phase 2: Frontend Reorganization (Week 2)**

 - **Create Feature-based Structure**
   ```bash
   mkdir -p frontend/src/{components/{common,layout,features,pages},hooks,services,utils,types,context}
   ```

 - **Break Down Large Components**
   - Split `ActualsUploadPage.tsx` into smaller components
   - Extract reusable UI components
   - Create custom hooks for complex logic

 - **Create Service Layer**
   - Move API calls to service files
   - Create type-safe API interfaces

 - **Add Custom Hooks**
   - Extract reusable logic into hooks
   - Create hooks for data fetching

### **Phase 3: Scripts Reorganization (Week 3)**

 - **Categorize Scripts**
   ```bash
   mkdir -p scripts/{development,production,database,testing,maintenance,utils}
   ```

 - **Move Scripts to Appropriate Categories**
   - Development scripts to `development/`
   - Production scripts to `production/`
   - Database scripts to `database/`

 - **Create Script Index**
   - Add README files in each category
   - Document script purposes and usage

## Benefits of This Structure

### **1. Scalability**
- Easy to add new features
- Clear separation of concerns
- Modular architecture

### **2. Maintainability**
- Smaller, focused files
- Clear file locations
- Reduced cognitive load

### **3. Team Collaboration**
- Clear ownership boundaries
- Easier code reviews
- Reduced merge conflicts

### **4. Testing**
- Easier to write unit tests
- Clear test organization
- Better test coverage

### **5. Performance**
- Better code splitting
- Lazy loading opportunities
- Reduced bundle sizes

## Migration Strategy

### **Step 1: Create New Structure**
```bash
# Create new directories
mkdir -p backend/src/{controllers,repositories,middleware,utils,types}
mkdir -p frontend/src/{components/{common,layout,features,pages},hooks,services,utils,types}
mkdir -p scripts/{development,production,database,testing,maintenance,utils}
```

### **Step 2: Move Files Gradually**
- Start with one feature at a time
- Update imports as you go
- Test thoroughly after each move

### **Step 3: Update Imports**
- Use search and replace to update import paths
- Update TypeScript paths if needed
- Update build configurations

### **Step 4: Clean Up**
- Remove old directories
- Update documentation
- Update CI/CD configurations

## Tools to Help with Migration

### **1. TypeScript Path Mapping**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

### **2. ESLint Rules**
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always'
      }
    ]
  }
};
```

### **3. Prettier Configuration**
```json
// .prettierrc
{
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

This reorganization will significantly improve your codebase's maintainability, scalability, and team collaboration while making it easier to implement the production readiness improvements we discussed earlier. 