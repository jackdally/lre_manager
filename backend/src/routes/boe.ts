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
    template.version = req.body.version || '1.0.0';
    template.majorVersion = req.body.majorVersion || 1;
    template.minorVersion = req.body.minorVersion || 0;
    template.patchVersion = req.body.patchVersion || 0;
    template.isActive = req.body.isActive !== undefined ? req.body.isActive : true;
    template.isLatestVersion = true;
    template.isPublic = req.body.isPublic || false;
    template.sharedWithUsers = req.body.sharedWithUsers || [];
    template.sharedWithRoles = req.body.sharedWithRoles || [];
    template.accessLevel = req.body.accessLevel || 'Private';
    template.allowCopy = req.body.allowCopy || false;
    template.allowModify = req.body.allowModify || false;
    template.createdBy = req.body.userId || req.headers['user-id'] as string || null;
    template.updatedBy = req.body.userId || req.headers['user-id'] as string || null;

    const savedTemplate = await boeTemplateRepository.save(template);

    res.status(201).json(savedTemplate);
  } catch (error) {
    console.error('Error creating BOE template:', error);
    res.status(500).json({ message: 'Error creating BOE template', error });
  }
});

/**
 * @swagger
 * /api/boe-templates/{id}/versions:
 *   post:
 *     summary: Create new version of BOE template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 */
router.post('/boe-templates/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers['user-id'] as string;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const newVersion = await BOETemplateService.createNewVersion(id, req.body, userId);
    res.status(201).json(newVersion);
  } catch (error) {
    console.error('Error creating template version:', error);
    res.status(500).json({ message: 'Error creating template version', error });
  }
});

/**
 * @swagger
 * /api/boe-templates/{id}/versions:
 *   get:
 *     summary: Get version history for BOE template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 */
router.get('/boe-templates/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const versionHistory = await BOETemplateService.getVersionHistory(id);
    res.json(versionHistory);
  } catch (error) {
    console.error('Error fetching template version history:', error);
    res.status(500).json({ message: 'Error fetching template version history', error });
  }
});

/**
 * @swagger
 * /api/boe-templates/compare:
 *   post:
 *     summary: Compare two template versions
 */
router.post('/boe-templates/compare', async (req, res) => {
  try {
    const { version1Id, version2Id } = req.body;
    
    if (!version1Id || !version2Id) {
      return res.status(400).json({ message: 'Both version IDs are required' });
    }

    if (!isValidUUID(version1Id) || !isValidUUID(version2Id)) {
      return res.status(400).json({ message: 'Invalid version ID' });
    }

    const comparison = await BOETemplateService.compareVersions(version1Id, version2Id);
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing template versions:', error);
    res.status(500).json({ message: 'Error comparing template versions', error });
  }
});

/**
 * @swagger
 * /api/boe-templates/{id}/rollback/{targetVersionId}:
 *   post:
 *     summary: Rollback template to previous version
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Current template ID
 *       - in: path
 *         name: targetVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target version ID to rollback to
 */
router.post('/boe-templates/:id/rollback/:targetVersionId', async (req, res) => {
  try {
    const { id, targetVersionId } = req.params;
    const userId = req.body.userId || req.headers['user-id'] as string;
    
    if (!isValidUUID(id) || !isValidUUID(targetVersionId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const newVersion = await BOETemplateService.rollbackToVersion(id, targetVersionId, userId);
    res.status(201).json(newVersion);
  } catch (error) {
    console.error('Error rolling back template version:', error);
    res.status(500).json({ message: 'Error rolling back template version', error });
  }
});

/**
 * @swagger
 * /api/boe-templates/accessible:
 *   get:
 *     summary: Get templates accessible to current user
 */
router.get('/boe-templates/accessible', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    const userRoles = req.headers['user-roles'] as string;
    
    const accessibleTemplates = await BOETemplateService.getAccessibleTemplates(
      userId, 
      userRoles ? userRoles.split(',') : undefined
    );
    
    res.json(accessibleTemplates);
  } catch (error) {
    console.error('Error fetching accessible templates:', error);
    res.status(500).json({ message: 'Error fetching accessible templates', error });
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

    const result = await BOEService.pushBOEToLedger(versionId);
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

export default router; 