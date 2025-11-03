import express from 'express';
import { AppDataSource } from '../config/database';
import { Vendor } from '../entities/Vendor';
import { vendorSchema, vendorUploadSchema } from '../utils/validators';
import * as XLSX from 'xlsx';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs';

const router = express.Router();
const upload = multer({ dest: '/tmp' });

// Get all vendors with search and filtering
router.get('/', async (req, res) => {
  try {
    const { search = '', isActive, page = 1, limit = 50 } = req.query;
    const vendorRepo = AppDataSource.getRepository(Vendor);

    const queryBuilder = vendorRepo.createQueryBuilder('vendor');

    // Add search filter
    if (search && typeof search === 'string') {
      queryBuilder.andWhere('vendor.name ILIKE :search', { search: `%${search}%` });
    }

    // Add active filter
    if (isActive !== undefined) {
      const active = isActive === 'true';
      queryBuilder.andWhere('vendor.isActive = :isActive', { isActive: active });
    }

    // Add pagination
    const skip = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(skip).take(Number(limit));

    // Add ordering
    queryBuilder.orderBy('vendor.name', 'ASC');

    const [vendors, total] = await queryBuilder.getManyAndCount();

    res.json({
      vendors,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get active vendors only (for dropdowns)
router.get('/active', async (req, res) => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendors = await vendorRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });

    res.json(vendors);
  } catch (error) {
    console.error('Error fetching active vendors:', error);
    res.status(500).json({ error: 'Failed to fetch active vendors' });
  }
});

// Get vendor by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOneBy({ id });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// Create new vendor
router.post('/', async (req, res) => {
  try {
    const { error, value } = vendorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const vendorRepo = AppDataSource.getRepository(Vendor);

    // Check for duplicate vendor name
    const existingVendor = await vendorRepo.findOne({
      where: { name: value.name }
    });

    if (existingVendor) {
      return res.status(409).json({ error: 'Vendor with this name already exists' });
    }

    const vendor = vendorRepo.create(value);
    const savedVendor = await vendorRepo.save(vendor);

    res.status(201).json(savedVendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// Update vendor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = vendorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOneBy({ id });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Check for duplicate vendor name (excluding current vendor)
    if (value.name !== vendor.name) {
      const existingVendor = await vendorRepo.findOne({
        where: { name: value.name }
      });

      if (existingVendor) {
        return res.status(409).json({ error: 'Vendor with this name already exists' });
      }
    }

    Object.assign(vendor, value);
    const updatedVendor = await vendorRepo.save(vendor);

    res.json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// Delete vendor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOneBy({ id });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Check if vendor is used in ledger entries
    const ledgerRepo = AppDataSource.getRepository(require('../entities/LedgerEntry').LedgerEntry);
    const ledgerCount = await ledgerRepo.count({
      where: { vendorId: id }
    });

    if (ledgerCount > 0) {
      return res.status(400).json({
        error: `Cannot delete vendor. It is used in ${ledgerCount} ledger entries.`
      });
    }

    await vendorRepo.remove(vendor);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// Upload vendors from file (CSV/Excel)
router.post('/upload', upload.single('file'), async (req: express.Request & { file?: any }, res) => {
  let filePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;

    // Validate file extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      return res.status(400).json({ error: 'Unsupported file type. Please upload Excel or CSV files.' });
    }

    // Validate request body with defaults
    const { error, value } = vendorUploadSchema.validate(req.body || {});
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Use default column name if not provided
    const vendorNameColumn = value.vendorNameColumn || 'Vendor Name';

    if (!filePath) {
      return res.status(400).json({ error: 'File path is missing' });
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const results = {
      total: rows.length,
      created: 0,
      skipped: 0,
      errors: 0,
      errorsList: [] as string[]
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const vendorName = row[vendorNameColumn]?.toString().trim();

        if (!vendorName) {
          results.errors++;
          results.errorsList.push(`Row ${i + 2}: Empty vendor name`); // +2 because row 0 is header, rows start at 1
          continue;
        }

        // Check for existing vendor
        const existingVendor = await vendorRepo.findOne({
          where: { name: vendorName }
        });

        if (existingVendor) {
          results.skipped++;
          continue;
        }

        // Create new vendor
        const vendor = vendorRepo.create({
          name: vendorName,
          isActive: true
        });

        await vendorRepo.save(vendor);
        results.created++;

      } catch (error) {
        results.errors++;
        results.errorsList.push(`Row ${i + 2}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Format response to match frontend expectations
    const message = `Uploaded ${results.created} vendor(s). ${results.skipped} skipped, ${results.errors} error(s).`;
    res.json({
      message,
      count: results.created,
      total: results.total,
      skipped: results.skipped,
      errors: results.errors,
      errorsList: results.errorsList
    });
  } catch (error) {
    console.error('Error uploading vendors:', error);
    res.status(500).json({ error: 'Failed to upload vendors', details: error instanceof Error ? error.message : String(error) });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
  }
});

// Import vendors from NetSuite
router.post('/import-netsuite', async (req, res) => {
  try {
    const {
      netsuiteUrl,
      netsuiteAccountId,
      netsuiteConsumerKey,
      netsuiteConsumerSecret,
      netsuiteTokenId,
      netsuiteTokenSecret
    } = req.body;

    if (!netsuiteUrl || !netsuiteAccountId || !netsuiteConsumerKey ||
      !netsuiteConsumerSecret || !netsuiteTokenId || !netsuiteTokenSecret) {
      return res.status(400).json({
        error: 'All NetSuite credentials are required'
      });
    }

    // NetSuite REST API call to get vendors
    const auth = Buffer.from(`${netsuiteConsumerKey}:${netsuiteConsumerSecret}`).toString('base64');
    const token = Buffer.from(`${netsuiteTokenId}:${netsuiteTokenSecret}`).toString('base64');

    const response = await axios.get(`${netsuiteUrl}/rest/platform/v1/record/vendor`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-NetSuite-Account': netsuiteAccountId
      },
      params: {
        limit: 1000,
        offset: 0
      }
    });

    const responseData = response.data as { records?: any[] };
    const vendors = responseData.records || [];
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const results = {
      total: vendors.length,
      created: 0,
      skipped: 0,
      errors: 0,
      errorsList: [] as string[]
    };

    for (const netsuiteVendor of vendors) {
      try {
        const vendorName = netsuiteVendor.entityid || netsuiteVendor.companyname;

        if (!vendorName) {
          results.errors++;
          results.errorsList.push(`Vendor ${netsuiteVendor.id}: No name found`);
          continue;
        }

        // Check for existing vendor
        const existingVendor = await vendorRepo.findOne({
          where: { name: vendorName }
        });

        if (existingVendor) {
          results.skipped++;
          continue;
        }

        // Create new vendor
        const vendor = vendorRepo.create({
          name: vendorName,
          isActive: netsuiteVendor.isinactive !== 'T'
        });

        await vendorRepo.save(vendor);
        results.created++;

      } catch (error) {
        results.errors++;
        results.errorsList.push(`Vendor ${netsuiteVendor.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error importing vendors from NetSuite:', error);
    res.status(500).json({
      error: 'Failed to import vendors from NetSuite',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get vendor upload template
router.get('/template/download', (req, res) => {
  try {
    const template = [
      { 'Vendor Name': 'Acme Corporation' },
      { 'Vendor Name': 'Tech Solutions Inc' },
      { 'Vendor Name': 'Global Services LLC' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendors');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=vendor_upload_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating vendor template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

export { router as vendorRouter }; 