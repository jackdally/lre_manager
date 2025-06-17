import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './config/database';
import { programRouter } from './routes/program';
import { ledgerRouter } from './routes/ledger';
import { wbsRouter } from './routes/wbs';
import * as XLSX from 'xlsx';

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
app.use('/api/programs', wbsRouter);

// Dedicated endpoint for ledger template download
app.get('/api/ledger/template', (req, res) => {
  const headers = [
    'vendor_name',
    'expense_description',
    'wbs_category',
    'wbs_subcategory',
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
  res.send(buffer);
});

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection established');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  }); 