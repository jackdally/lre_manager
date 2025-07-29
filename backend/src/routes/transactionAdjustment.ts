import { Router } from 'express';
import { TransactionAdjustmentService } from '../services/transactionAdjustmentService';

const router = Router();

/**
 * @swagger
 * /api/transaction-adjustment/{ledgerEntryId}/scenarios:
 *   get:
 *     summary: Get available adjustment scenarios for a ledger entry
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
 *         description: Actual transaction amount for scenario detection
 *       - in: query
 *         name: actualDate
 *         schema:
 *           type: string
 *         description: Actual transaction date for scenario detection
 */
router.get('/:ledgerEntryId/scenarios', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    const { actualAmount, actualDate } = req.query;

    // Parse actual amount and date from query parameters
    const parsedActualAmount = actualAmount ? Number(actualAmount) : undefined;
    const parsedActualDate = actualDate ? String(actualDate) : undefined;

    const scenarios = await TransactionAdjustmentService.getAvailableScenarios(
      ledgerEntryId,
      parsedActualAmount,
      parsedActualDate
    );

    res.json(scenarios);
  } catch (error: any) {
    console.error('Error getting adjustment scenarios:', error);
    res.status(500).json({ error: error.message || 'Failed to get adjustment scenarios' });
  }
});

/**
 * @swagger
 * /api/transaction-adjustment/{ledgerEntryId}/allocation-impact:
 *   post:
 *     summary: Calculate the impact of an adjustment on future allocations
 *     parameters:
 *       - in: path
 *         name: ledgerEntryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ledger entry ID
 */
router.post('/:ledgerEntryId/allocation-impact', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    const {
      scenario,
      remainingAmount,
      remainingDate,
      relevelingScope,
      relevelingAlgorithm,
      weightIntensity,
      customDistribution,
      actualAmount,
      actualDate
    } = req.body;

    if (!scenario) {
      return res.status(400).json({ error: 'Scenario is required' });
    }

    const impact = await TransactionAdjustmentService.calculateAllocationImpact({
      ledgerEntryId,
      scenario,
      remainingAmount,
      remainingDate,
      relevelingScope,
      relevelingAlgorithm,
      weightIntensity,
      customDistribution,
      actualAmount,
      actualDate
    });

    res.json(impact);
  } catch (error: any) {
    console.error('Error calculating allocation impact:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate allocation impact' });
  }
});

/**
 * @swagger
 * /api/transaction-adjustment/{ledgerEntryId}/apply:
 *   post:
 *     summary: Apply a transaction adjustment (split, re-forecast, or schedule change)
 *     parameters:
 *       - in: path
 *         name: ledgerEntryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ledger entry ID
 */
router.post('/:ledgerEntryId/apply', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    const {
      scenario,
      // Partial delivery configuration
      splits,
      reason: splitReason,
      // Re-forecast configuration
      relevelingScope,
      relevelingAlgorithm,
      weightIntensity,
      customDistribution,
      baselineExceedanceJustification,
      // Schedule change configuration
      newPlannedDate,
      // Common fields
      userId
    } = req.body;

    if (!scenario) {
      return res.status(400).json({ error: 'Scenario is required' });
    }

    let result;
    switch (scenario) {
      case 'partial_delivery':
        if (!splits || splits.length === 0 || !splitReason) {
          return res.status(400).json({
            error: 'Partial delivery requires at least one split and a reason'
          });
        }
        result = await TransactionAdjustmentService.applyPartialDelivery({
          ledgerEntryId,
          splits,
          reason: splitReason,
          userId
        });
        break;

      case 'cost_overrun':
      case 'cost_underspend':
        if (!relevelingScope || !relevelingAlgorithm || !splitReason) {
          return res.status(400).json({
            error: 'Re-forecast requires relevelingScope, relevelingAlgorithm, and reason'
          });
        }
        result = await TransactionAdjustmentService.applyReForecast({
          ledgerEntryId,
          scenario,
          relevelingScope,
          relevelingAlgorithm,
          weightIntensity,
          customDistribution,
          baselineExceedanceJustification,
          reason: splitReason,
          userId
        });
        break;

      case 'schedule_change':
        if (!newPlannedDate || !splitReason) {
          return res.status(400).json({
            error: 'Schedule change requires newPlannedDate and reason'
          });
        }
        result = await TransactionAdjustmentService.applyScheduleChange({
          ledgerEntryId,
          newPlannedDate,
          reason: splitReason,
          userId
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid scenario' });
    }

    res.json({
      message: 'Transaction adjustment applied successfully',
      scenario,
      result
    });
  } catch (error: any) {
    console.error('Error applying transaction adjustment:', error);
    res.status(500).json({ error: error.message || 'Failed to apply transaction adjustment' });
  }
});

/**
 * @swagger
 * /api/transaction-adjustment/{ledgerEntryId}/validate:
 *   post:
 *     summary: Validate an adjustment configuration before applying
 *     parameters:
 *       - in: path
 *         name: ledgerEntryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ledger entry ID
 */
router.post('/:ledgerEntryId/validate', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    const {
      scenario,
      remainingAmount,
      remainingDate,
      relevelingScope,
      relevelingAlgorithm,
      weightIntensity,
      customDistribution
    } = req.body;

    if (!scenario) {
      return res.status(400).json({ error: 'Scenario is required' });
    }

    const validation = await TransactionAdjustmentService.validateAdjustment({
      ledgerEntryId,
      scenario,
      remainingAmount,
      remainingDate,
      relevelingScope,
      relevelingAlgorithm,
      weightIntensity,
      customDistribution
    });

    res.json(validation);
  } catch (error: any) {
    console.error('Error validating adjustment:', error);
    res.status(500).json({ error: error.message || 'Failed to validate adjustment' });
  }
});

export const transactionAdjustmentRouter = router;