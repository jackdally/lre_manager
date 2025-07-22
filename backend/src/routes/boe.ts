import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';
import { BOEVersion } from '../entities/BOEVersion';
import { BOEElement } from '../entities/BOEElement';
import { BOETemplate } from '../entities/BOETemplate';
import { BOETemplateElement } from '../entities/BOETemplateElement';
import { BOEApproval } from '../entities/BOEApproval';
import { ManagementReserve } from '../entities/ManagementReserve';

const router = Router();
const programRepository = AppDataSource.getRepository(Program);
const boeVersionRepository = AppDataSource.getRepository(BOEVersion);
const boeElementRepository = AppDataSource.getRepository(BOEElement);
const boeTemplateRepository = AppDataSource.getRepository(BOETemplate);
const boeTemplateElementRepository = AppDataSource.getRepository(BOETemplateElement);
const boeApprovalRepository = AppDataSource.getRepository(BOEApproval);
const managementReserveRepository = AppDataSource.getRepository(ManagementReserve);

// Add UUID validation helper
function isValidUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * @swagger
 * /api/programs/{id}/boe:
 *   get:
 *     summary: Get current BOE for program
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.get('/programs/:id/boe', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const program = await programRepository.findOne({
      where: { id }
    });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    // Get current BOE version
    let currentBOE = null;
    if (program.currentBOEVersionId) {
      currentBOE = await boeVersionRepository.findOne({
        where: { id: program.currentBOEVersionId },
        relations: ['elements', 'approvals']
      });
    }

    res.json({
      program,
      currentBOE,
      hasBOE: program.hasBOE,
      lastBOEUpdate: program.lastBOEUpdate
    });
  } catch (error) {
    console.error('Error fetching BOE:', error);
    res.status(500).json({ message: 'Error fetching BOE', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe:
 *   post:
 *     summary: Create new BOE version
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.post('/programs/:id/boe', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    // Validate required fields
    const requiredFields = ['name', 'description', 'versionNumber'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields
      });
    }

    // Create new BOE version
    const boeVersion = new BOEVersion();
    boeVersion.versionNumber = req.body.versionNumber;
    boeVersion.name = req.body.name;
    boeVersion.description = req.body.description;
    boeVersion.status = 'Draft';
    boeVersion.totalEstimatedCost = 0;
    boeVersion.managementReserveAmount = 0;
    boeVersion.managementReservePercentage = 0;
    boeVersion.program = program;

    const savedBOE = await boeVersionRepository.save(boeVersion);

    // Update program
    program.hasBOE = true;
    program.currentBOEVersionId = savedBOE.id;
    program.lastBOEUpdate = new Date();
    await programRepository.save(program);

    res.status(201).json(savedBOE);
  } catch (error) {
    console.error('Error creating BOE:', error);
    res.status(500).json({ message: 'Error creating BOE', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe/{versionId}:
 *   put:
 *     summary: Update BOE version
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.put('/programs/:id/boe/:versionId', async (req, res) => {
  try {
    const { id, versionId } = req.params;
    
    if (!isValidUUID(id) || !isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id: versionId, program: { id } },
      relations: ['program']
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    // Update BOE version
    Object.assign(boeVersion, req.body);
    boeVersion.updatedAt = new Date();
    
    const updatedBOE = await boeVersionRepository.save(boeVersion);

    // Update program last update time
    const program = await programRepository.findOne({ where: { id } });
    if (program) {
      program.lastBOEUpdate = new Date();
      await programRepository.save(program);
    }

    res.json(updatedBOE);
  } catch (error) {
    console.error('Error updating BOE:', error);
    res.status(500).json({ message: 'Error updating BOE', error });
  }
});

/**
 * @swagger
 * /api/boe-templates:
 *   get:
 *     summary: Get available BOE templates
 */
router.get('/boe-templates', async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const whereClause: any = {};
    if (category) whereClause.category = category;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const templates = await boeTemplateRepository.find({
      where: whereClause,
      relations: ['elements'],
      order: { name: 'ASC' }
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching BOE templates:', error);
    res.status(500).json({ message: 'Error fetching BOE templates', error });
  }
});

/**
 * @swagger
 * /api/boe-templates:
 *   post:
 *     summary: Create new BOE template
 */
router.post('/boe-templates', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'description', 'category', 'version'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields
      });
    }

    const template = new BOETemplate();
    template.name = req.body.name;
    template.description = req.body.description;
    template.category = req.body.category;
    template.version = req.body.version;
    template.isActive = req.body.isActive !== undefined ? req.body.isActive : true;

    const savedTemplate = await boeTemplateRepository.save(template);

    res.status(201).json(savedTemplate);
  } catch (error) {
    console.error('Error creating BOE template:', error);
    res.status(500).json({ message: 'Error creating BOE template', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe/approve:
 *   post:
 *     summary: Submit BOE for approval
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.post('/programs/:id/boe/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const program = await programRepository.findOne({
      where: { id },
      relations: ['boeVersions']
    });

    if (!program || !program.currentBOEVersionId) {
      return res.status(404).json({ message: 'No current BOE version found' });
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id: program.currentBOEVersionId }
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    // Update status to Under Review
    boeVersion.status = 'Under Review';
    boeVersion.updatedAt = new Date();
    
    const updatedBOE = await boeVersionRepository.save(boeVersion);

    res.json(updatedBOE);
  } catch (error) {
    console.error('Error submitting BOE for approval:', error);
    res.status(500).json({ message: 'Error submitting BOE for approval', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe/approve/{versionId}:
 *   post:
 *     summary: Approve specific BOE version
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.post('/programs/:id/boe/approve/:versionId', async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const { approvedBy, comments } = req.body;
    
    if (!isValidUUID(id) || !isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id: versionId, program: { id } }
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    // Update BOE version status
    boeVersion.status = 'Approved';
    boeVersion.approvedBy = approvedBy;
    boeVersion.approvedAt = new Date();
    boeVersion.updatedAt = new Date();
    
    const updatedBOE = await boeVersionRepository.save(boeVersion);

    // Create approval record
    const approval = boeApprovalRepository.create({
      approvalLevel: 1,
      approverRole: 'Program Manager',
      approverName: approvedBy,
      status: 'Approved',
      approvedAt: new Date(),
      comments,
      isRequired: true,
      sequenceOrder: 1,
      boeVersion: updatedBOE
    });

    await boeApprovalRepository.save(approval);

    res.json(updatedBOE);
  } catch (error) {
    console.error('Error approving BOE:', error);
    res.status(500).json({ message: 'Error approving BOE', error });
  }
});

/**
 * @swagger
 * /api/boe-elements:
 *   post:
 *     summary: Create BOE element
 */
router.post('/boe-elements', async (req, res) => {
  try {
    const { boeVersionId, ...elementData } = req.body;
    
    if (!boeVersionId || !isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Valid BOE version ID is required' });
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId }
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    const element = new BOEElement();
    element.code = elementData.code;
    element.name = elementData.name;
    element.description = elementData.description;
    element.level = elementData.level;
    element.estimatedCost = elementData.estimatedCost || 0;
    element.isRequired = elementData.isRequired !== undefined ? elementData.isRequired : true;
    element.isOptional = elementData.isOptional !== undefined ? elementData.isOptional : false;
    element.boeVersion = boeVersion;

    const savedElement = await boeElementRepository.save(element);

    res.status(201).json(savedElement);
  } catch (error) {
    console.error('Error creating BOE element:', error);
    res.status(500).json({ message: 'Error creating BOE element', error });
  }
});

/**
 * @swagger
 * /api/boe-elements/{id}:
 *   put:
 *     summary: Update BOE element
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Element ID
 */
router.put('/boe-elements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid element ID' });
    }

    const element = await boeElementRepository.findOne({
      where: { id },
      relations: ['boeVersion']
    });

    if (!element) {
      return res.status(404).json({ message: 'BOE element not found' });
    }

    Object.assign(element, req.body);
    element.updatedAt = new Date();
    
    const updatedElement = await boeElementRepository.save(element);

    res.json(updatedElement);
  } catch (error) {
    console.error('Error updating BOE element:', error);
    res.status(500).json({ message: 'Error updating BOE element', error });
  }
});

/**
 * @swagger
 * /api/boe-elements/{id}:
 *   delete:
 *     summary: Delete BOE element
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Element ID
 */
router.delete('/boe-elements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid element ID' });
    }

    const element = await boeElementRepository.findOne({
      where: { id }
    });

    if (!element) {
      return res.status(404).json({ message: 'BOE element not found' });
    }

    await boeElementRepository.remove(element);

    res.json({ message: 'BOE element deleted successfully' });
  } catch (error) {
    console.error('Error deleting BOE element:', error);
    res.status(500).json({ message: 'Error deleting BOE element', error });
  }
});

export default router; 