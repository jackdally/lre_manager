import { Router } from 'express';
import { RiskOpportunityService } from '../services/riskOpportunityService';
import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';

const router = Router();
const programRepository = AppDataSource.getRepository(Program);

// Add UUID validation helper
function isValidUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * @swagger
 * /api/programs/{id}/risk-opportunity/initialize:
 *   post:
 *     summary: Initialize Risk & Opportunity register for a program
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Register initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid Program ID
 *       404:
 *         description: Program not found
 */
router.post('/programs/:id/risk-opportunity/initialize', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    // Verify program exists
    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const result = await RiskOpportunityService.initializeRegister(id);
    res.json(result);
  } catch (error) {
    console.error('Error initializing Risk & Opportunity register:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error initializing register';
    res.status(500).json({ message: errorMessage });
  }
});

/**
 * @swagger
 * /api/programs/{id}/risk-opportunity/status:
 *   get:
 *     summary: Check if Risk & Opportunity register is initialized
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Register initialization status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 initialized:
 *                   type: boolean
 *       400:
 *         description: Invalid Program ID
 *       404:
 *         description: Program not found
 */
router.get('/programs/:id/risk-opportunity/status', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    // Verify program exists
    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const initialized = await RiskOpportunityService.isRegisterInitialized(id);
    res.json({ initialized });
  } catch (error) {
    console.error('Error checking Risk & Opportunity register status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error checking register status';
    res.status(500).json({ message: errorMessage });
  }
});

export default router;

