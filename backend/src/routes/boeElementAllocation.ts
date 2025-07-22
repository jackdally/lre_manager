import { Router } from 'express';
import { BOEElementAllocationService } from '../services/boeElementAllocationService';
import { isValidUUID } from '../utils/validators';

const router = Router();

/**
 * @swagger
 * /api/boe-versions/{boeVersionId}/element-allocations:
 *   get:
 *     summary: Get element allocations for a BOE version
 *     parameters:
 *       - in: path
 *         name: boeVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.get('/boe-versions/:boeVersionId/element-allocations', async (req, res) => {
  try {
    const { boeVersionId } = req.params;
    
    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const allocations = await BOEElementAllocationService.getElementAllocations(boeVersionId);
    res.json(allocations);
  } catch (error) {
    console.error('Error fetching element allocations:', error);
    res.status(500).json({ message: 'Error fetching element allocations', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{boeVersionId}/element-allocations/summary:
 *   get:
 *     summary: Get element allocation summary for a BOE version
 *     parameters:
 *       - in: path
 *         name: boeVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.get('/boe-versions/:boeVersionId/element-allocations/summary', async (req, res) => {
  try {
    const { boeVersionId } = req.params;
    
    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const summary = await BOEElementAllocationService.getElementAllocationSummary(boeVersionId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching element allocation summary:', error);
    res.status(500).json({ message: 'Error fetching element allocation summary', error });
  }
});

/**
 * @swagger
 * /api/boe-elements/{boeElementId}/allocations:
 *   post:
 *     summary: Create new element allocation
 *     parameters:
 *       - in: path
 *         name: boeElementId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Element ID
 */
router.post('/boe-elements/:boeElementId/allocations', async (req, res) => {
  try {
    const { boeElementId } = req.params;
    
    if (!isValidUUID(boeElementId)) {
      return res.status(400).json({ message: 'Invalid BOE element ID' });
    }

    // Validate required fields
    const requiredFields = ['name', 'description', 'totalAmount', 'startDate', 'endDate', 'allocationType', 'boeVersionId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields
      });
    }

    // Validate allocation data
    const validation = BOEElementAllocationService.validateElementAllocation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const allocation = await BOEElementAllocationService.createElementAllocation(
      boeElementId,
      req.body.boeVersionId,
      req.body
    );

    res.status(201).json(allocation);
  } catch (error) {
    console.error('Error creating element allocation:', error);
    res.status(500).json({ message: 'Error creating element allocation', error });
  }
});

/**
 * @swagger
 * /api/element-allocations/{allocationId}:
 *   get:
 *     summary: Get element allocation by ID
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Element Allocation ID
 */
router.get('/element-allocations/:allocationId', async (req, res) => {
  try {
    const { allocationId } = req.params;
    
    if (!isValidUUID(allocationId)) {
      return res.status(400).json({ message: 'Invalid allocation ID' });
    }

    const allocation = await BOEElementAllocationService.getElementAllocation(allocationId);
    if (!allocation) {
      return res.status(404).json({ message: 'Element allocation not found' });
    }

    res.json(allocation);
  } catch (error) {
    console.error('Error fetching element allocation:', error);
    res.status(500).json({ message: 'Error fetching element allocation', error });
  }
});

/**
 * @swagger
 * /api/element-allocations/{allocationId}:
 *   put:
 *     summary: Update element allocation
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Element Allocation ID
 */
router.put('/element-allocations/:allocationId', async (req, res) => {
  try {
    const { allocationId } = req.params;
    
    if (!isValidUUID(allocationId)) {
      return res.status(400).json({ message: 'Invalid allocation ID' });
    }

    // Validate allocation data if provided
    if (Object.keys(req.body).length > 0) {
      const validation = BOEElementAllocationService.validateElementAllocation(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validation.errors
        });
      }
    }

    const allocation = await BOEElementAllocationService.updateElementAllocation(allocationId, req.body);
    res.json(allocation);
  } catch (error) {
    console.error('Error updating element allocation:', error);
    res.status(500).json({ message: 'Error updating element allocation', error });
  }
});

/**
 * @swagger
 * /api/element-allocations/{allocationId}:
 *   delete:
 *     summary: Delete element allocation
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Element Allocation ID
 */
router.delete('/element-allocations/:allocationId', async (req, res) => {
  try {
    const { allocationId } = req.params;
    
    if (!isValidUUID(allocationId)) {
      return res.status(400).json({ message: 'Invalid allocation ID' });
    }

    await BOEElementAllocationService.deleteElementAllocation(allocationId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting element allocation:', error);
    res.status(500).json({ message: 'Error deleting element allocation', error });
  }
});

/**
 * @swagger
 * /api/element-allocations/{allocationId}/push-to-ledger:
 *   post:
 *     summary: Push element allocation to ledger
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Element Allocation ID
 */
router.post('/element-allocations/:allocationId/push-to-ledger', async (req, res) => {
  try {
    const { allocationId } = req.params;
    
    if (!isValidUUID(allocationId)) {
      return res.status(400).json({ message: 'Invalid allocation ID' });
    }

    await BOEElementAllocationService.pushToLedger(allocationId);
    res.json({ message: 'Element allocation successfully pushed to ledger' });
  } catch (error) {
    console.error('Error pushing element allocation to ledger:', error);
    res.status(500).json({ message: 'Error pushing element allocation to ledger', error });
  }
});

/**
 * @swagger
 * /api/element-allocations/{allocationId}/update-actuals:
 *   post:
 *     summary: Update actual amounts from ledger
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Element Allocation ID
 */
router.post('/element-allocations/:allocationId/update-actuals', async (req, res) => {
  try {
    const { allocationId } = req.params;
    
    if (!isValidUUID(allocationId)) {
      return res.status(400).json({ message: 'Invalid allocation ID' });
    }

    await BOEElementAllocationService.updateActualsFromLedger(allocationId);
    res.json({ message: 'Actual amounts updated from ledger' });
  } catch (error) {
    console.error('Error updating actual amounts:', error);
    res.status(500).json({ message: 'Error updating actual amounts', error });
  }
});

export default router; 