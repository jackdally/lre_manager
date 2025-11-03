import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';
import { ProgramSetupService } from '../services/programSetupService';

const router = Router();
const programRepository = AppDataSource.getRepository(Program);

// UUID validation helper
function isValidUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * @swagger
 * /api/programs/{id}/setup-status:
 *   get:
 *     summary: Get program setup status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.get('/programs/:id/setup-status', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const setupStatus = await ProgramSetupService.getSetupStatus(id);
    res.json(setupStatus);
  } catch (error) {
    console.error('Error fetching setup status:', error);
    res.status(500).json({
      message: 'Error fetching setup status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/programs/{id}/setup-status:
 *   put:
 *     summary: Update program setup status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               boeCreated:
 *                 type: boolean
 *               boeApproved:
 *                 type: boolean
 *               boeBaselined:
 *                 type: boolean
 *               riskOpportunityRegisterCreated:
 *                 type: boolean
 */
router.put('/programs/:id/setup-status', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const updates = {
      boeCreated: req.body.boeCreated,
      boeApproved: req.body.boeApproved,
      boeBaselined: req.body.boeBaselined,
      riskOpportunityRegisterCreated: req.body.riskOpportunityRegisterCreated
    };

    const setupStatus = await ProgramSetupService.updateSetupStatus(id, updates);
    res.json(setupStatus);
  } catch (error) {
    console.error('Error updating setup status:', error);
    res.status(500).json({
      message: 'Error updating setup status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

