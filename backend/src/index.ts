import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './config/database';
import { programRouter } from './routes/program';
import { ledgerRouter } from './routes/ledger';
import { vendorRouter } from './routes/vendor';
import { currencyRouter } from './routes/currency';
import fiscalYearRouter from './routes/fiscalYear';

import wbsElementsRouter from './routes/wbsElements';
import { importRouter } from './routes/import';
import settingsRouter from './routes/settings';
import wbsReportingRouter from './routes/wbsReporting';
import costCategoriesRouter from './routes/costCategories';
import boeRouter from './routes/boe';
import boeTimeAllocationRouter from './routes/boeTimeAllocation';
import * as XLSX from 'xlsx';
import { Express } from 'express';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LRE Manager API',
      version: '1.0.0',
      description: 'API documentation for LRE Manager',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/programs', programRouter);
app.use('/api/programs', ledgerRouter);
app.use('/api/vendors', vendorRouter);
app.use('/api/currencies', currencyRouter);
app.use('/api/fiscal-years', fiscalYearRouter);

app.use('/api/programs', wbsElementsRouter);
app.use('/api/programs', wbsReportingRouter);
app.use('/api/import', importRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/cost-categories', costCategoriesRouter);
app.use('/api', boeRouter);
app.use('/api', boeTimeAllocationRouter);

// Dedicated endpoint for ledger template download
app.get('/api/ledger/template', (req, res) => {
  const headers = [
    'vendor_name',
    'expense_description',
    'wbsElementCode',
    'costCategoryCode',
    'baseline_date',
    'baseline_amount',
    'planned_date',
    'planned_amount',
    'actual_date',
    'actual_amount',
    'notes',
    'invoice_link_text',
    'invoice_link_url',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'LedgerTemplate');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="ledger_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(buffer);
});

// Debug: Print all registered routes
function printRoutes(app: Express) {
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) { // routes registered directly on the app
      routes.push(middleware.route);
    } else if (middleware.name === 'router') { // router middleware 
      middleware.handle.stack.forEach((handler: any) => {
        let route;
        route = handler.route;
        route && routes.push(route);
      });
    }
  });
  console.log('Registered routes:');
  routes.forEach(route => {
    const methods = Object.keys(route.methods).join(', ').toUpperCase();
    console.log(`${methods} ${route.path}`);
  });
}

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection established');
    printRoutes(app); // Print all routes after DB is ready
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  }); 