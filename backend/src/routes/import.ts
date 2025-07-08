import { Router, Request } from 'express';
import { ImportService, ImportConfig } from '../services/importService';
import { AppDataSource } from '../config/database';
import { ImportConfig as ImportConfigEntity } from '../entities/ImportConfig';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import { PotentialMatch } from '../entities/PotentialMatch';
import { In } from 'typeorm';
import { ImportStatus } from '../entities/ImportSession';

const router = Router();
const importService = new ImportService();
const importConfigRepo = AppDataSource.getRepository(ImportConfigEntity);
const upload = multer({ dest: '/tmp' });

// Upload and process NetSuite file
router.post('/:programId/upload', upload.single('file'), async (req: Request & { file?: any }, res) => {
  try {
    const { programId } = req.params;
    const { description, config } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      return res.status(400).json({ error: 'Unsupported file type. Please upload Excel or CSV files.' });
    }

    // Parse config from request body
    const importConfig: ImportConfig = JSON.parse(config);

    // Create import session
    const session = await importService.createImportSession(
      req.file.path,
      req.file.originalname,
      description || 'NetSuite Actuals Upload',
      programId,
      importConfig
    );

    // Process the file
    const result = await importService.processNetSuiteFile(session.id);

    res.json({
      sessionId: session.id,
      ...result
    });

  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: error.message || 'Import failed',
      details: error.stack 
    });
  }
});

// Replace existing upload with new file
router.post('/:programId/replace-upload', upload.single('file'), async (req: Request & { file?: any }, res) => {
  try {
    const { programId } = req.params;
    const { 
      replaceSessionId, 
      description, 
      config,
      preserveConfirmedMatches = true,
      preserveAllMatches = false,
      forceReplace = false
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!replaceSessionId) {
      return res.status(400).json({ error: 'Replace session ID is required' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      return res.status(400).json({ error: 'Unsupported file type. Please upload Excel or CSV files.' });
    }

    // Parse config from request body
    const importConfig: ImportConfig = JSON.parse(config);

    // Replace the existing session
    const result = await importService.replaceImportSession(
      replaceSessionId,
      req.file.path,
      req.file.originalname,
      description || 'NetSuite Actuals Upload (Replacement)',
      programId,
      importConfig,
      {
        preserveConfirmedMatches: preserveConfirmedMatches === 'true' || preserveConfirmedMatches === true,
        preserveAllMatches: preserveAllMatches === 'true' || preserveAllMatches === true,
        forceReplace: forceReplace === 'true' || forceReplace === true
      }
    );

    res.json(result);

  } catch (error: any) {
    console.error('Replace upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Replace upload failed',
      details: error.stack 
    });
  }
});

// Get import sessions for a program
router.get('/:programId/sessions', async (req, res) => {
  try {
    const { programId } = req.params;
    const sessions = await importService.getImportSessions(programId);
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch import sessions' });
  }
});

// Get import session details
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await importService.getImportSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Import session not found' });
    }

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch import session' });
  }
});

// Get transactions for an import session
router.get('/session/:sessionId/transactions', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const transactions = await importService.getImportTransactions(sessionId);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// Confirm a match between transaction and ledger entry
router.post('/transaction/:transactionId/confirm-match', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { ledgerEntryId } = req.body;

    console.log('[CONFIRM MATCH] Received request:', { transactionId, ledgerEntryId });

    if (!ledgerEntryId) {
      console.log('[CONFIRM MATCH] Error: Ledger entry ID is required');
      return res.status(400).json({ error: 'Ledger entry ID is required' });
    }

    await importService.confirmMatch(transactionId, ledgerEntryId);
    console.log('[CONFIRM MATCH] Successfully confirmed match');
    res.json({ message: 'Match confirmed successfully' });
  } catch (error: any) {
    console.error('[CONFIRM MATCH] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm match' });
  }
});

// Add unmatched transaction to ledger as unplanned expense
router.post('/transaction/:transactionId/add-to-ledger', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { wbsCategory, wbsSubcategory } = req.body;

    if (!wbsCategory || !wbsSubcategory) {
      return res.status(400).json({ error: 'WBS category and subcategory are required' });
    }

    await importService.addUnmatchedToLedger(transactionId, wbsCategory, wbsSubcategory);
    res.json({ message: 'Transaction added to ledger successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add transaction to ledger' });
  }
});

// Save import configuration
router.post('/:programId/config', async (req, res) => {
  try {
    const { programId } = req.params;
    const { name, description, columnMapping, isDefault = false, isGlobal = false } = req.body;

    if (!name || !columnMapping) {
      return res.status(400).json({ error: 'Name and column mapping are required' });
    }

    // If this is being set as default, unset any existing default for this program
    if (isDefault && !isGlobal) {
      await importConfigRepo.update(
        { program: { id: programId }, isDefault: true },
        { isDefault: false }
      );
    }

    // If this is being set as global default, unset any existing global default
    if (isDefault && isGlobal) {
      await importConfigRepo.update(
        { isGlobal: true, isDefault: true },
        { isDefault: false }
      );
    }

    const config = importConfigRepo.create({
      name,
      description: description || '',
      columnMapping,
      isDefault,
      isGlobal,
      program: isGlobal ? null : { id: programId }
    });

    const savedConfig = await importConfigRepo.save(config);
    res.status(201).json(savedConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save configuration' });
  }
});

// Get saved configurations for a program (including global configs)
router.get('/:programId/config', async (req, res) => {
  try {
    const { programId } = req.params;
    
    // Get both program-specific and global configurations
    const [programConfigs, globalConfigs] = await Promise.all([
      importConfigRepo.find({
        where: { program: { id: programId }, isGlobal: false },
        order: { isDefault: 'DESC', name: 'ASC' }
      }),
      importConfigRepo.find({
        where: { isGlobal: true },
        order: { isDefault: 'DESC', name: 'ASC' }
      })
    ]);

    // Combine and mark global configs
    const allConfigs = [
      ...programConfigs,
      ...globalConfigs.map(config => ({ ...config, isGlobal: true }))
    ];

    res.json(allConfigs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch configurations' });
  }
});

// Get all global configurations
router.get('/config/global', async (req, res) => {
  try {
    const globalConfigs = await importConfigRepo.find({
      where: { isGlobal: true },
      order: { isDefault: 'DESC', name: 'ASC' }
    });
    res.json(globalConfigs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch global configurations' });
  }
});

// Copy configuration to another program
router.post('/config/:configId/copy', async (req, res) => {
  try {
    const { configId } = req.params;
    const { targetProgramId, name, description, isDefault = false } = req.body;

    if (!targetProgramId) {
      return res.status(400).json({ error: 'Target program ID is required' });
    }

    // Get the source configuration
    const sourceConfig = await importConfigRepo.findOne({
      where: { id: configId },
      relations: ['program']
    });

    if (!sourceConfig) {
      return res.status(404).json({ error: 'Source configuration not found' });
    }

    // If setting as default, unset existing default for target program
    if (isDefault) {
      await importConfigRepo.update(
        { program: { id: targetProgramId }, isDefault: true },
        { isDefault: false }
      );
    }

    // Create the copied configuration
    const copiedConfig = importConfigRepo.create({
      name: name || `${sourceConfig.name} (Copy)`,
      description: description || sourceConfig.description,
      columnMapping: sourceConfig.columnMapping,
      isDefault,
      isGlobal: false, // Copied configs are always program-specific
      program: { id: targetProgramId }
    });

    const savedConfig = await importConfigRepo.save(copiedConfig);
    res.status(201).json(savedConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to copy configuration' });
  }
});

// Get a specific configuration
router.get('/config/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const config = await importConfigRepo.findOne({
      where: { id: configId },
      relations: ['program']
    });

    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch configuration' });
  }
});

// Update a configuration
router.put('/config/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const { name, description, columnMapping, isDefault = false, isGlobal = false } = req.body;

    const config = await importConfigRepo.findOne({
      where: { id: configId },
      relations: ['program']
    });

    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Handle default configuration updates
    if (isDefault && isGlobal) {
      // Unset any existing global default
      await importConfigRepo.update(
        { isGlobal: true, isDefault: true },
        { isDefault: false }
      );
    } else if (isDefault && !isGlobal && config.program) {
      // Unset any existing default for this program
      await importConfigRepo.update(
        { program: { id: config.program.id }, isDefault: true },
        { isDefault: false }
      );
    }

    config.name = name || config.name;
    config.description = description || config.description;
    config.columnMapping = columnMapping || config.columnMapping;
    config.isDefault = isDefault;
    config.isGlobal = isGlobal;

    const updatedConfig = await importConfigRepo.save(config);
    res.json(updatedConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update configuration' });
  }
});

// Delete a configuration
router.delete('/config/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const config = await importConfigRepo.findOneBy({ id: configId });

    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    await importConfigRepo.remove(config);
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete configuration' });
  }
});

// Get NetSuite import template
router.get('/template/netsuite', (req, res) => {
  const template = {
    description: 'NetSuite Export Template',
    columns: {
      programCodeColumn: 'Program Code',
      vendorColumn: 'Vendor Name',
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
      dateColumn: 'Transaction Date',
      categoryColumn: 'Category',
      subcategoryColumn: 'Subcategory',
      invoiceColumn: 'Invoice Number',
      referenceColumn: 'Reference Number'
    },
    sampleData: [
      {
        'Program Code': 'PROG001',
        'Vendor Name': 'ABC Supplies Inc',
        'Description': 'Office supplies for Q1',
        'Amount': '1250.00',
        'Transaction Date': '2024-01-15',
        'Category': 'Supplies',
        'Subcategory': 'Office',
        'Invoice Number': 'INV-2024-001',
        'Reference Number': 'REF-001'
      }
    ]
  };

  res.json(template);
});

// Clear all import data for a program
router.delete('/:programId/clear-all', async (req, res) => {
  try {
    const { programId } = req.params;
    
    // Import the repositories properly
    const ImportSession = require('../entities/ImportSession').ImportSession;
    const ImportTransaction = require('../entities/ImportTransaction').ImportTransaction;
    const PotentialMatch = require('../entities/PotentialMatch').PotentialMatch;
    const RejectedMatch = require('../entities/RejectedMatch').RejectedMatch;
    
    const sessionRepo = AppDataSource.getRepository(ImportSession);
    const transactionRepo = AppDataSource.getRepository(ImportTransaction);
    const potentialMatchRepo = AppDataSource.getRepository(PotentialMatch);
    const rejectedMatchRepo = AppDataSource.getRepository(RejectedMatch);
    
    // Get all sessions for this program
    const sessions = await sessionRepo.find({ 
      where: { program: { id: programId } },
      relations: ['program']
    });

    let deletedSessions = 0;
    let deletedFiles = 0;

    for (const session of sessions) {
      // Delete the uploaded file
      if (fs.existsSync(session.filename)) {
        fs.unlinkSync(session.filename);
        deletedFiles++;
      }
      
      // Get all transaction IDs for this session
      const transactions = await transactionRepo.find({
        where: { importSession: { id: session.id } },
        select: ['id']
      });
      const transactionIds = transactions.map(t => t.id);
      
      if (transactionIds.length > 0) {
        // Delete all potential matches for these transactions
        await potentialMatchRepo.delete({
          transaction: { id: In(transactionIds) }
        });
        
        // Delete all rejected matches for these transactions
        await rejectedMatchRepo.delete({
          transaction: { id: In(transactionIds) }
        });
      }
      
      // Delete all transactions for this session
      await transactionRepo.delete({ importSession: { id: session.id } });
      
      // Delete the session itself
      await sessionRepo.delete({ id: session.id });
      deletedSessions++;
    }

    res.json({ 
      message: `Cleared all import data for program ${programId}`,
      deletedSessions,
      deletedFiles
    });
  } catch (error: any) {
    console.error('Clear all import data error:', error);
    res.status(500).json({ error: error.message || 'Failed to clear import data' });
  }
});

// Clean up import session and files
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await importService.getImportSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Import session not found' });
    }

    // Delete the uploaded file
    if (fs.existsSync(session.filename)) {
      fs.unlinkSync(session.filename);
    }

    // Note: In a production environment, you might want to soft delete the session
    // instead of hard deleting it for audit purposes
    
    res.json({ message: 'Import session deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete import session' });
  }
});

// Get session details
router.get('/session/:id/details', async (req, res) => {
  const { id } = req.params;
  try {
    const session = await importService.getImportSession(id);
    if (!session) return res.status(404).json({ error: 'Upload session not found' });
    const transactions = await importService.getImportTransactions(id);
    res.json({ session, transactions });
  } catch (err) {
    console.error('Error fetching upload session details:', err);
    res.status(500).json({ error: 'Failed to fetch upload session details' });
  }
});

// Remove a confirmed match between transaction and ledger entry
router.post('/transaction/:transactionId/remove-match', async (req, res) => {
  try {
    const { transactionId } = req.params;
    await importService.removeMatch(transactionId);
    res.json({ message: 'Match removed successfully' });
  } catch (error: any) {
    console.error('[REMOVE MATCH] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove match' });
  }
});

// Undo a rejection for a transaction/ledger pair
router.post('/transaction/:transactionId/undo-reject', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { ledgerEntryId } = req.body;
    console.log(`[DEBUG ROUTE UNDO REJECT] Frontend request: transactionId=${transactionId}, ledgerEntryId=${ledgerEntryId}`);
    await importService.undoReject(transactionId, ledgerEntryId);
    res.json({ message: 'Rejection undone successfully' });
  } catch (error: any) {
    console.error('[UNDO REJECT] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to undo rejection' });
  }
});

// Reject a potential match for a transaction/ledger pair
router.post('/transaction/:transactionId/reject', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { ledgerEntryId } = req.body;
    if (!ledgerEntryId) {
      return res.status(400).json({ error: 'ledgerEntryId is required' });
    }
    console.log(`[DEBUG ROUTE REJECT] Frontend request: transactionId=${transactionId}, ledgerEntryId=${ledgerEntryId}`);
    await importService.rejectMatch(transactionId, ledgerEntryId);
    res.json({ message: 'Match rejected successfully' });
  } catch (error: any) {
    console.error('[REJECT MATCH] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject match' });
  }
});

// Get all rejected ledger entries for a given import transaction
router.get('/transaction/:transactionId/rejected-ledger-entries', async (req, res) => {
  const { transactionId } = req.params;
  try {
    const ledgerEntries = await importService.getRejectedLedgerEntries(transactionId);
    res.json(ledgerEntries);
  } catch (err) {
    console.error('Error fetching rejected ledger entries:', err);
    res.status(500).json({ error: 'Failed to fetch rejected ledger entries' });
  }
});

// Get all potential ledger entries for a given import transaction
router.get('/transaction/:transactionId/potential-matches', async (req, res) => {
  const { transactionId } = req.params;
  try {
    console.log(`[DEBUG ROUTE POTENTIAL MATCHES] Frontend request for transactionId=${transactionId}`);
    
    // Query the PotentialMatch table for this transaction
    const potentialMatchRepo = AppDataSource.getRepository(PotentialMatch);
    const potentialMatches = await potentialMatchRepo.find({
      where: {
        transaction: { id: transactionId },
        status: 'potential'
      },
      relations: ['ledgerEntry']
    });
    
    console.log(`[DEBUG ROUTE POTENTIAL MATCHES] Found ${potentialMatches.length} potential matches in database`);
    
    // Return only the ledgerEntry objects
    const result = potentialMatches.map(pm => pm.ledgerEntry);
    res.json(result);
  } catch (error) {
    console.error('[POTENTIAL MATCHES] Error:', error);
    res.status(500).json({ error: (error as Error).message || 'Failed to get potential matches' });
  }
});

// Batch endpoint: Get all potential matches for a list of transaction IDs
router.post('/transactions/potential-matches', async (req, res) => {
  const { transactionIds } = req.body;
  if (!Array.isArray(transactionIds)) {
    return res.status(400).json({ error: 'transactionIds must be an array' });
  }
  try {
    // Query the PotentialMatch table for all transactions in the list
    const potentialMatchRepo = AppDataSource.getRepository(PotentialMatch);
    const potentialMatches = await potentialMatchRepo.find({
      where: {
        transaction: { id: In(transactionIds) },
        status: 'potential'
      },
      relations: ['transaction', 'ledgerEntry']
    });
    
    // Group by transactionId
    const result: Record<string, any[]> = {};
    for (const transactionId of transactionIds) {
      result[transactionId] = [];
    }
    
    for (const pm of potentialMatches) {
      result[pm.transaction.id].push(pm.ledgerEntry);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to get batch potential matches' });
  }
});

// Batch endpoint: Get all rejected ledger entries for a list of transaction IDs
router.post('/transactions/rejected-ledger-entries', async (req, res) => {
  const { transactionIds } = req.body;
  if (!Array.isArray(transactionIds)) {
    return res.status(400).json({ error: 'transactionIds must be an array' });
  }
  try {
    const result: Record<string, any[]> = {};
    for (const transactionId of transactionIds) {
      const rejected = await importService.getRejectedLedgerEntries(transactionId);
      result[transactionId] = rejected;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to get batch rejected ledger entries' });
  }
});

// Cancel an import session
router.post('/session/:sessionId/cancel', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await importService.getImportSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Import session not found' });
    }
    if (session.status !== ImportStatus.PENDING && session.status !== ImportStatus.PROCESSING) {
      return res.status(400).json({ error: 'Only pending or processing sessions can be cancelled' });
    }
    session.status = ImportStatus.CANCELLED;
    await AppDataSource.getRepository('ImportSession').save(session);
    res.json({ message: 'Session cancelled successfully' });
  } catch (error: any) {
    console.error('Cancel session error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel session' });
  }
});

// Ignore duplicate for a transaction
router.post('/transaction/:transactionId/ignore-duplicate', async (req, res) => {
  try {
    const { transactionId } = req.params;
    await importService.ignoreDuplicate(transactionId);
    res.json({ message: 'Duplicate ignored successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to ignore duplicate' });
  }
});

// Reject duplicate for a transaction
router.post('/transaction/:transactionId/reject-duplicate', async (req, res) => {
  try {
    const { transactionId } = req.params;
    await importService.rejectDuplicate(transactionId);
    res.json({ message: 'Duplicate rejected successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reject duplicate' });
  }
});

// Accept duplicate and replace original
router.post('/transaction/:transactionId/accept-replace-original', async (req, res) => {
  try {
    const { transactionId } = req.params;
    await importService.acceptAndReplaceOriginal(transactionId);
    res.json({ message: 'Duplicate accepted and original replaced successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to accept and replace original' });
  }
});

// Force smart matching for all sessions in a program
router.post('/:programId/force-smart-matching', async (req, res) => {
  const { programId } = req.params;
  try {
    const sessionRepo = AppDataSource.getRepository(require('../entities/ImportSession').ImportSession);
    const sessions = await sessionRepo.find({ where: { program: { id: programId } } });
    for (const session of sessions) {
      await importService.performSmartMatching(session.id);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error running smart matching:', err);
    res.status(500).json({ error: 'Failed to run smart matching' });
  }
});

export const importRouter = router; 