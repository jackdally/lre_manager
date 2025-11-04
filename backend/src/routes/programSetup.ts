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
      riskOpportunityRegisterCreated: req.body.riskOpportunityRegisterCreated,
      initialMRSet: req.body.initialMRSet,
      roAnalysisComplete: req.body.roAnalysisComplete,
      finalMRSet: req.body.finalMRSet
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

/**
 * @swagger
 * /api/programs/{id}/setup-status/initial-mr:
 *   post:
 *     summary: Mark Initial MR as set
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.post('/programs/:id/setup-status/initial-mr', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const setupStatus = await ProgramSetupService.markInitialMRSet(id);
    res.json(setupStatus);
  } catch (error) {
    console.error('Error marking Initial MR as set:', error);
    res.status(500).json({
      message: 'Error marking Initial MR as set',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/programs/{id}/setup-status/ro-analysis-complete:
 *   post:
 *     summary: Mark R&O Analysis as complete
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.post('/programs/:id/setup-status/ro-analysis-complete', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const setupStatus = await ProgramSetupService.markROAnalysisComplete(id);
    res.json(setupStatus);
  } catch (error) {
    console.error('Error marking R&O Analysis as complete:', error);
    res.status(500).json({
      message: 'Error marking R&O Analysis as complete',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/programs/{id}/setup-status/ro-analysis-skipped:
 *   post:
 *     summary: Mark R&O Analysis as skipped
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.post('/programs/:id/setup-status/ro-analysis-skipped', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const setupStatus = await ProgramSetupService.markROAnalysisSkipped(id);
    res.json(setupStatus);
  } catch (error) {
    console.error('Error marking R&O Analysis as skipped:', error);
    res.status(500).json({
      message: 'Error marking R&O Analysis as skipped',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/programs/{id}/setup-status/final-mr:
 *   post:
 *     summary: Mark Final MR as set
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.post('/programs/:id/setup-status/final-mr', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const setupStatus = await ProgramSetupService.markFinalMRSet(id);
    res.json(setupStatus);
  } catch (error) {
    console.error('Error marking Final MR as set:', error);
    res.status(500).json({
      message: 'Error marking Final MR as set',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

