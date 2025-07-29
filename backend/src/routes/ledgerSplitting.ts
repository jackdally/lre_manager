import { Router } from 'express';
import { LedgerSplittingService } from '../services/ledgerSplittingService';

const router = Router();

/**
 * @swagger
 * /api/ledger-splitting/{ledgerEntryId}/split:
 *   post:
 *     summary: Split a ledger entry into multiple entries
 *     parameters:
 *       - in: path
 *         name: ledgerEntryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Original ledger entry ID
 */
router.post('/:ledgerEntryId/split', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    const { splits, splitReason, userId } = req.body;

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ error: 'Splits array is required and must not be empty' });
    }

    if (!splitReason) {
      return res.status(400).json({ error: 'Split reason is required' });
    }

    const newEntries = await LedgerSplittingService.splitLedgerEntry({
      originalLedgerEntryId: ledgerEntryId,
      splits,
      splitReason,
      userId
    });

    res.json({
      message: 'Ledger entry split successfully',
      originalEntryId: ledgerEntryId,
      newEntries: newEntries.map(entry => ({
        id: entry.id,
        vendor_name: entry.vendor_name,
        expense_description: entry.expense_description,
        planned_amount: entry.planned_amount,
        planned_date: entry.planned_date,
        createdFromBOE: entry.createdFromBOE
      }))
    });
  } catch (error: any) {
    console.error('Error splitting ledger entry:', error);
    res.status(500).json({ error: error.message || 'Failed to split ledger entry' });
  }
});

/**
 * @swagger
 * /api/ledger-splitting/{ledgerEntryId}/re-forecast:
 *   post:
 *     summary: Re-forecast a ledger entry's planned amount and date
 *     parameters:
 *       - in: path
 *         name: ledgerEntryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ledger entry ID
 */
router.post('/:ledgerEntryId/re-forecast', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    const { 
      newPlannedAmount, 
      newPlannedDate, 
      reForecastReason, 
      userId,
      relevelingScope,
      relevelingAlgorithm,
      baselineExceedanceJustification
    } = req.body;

    if (typeof newPlannedAmount !== 'number' || newPlannedAmount < 0) {
      return res.status(400).json({ error: 'Valid new planned amount is required' });
    }

    if (!newPlannedDate) {
      return res.status(400).json({ error: 'New planned date is required' });
    }

    if (!reForecastReason) {
      return res.status(400).json({ error: 'Re-forecast reason is required' });
    }

    const updatedEntry = await LedgerSplittingService.reForecastLedgerEntry({
      ledgerEntryId,
      newPlannedAmount,
      newPlannedDate,
      reForecastReason,
      userId,
      relevelingScope,
      relevelingAlgorithm,
      baselineExceedanceJustification
    });

    res.json({
      message: 'Ledger entry re-forecasted successfully',
      entry: {
        id: updatedEntry.id,
        vendor_name: updatedEntry.vendor_name,
        expense_description: updatedEntry.expense_description,
        planned_amount: updatedEntry.planned_amount,
        planned_date: updatedEntry.planned_date,
        baseline_amount: updatedEntry.baseline_amount,
        createdFromBOE: updatedEntry.createdFromBOE
      }
    });
  } catch (error: any) {
    console.error('Error re-forecasting ledger entry:', error);
    res.status(500).json({ error: error.message || 'Failed to re-forecast ledger entry' });
  }
});

/**
 * @swagger
 * /api/ledger-splitting/{ledgerEntryId}/split-suggestions:
 *   get:
 *     summary: Get split suggestions based on BOE allocation
 *     parameters:
 *       - in: path
 *         name: ledgerEntryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ledger entry ID
 */
router.get('/:ledgerEntryId/split-suggestions', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    const suggestions = await LedgerSplittingService.getSplitSuggestions(ledgerEntryId);

    res.json({
      suggestions,
      hasSuggestions: suggestions.length > 0
    });
  } catch (error: any) {
    console.error('Error getting split suggestions:', error);
    res.status(500).json({ error: error.message || 'Failed to get split suggestions' });
  }
});

/**
 * @swagger
 * /api/ledger-splitting/{ledgerEntryId}/re-forecast-suggestions:
 *   get:
 *     summary: Get re-forecast suggestions based on BOE allocation and actual data
 *     parameters:
 *       - in: path
 *         name: ledgerEntryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ledger entry ID
 *       - in: query
 *         name: actualAmount
 *         schema:
 *           type: number
 *         description: Actual transaction amount for smart suggestions
 *       - in: query
 *         name: actualDate
 *         schema:
 *           type: string
 *         description: Actual transaction date for smart suggestions
 */
router.get('/:ledgerEntryId/re-forecast-suggestions', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    const { actualAmount, actualDate } = req.query;

    // Parse actual amount and date from query parameters
    const parsedActualAmount = actualAmount ? Number(actualAmount) : undefined;
    const parsedActualDate = actualDate ? String(actualDate) : undefined;

    const suggestions = await LedgerSplittingService.getReForecastSuggestions(
      ledgerEntryId, 
      parsedActualAmount, 
      parsedActualDate
    );

    res.json({
      suggestions,
      hasSuggestions: suggestions.length > 0
    });
  } catch (error: any) {
    console.error('Error getting re-forecast suggestions:', error);
    res.status(500).json({ error: error.message || 'Failed to get re-forecast suggestions' });
  }
});

/**
 * @swagger
 * /api/ledger-splitting/{ledgerEntryId}/automatic-split:
 *   post:
 *     summary: Automatically split a ledger entry based on actual amount
 *     parameters:
 *       - in: path
 *         name: ledgerEntryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Original ledger entry ID
 */
router.post('/:ledgerEntryId/automatic-split', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    const { actualAmount, actualDate, splitReason, userId, createNewBOEAllocation } = req.body;

    if (typeof actualAmount !== 'number' || actualAmount <= 0) {
      return res.status(400).json({ error: 'Valid actual amount is required' });
    }

    if (!actualDate) {
      return res.status(400).json({ error: 'Actual date is required' });
    }

    if (!splitReason) {
      return res.status(400).json({ error: 'Split reason is required' });
    }

    const newEntries = await LedgerSplittingService.automaticSplitLedgerEntry({
      originalLedgerEntryId: ledgerEntryId,
      actualAmount,
      actualDate,
      splitReason,
      userId,
      createNewBOEAllocation: createNewBOEAllocation || false
    });

    res.json({
      message: 'Ledger entry automatically split successfully',
      originalEntryId: ledgerEntryId,
      newEntries: newEntries.map(entry => ({
        id: entry.id,
        vendor_name: entry.vendor_name,
        expense_description: entry.expense_description,
        planned_amount: entry.planned_amount,
        planned_date: entry.planned_date,
        createdFromBOE: entry.createdFromBOE
      }))
    });
  } catch (error: any) {
    console.error('Error automatically splitting ledger entry:', error);
    res.status(500).json({ error: error.message || 'Failed to automatically split ledger entry' });
  }
});

export const ledgerSplittingRouter = router; 