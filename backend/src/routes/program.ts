import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';
import { copyWbsTemplateToProgram } from '../services/wbsTemplateService';
import { ProgramDeletionService } from '../services/programDeletionService';
import { ProgramSetupService } from '../services/programSetupService';

const router = Router();
const programRepository = AppDataSource.getRepository(Program);

// Add UUID validation helper
function isValidUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * @swagger
 * /api/programs:
 *   get:
 *     summary: Get all programs
 *     responses:
 *       200:
 *         description: List of programs
 */
router.get('/', async (req, res) => {
  try {
    const programs = await programRepository.find();
    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ message: 'Error fetching programs', error });
  }
});

/**
 * @swagger
 * /api/programs:
 *   post:
 *     summary: Create a new program
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - type
 *               - totalBudget
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               totalBudget:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [Annual, Period of Performance]
 */
router.post('/', async (req, res) => {
  try {
    console.log('Received program data:', req.body);
    
    // Validate required fields
    const requiredFields = ['code', 'name', 'type', 'totalBudget'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields
      });
    }

    // Convert string dates to Date objects if they exist
    if (req.body.startDate) {
      req.body.startDate = new Date(req.body.startDate);
    }
    if (req.body.endDate) {
      req.body.endDate = new Date(req.body.endDate);
    }

    // Convert totalBudget to number
    req.body.totalBudget = Number(req.body.totalBudget);

    const program = programRepository.create(req.body);
    console.log('Created program entity:', program);
    
    const result = await programRepository.save(program);
    console.log('Saved program:', result);
    
    // Ensure we have a single program result
    const savedProgram = Array.isArray(result) ? result[0] : result;
    
    // If a WBS template was selected, copy its elements to the program
    if (req.body.wbsTemplateId) {
      try {
        await copyWbsTemplateToProgram(savedProgram.id, req.body.wbsTemplateId);
        console.log('WBS template copied to program successfully');
      } catch (error) {
        console.error('Error copying WBS template to program:', error);
        // Don't fail the program creation if WBS template copying fails
        // The program is already created, just log the error
      }
    }

    // Initialize setup status for the new program
    try {
      await ProgramSetupService.initializeSetupStatus(savedProgram.id);
      console.log('Program setup status initialized');
    } catch (error) {
      console.error('Error initializing program setup status:', error);
      // Don't fail the program creation if setup status initialization fails
      // The program is already created, just log the error
    }
    
    res.status(201).json(savedProgram);
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ 
      message: 'Error creating program', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/programs/{id}:
 *   get:
 *     summary: Get a program by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:id', async (req, res) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(400).json({ message: 'Invalid program ID format' });
  }
  try {
    const program = await programRepository.findOneBy({ id: req.params.id });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.json(program);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching program', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}:
 *   put:
 *     summary: Update a program
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.put('/:id', async (req, res) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(400).json({ message: 'Invalid program ID format' });
  }
  try {
    const program = await programRepository.findOneBy({ id: req.params.id });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    programRepository.merge(program, req.body);
    const result = await programRepository.save(program);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error updating program', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}:
 *   delete:
 *     summary: Delete a program and all related data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete('/:id', async (req, res) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(400).json({ message: 'Invalid program ID format' });
  }
  
  try {
    const programDeletionService = new ProgramDeletionService();
    const result = await programDeletionService.deleteProgram(req.params.id);
    
    if (result.success) {
      res.status(200).json({ 
        message: result.message,
        details: result.details
      });
    } else {
      res.status(500).json({ 
        message: result.message,
        error: result.details
      });
    }
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ 
      message: 'Error deleting program', 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export const programRouter = router; 