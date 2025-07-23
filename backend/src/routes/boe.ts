import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';
import { BOEVersion } from '../entities/BOEVersion';
import { BOEElement } from '../entities/BOEElement';
import { BOETemplate } from '../entities/BOETemplate';
import { BOETemplateElement } from '../entities/BOETemplateElement';
import { BOEApproval } from '../entities/BOEApproval';
import { ManagementReserve } from '../entities/ManagementReserve';
import { BOEService } from '../services/boeService';
import { BOETemplateService } from '../services/boeTemplateService';
import { WbsTemplate } from '../entities/WbsTemplate';

const router = Router();
const programRepository = AppDataSource.getRepository(Program);
const boeVersionRepository = AppDataSource.getRepository(BOEVersion);
const boeElementRepository = AppDataSource.getRepository(BOEElement);
const boeTemplateRepository = AppDataSource.getRepository(BOETemplate);
const boeTemplateElementRepository = AppDataSource.getRepository(BOETemplateElement);
const boeApprovalRepository = AppDataSource.getRepository(BOEApproval);
const managementReserveRepository = AppDataSource.getRepository(ManagementReserve);
const wbsTemplateRepository = AppDataSource.getRepository(WbsTemplate);

// Add UUID validation helper
function isValidUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * @swagger
 * /api/boe/wbs-templates:
 *   get:
 *     summary: Get available WBS templates for BOE import
 */
router.get('/boe/wbs-templates', async (req, res) => {
  try {
    const templates = await wbsTemplateRepository.find({
      relations: ['elements', 'elements.children'],
      order: {
        isDefault: 'DESC',
        name: 'ASC'
      }
    });

    const templatesWithHierarchy = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      isDefault: template.isDefault,
      structure: template.elements ? template.elements.filter(e => !e.parentId) : [],
      elementCount: template.elements ? template.elements.length : 0,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }));

    res.json(templatesWithHierarchy);
  } catch (error) {
    console.error('Error fetching WBS templates:', error);
    res.status(500).json({ message: 'Error fetching WBS templates', error });
  }
});

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

    let savedBOE;

    // Check if this is a template-based creation with allocations
    if (req.body.templateId && req.body.allocations) {
      // Create BOE from template with allocations
      savedBOE = await BOEService.createBOEFromTemplateWithAllocations(
        id,
        req.body.templateId,
        {
          versionNumber: req.body.versionNumber,
          name: req.body.name,
          description: req.body.description
        },
        req.body.allocations
      );
    } else if (req.body.templateId) {
      // Create BOE from template without allocations
      savedBOE = await BOEService.createBOEFromTemplate(
        id,
        req.body.templateId,
        {
          versionNumber: req.body.versionNumber,
          name: req.body.name,
          description: req.body.description
        }
      );
    } else {
      // Create basic BOE version
      const boeVersion = new BOEVersion();
      boeVersion.versionNumber = req.body.versionNumber;
      boeVersion.name = req.body.name;
      boeVersion.description = req.body.description;
      boeVersion.status = 'Draft';
      boeVersion.totalEstimatedCost = 0;
      boeVersion.managementReserveAmount = 0;
      boeVersion.managementReservePercentage = 0;
      boeVersion.program = program;

      savedBOE = await boeVersionRepository.save(boeVersion);
    }

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
    template.version = req.body.version || '1.0';
    template.isActive = req.body.isActive !== undefined ? req.body.isActive : true;
    template.isDefault = req.body.isDefault || false;
    template.createdBy = req.body.userId || req.headers['user-id'] as string || null;
    template.updatedBy = req.body.userId || req.headers['user-id'] as string || null;

    const savedTemplate = await boeTemplateRepository.save(template);

    res.status(201).json(savedTemplate);
  } catch (error) {
    console.error('Error creating BOE template:', error);
    res.status(500).json({ message: 'Error creating BOE template', error });
  }
});

// Note: Complex versioning routes have been removed as part of BOE-078F template simplification

// Note: Accessible templates route removed as part of BOE-078F template simplification

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
    element.costCategoryId = elementData.costCategoryId || null;
    element.vendorId = elementData.vendorId || null;
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
 * /api/boe-versions/{versionId}/elements/bulk:
 *   put:
 *     summary: Bulk update BOE elements
 *     parameters:
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               elements:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BOEElement'
 */
router.put('/boe-versions/:versionId/elements/bulk', async (req, res) => {
  try {
    const { versionId } = req.params;
    const { elements } = req.body;
    
    if (!isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid version ID' });
    }

    if (!Array.isArray(elements)) {
      return res.status(400).json({ message: 'Elements must be an array' });
    }

    // Verify BOE version exists
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: versionId }
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    const updatedElements = [];
    
    // Update each element
    for (const elementData of elements) {
      if (!elementData.id) {
        return res.status(400).json({ message: 'All elements must have an ID' });
      }

      const element = await boeElementRepository.findOne({
        where: { id: elementData.id, boeVersion: { id: versionId } }
      });

      if (!element) {
        return res.status(404).json({ message: `Element ${elementData.id} not found` });
      }

      // Update element properties
      Object.assign(element, elementData);
      element.updatedAt = new Date();
      
      const updatedElement = await boeElementRepository.save(element);
      updatedElements.push(updatedElement);
    }

    // Update BOE calculations
    await BOEService.updateBOECalculations(versionId);

    res.json(updatedElements);
  } catch (error) {
    console.error('Error bulk updating BOE elements:', error);
    res.status(500).json({ message: 'Error bulk updating BOE elements', error });
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

/**
 * @swagger
 * /api/programs/{id}/boe/{versionId}/push-to-ledger:
 *   post:
 *     summary: Push BOE to ledger as baseline budget
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
router.post('/programs/:id/boe/:versionId/push-to-ledger', async (req, res) => {
  try {
    const { id, versionId } = req.params;
    
    if (!isValidUUID(id) || !isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid program ID or version ID' });
    }

    const result = await BOEService.pushBOEToLedger(versionId, req.body.userId || req.headers['user-id'] as string);
    res.json(result);
  } catch (error) {
    console.error('Error pushing BOE to ledger:', error);
    res.status(500).json({ message: 'Error pushing BOE to ledger', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe/{versionId}/clear-elements:
 *   post:
 *     summary: Clear all elements from BOE version
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
router.post('/programs/:id/boe/:versionId/clear-elements', async (req, res) => {
  try {
    const { id, versionId } = req.params;
    
    if (!isValidUUID(id) || !isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid program ID or version ID' });
    }

    const result = await BOEService.clearBOEElements(versionId);
    res.json(result);
  } catch (error) {
    console.error('Error clearing BOE elements:', error);
    res.status(500).json({ message: 'Error clearing BOE elements', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe/{versionId}/import-wbs-template:
 *   post:
 *     summary: Import WBS template into BOE
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wbsTemplateId:
 *                 type: string
 *                 description: WBS Template ID to import
 */
router.post('/programs/:id/boe/:versionId/import-wbs-template', async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const { wbsTemplateId } = req.body;
    
    if (!isValidUUID(id) || !isValidUUID(versionId) || !isValidUUID(wbsTemplateId)) {
      return res.status(400).json({ message: 'Invalid program ID, version ID, or WBS template ID' });
    }

    const result = await BOEService.importWBSTemplateIntoBOE(versionId, wbsTemplateId);
    res.json(result);
  } catch (error) {
    console.error('Error importing WBS template into BOE:', error);
    res.status(500).json({ message: 'Error importing WBS template into BOE', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe/{versionId}/push-to-program-wbs:
 *   post:
 *     summary: Push BOE WBS structure to program WBS
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
router.post('/programs/:id/boe/:versionId/push-to-program-wbs', async (req, res) => {
  try {
    const { id, versionId } = req.params;
    
    if (!isValidUUID(id) || !isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid program ID or version ID' });
    }

    const result = await BOEService.pushBOEWBSToProgram(versionId);
    res.json(result);
  } catch (error) {
    console.error('Error pushing BOE WBS to program:', error);
    res.status(500).json({ message: 'Error pushing BOE WBS to program', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe/{versionId}:
 *   delete:
 *     summary: Delete BOE version (draft only)
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
 *     responses:
 *       200:
 *         description: BOE version deleted successfully
 *       400:
 *         description: Invalid program ID or version ID
 *       403:
 *         description: Cannot delete non-draft BOE
 *       404:
 *         description: BOE version not found
 *       500:
 *         description: Server error
 */
router.delete('/programs/:id/boe/:versionId', async (req, res) => {
  try {
    const { id, versionId } = req.params;
    
    if (!isValidUUID(id) || !isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid program ID or version ID' });
    }

    const result = await BOEService.deleteBOEVersion(versionId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting BOE version:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot delete BOE with status')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
    }
    
    res.status(500).json({ message: 'Error deleting BOE version', error });
  }
});

export default router; 