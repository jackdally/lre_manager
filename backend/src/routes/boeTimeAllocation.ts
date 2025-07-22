import { Router } from 'express';
import { BOETimeAllocationService } from '../services/boeTimeAllocationService';
import { isValidUUID } from '../utils/validators';

const router = Router();

/**
 * @swagger
 * /api/programs/{id}/time-allocations:
 *   get:
 *     summary: Get time allocations for a program
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.get('/programs/:id/time-allocations', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const summary = await BOETimeAllocationService.getTimeAllocationSummary(id);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching time allocations:', error);
    res.status(500).json({ message: 'Error fetching time allocations', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/time-allocations:
 *   post:
 *     summary: Create new time allocation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.post('/programs/:id/time-allocations', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    // Validate input data
    const validation = BOETimeAllocationService.validateTimeAllocation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const timeAllocation = await BOETimeAllocationService.createTimeAllocation(id, req.body);
    res.status(201).json(timeAllocation);
  } catch (error) {
    console.error('Error creating time allocation:', error);
    res.status(500).json({ message: 'Error creating time allocation', error });
  }
});

/**
 * @swagger
 * /api/time-allocations/{id}/push-to-ledger:
 *   post:
 *     summary: Push time allocation to ledger
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Time allocation ID
 */
router.post('/time-allocations/:id/push-to-ledger', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid time allocation ID' });
    }

    await BOETimeAllocationService.pushToLedger(id);
    res.json({ message: 'Time allocation pushed to ledger successfully' });
  } catch (error) {
    console.error('Error pushing to ledger:', error);
    res.status(500).json({ message: 'Error pushing to ledger', error });
  }
});

/**
 * @swagger
 * /api/time-allocations/{id}/update-actuals:
 *   post:
 *     summary: Update actuals from ledger
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Time allocation ID
 */
router.post('/time-allocations/:id/update-actuals', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid time allocation ID' });
    }

    await BOETimeAllocationService.updateActualsFromLedger(id);
    res.json({ message: 'Actuals updated successfully' });
  } catch (error) {
    console.error('Error updating actuals:', error);
    res.status(500).json({ message: 'Error updating actuals', error });
  }
});

export default router; 