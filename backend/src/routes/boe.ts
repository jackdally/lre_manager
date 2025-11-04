import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';
import { BOEVersion } from '../entities/BOEVersion';
import { BOEElement } from '../entities/BOEElement';
import { BOETemplate } from '../entities/BOETemplate';
import { BOETemplateElement } from '../entities/BOETemplateElement';
import { BOEApproval } from '../entities/BOEApproval';
import { ManagementReserve } from '../entities/ManagementReserve';
import { BOEComment } from '../entities/BOEComment';
import { BOEElementAllocation } from '../entities/BOEElementAllocation';
import { BOEService } from '../services/boeService';
import { BOETemplateService } from '../services/boeTemplateService';
import { BOECommentService } from '../services/boeCommentService';
import { WbsTemplate } from '../entities/WbsTemplate';
import { ApprovalWorkflowService } from '../services/approvalWorkflowService';
import { BOEValidationService } from '../services/boeValidationService';
import { ProgramSetupService } from '../services/programSetupService';

const router = Router();
const programRepository = AppDataSource.getRepository(Program);
const boeVersionRepository = AppDataSource.getRepository(BOEVersion);
const boeElementRepository = AppDataSource.getRepository(BOEElement);
const boeTemplateRepository = AppDataSource.getRepository(BOETemplate);
const boeTemplateElementRepository = AppDataSource.getRepository(BOETemplateElement);
const boeApprovalRepository = AppDataSource.getRepository(BOEApproval);
const managementReserveRepository = AppDataSource.getRepository(ManagementReserve);
const boeCommentRepository = AppDataSource.getRepository(BOEComment);
const elementAllocationRepository = AppDataSource.getRepository(BOEElementAllocation);
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
        relations: ['elements', 'elements.allocations', 'elements.costCategory', 'elements.vendor', 'approvals']
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
    const requiredFields = ['name', 'description'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields
      });
    }

    let savedBOE;

    // Auto-generate version number if not provided
    const versionNumber = req.body.versionNumber || await generateNextVersionNumber(id);

    // Check if this is a template-based creation with allocations
    if (req.body.templateId && req.body.allocations) {
      // Create BOE from template with allocations
      savedBOE = await BOEService.createBOEFromTemplateWithAllocations(
        id,
        req.body.templateId,
        {
          versionNumber: versionNumber,
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
          versionNumber: versionNumber,
          name: req.body.name,
          description: req.body.description
        }
      );
    } else if (req.body.elements && req.body.elements.length > 0) {
      // Create BOE with manual elements and allocations
      savedBOE = await BOEService.createBOEWithElements(
        id,
        {
          versionNumber: versionNumber,
          name: req.body.name,
          description: req.body.description
        },
        req.body.elements,
        req.body.allocations || []
      );
    } else {
      // Create basic BOE version
      const boeVersion = new BOEVersion();
      boeVersion.versionNumber = versionNumber;
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

    // Update setup status to mark BOE as created
    try {
      await ProgramSetupService.markBOECreated(id);
    } catch (error) {
      console.error('Error updating setup status after BOE creation:', error);
      // Don't fail BOE creation if setup status update fails
    }

    // Load the complete BOE with elements and allocations for the response
    const completeBOE = await boeVersionRepository.findOne({
      where: { id: savedBOE.id },
      relations: ['elements', 'elements.allocations', 'elements.costCategory', 'elements.vendor']
    });

    res.status(201).json(completeBOE);
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
 * /api/boe-templates/{id}:
 *   get:
 *     summary: Get a BOE template by ID (with elements)
 */
router.get('/boe-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const template = await boeTemplateRepository.findOne({ where: { id }, relations: ['elements'] });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching BOE template:', error);
    res.status(500).json({ message: 'Error fetching BOE template', error });
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

    // Optionally persist elements if provided
    if (Array.isArray(req.body.elements) && req.body.elements.length > 0) {
      const flattenAndInsert = async (nodes: any[], parentId?: string) => {
        for (const n of nodes) {
          const el = new BOETemplateElement();
          el.code = n.code || '';
          el.name = n.name || '';
          el.description = n.description || '';
          el.level = n.level || (parentId ? 2 : 1);
          el.parentElementId = parentId;
          el.costCategoryId = n.costCategoryId || null;
          el.estimatedCost = n.estimatedCost ?? null;
          el.managementReservePercentage = n.managementReservePercentage ?? null;
          el.isRequired = n.isRequired !== undefined ? n.isRequired : true;
          el.isOptional = n.isOptional !== undefined ? n.isOptional : false;
          el.notes = n.notes ?? null;
          el.template = savedTemplate as any;
          const saved = await boeTemplateElementRepository.save(el);
          if (Array.isArray(n.childElements) && n.childElements.length > 0) {
            await flattenAndInsert(n.childElements, saved.id);
          }
        }
      };

      await flattenAndInsert(req.body.elements);
    }

    res.status(201).json(await boeTemplateRepository.findOne({ where: { id: savedTemplate.id }, relations: ['elements'] }));
  } catch (error) {
    console.error('Error creating BOE template:', error);
    res.status(500).json({ message: 'Error creating BOE template', error });
  }
});

// Note: Complex versioning routes have been removed as part of BOE-078F template simplification
/**
 * @swagger
 * /api/boe-templates/{id}:
 *   put:
 *     summary: Update BOE template and its elements
 */
router.put('/boe-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const template = await boeTemplateRepository.findOne({ where: { id } });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Update basic fields
    if (req.body.name) template.name = req.body.name;
    if (req.body.description) template.description = req.body.description;
    if (req.body.category) template.category = req.body.category;
    if (req.body.version) template.version = req.body.version;
    if (req.body.isDefault !== undefined) template.isDefault = !!req.body.isDefault;
    if (req.body.isActive !== undefined) template.isActive = !!req.body.isActive;
    template.updatedBy = (req.body.userId || (req.headers['user-id'] as string)) || null;

    await boeTemplateRepository.save(template);

    // If elements provided, replace existing elements
    if (Array.isArray(req.body.elements)) {
      // Remove existing elements for this template
      const existing = await boeTemplateElementRepository.find({ where: { template: { id } } });
      if (existing.length > 0) {
        await boeTemplateElementRepository.remove(existing);
      }

      const flattenAndInsert = async (nodes: any[], parentId?: string) => {
        for (const n of nodes) {
          const el = new BOETemplateElement();
          el.code = n.code || '';
          el.name = n.name || '';
          el.description = n.description || '';
          el.level = n.level || (parentId ? 2 : 1);
          el.parentElementId = parentId;
          el.costCategoryId = n.costCategoryId || null;
          el.estimatedCost = n.estimatedCost ?? null;
          el.managementReservePercentage = n.managementReservePercentage ?? null;
          el.isRequired = n.isRequired !== undefined ? n.isRequired : true;
          el.isOptional = n.isOptional !== undefined ? n.isOptional : false;
          el.notes = n.notes ?? null;
          el.template = template as any;
          const saved = await boeTemplateElementRepository.save(el);
          if (Array.isArray(n.childElements) && n.childElements.length > 0) {
            await flattenAndInsert(n.childElements, saved.id);
          }
        }
      };

      await flattenAndInsert(req.body.elements);
    }

    const updated = await boeTemplateRepository.findOne({ where: { id }, relations: ['elements'] });
    res.json(updated);
  } catch (error) {
    console.error('Error updating BOE template:', error);
    res.status(500).json({ message: 'Error updating BOE template', error });
  }
});

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

    // Use ApprovalWorkflowService to submit for approval
    const updatedBOE = await ApprovalWorkflowService.submitForApproval(program.currentBOEVersionId);

    res.json(updatedBOE);
  } catch (error) {
    console.error('Error submitting BOE for approval:', error);
    // Extract the actual error message from the validation service
    const errorMessage = error instanceof Error ? error.message : 'Error submitting BOE for approval';
    res.status(500).json({ message: errorMessage });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe/{versionId}/revert-to-draft:
 *   post:
 *     summary: Revert BOE version to draft status
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
router.post('/programs/:id/boe/:versionId/revert-to-draft', async (req, res) => {
  try {
    const { id, versionId } = req.params;

    if (!isValidUUID(id) || !isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id: versionId },
      relations: ['program']
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    if (boeVersion.status !== 'Under Review') {
      return res.status(400).json({ message: 'Only BOEs under review can be reverted to draft' });
    }

    // Revert to draft status
    boeVersion.status = 'Draft';
    boeVersion.updatedAt = new Date();
    await boeVersionRepository.save(boeVersion);

    // Clear any existing approvals
    await boeApprovalRepository.delete({ boeVersion: { id: versionId } });

    res.json(boeVersion);
  } catch (error) {
    console.error('Error reverting BOE to draft:', error);
    res.status(500).json({ message: 'Error reverting BOE to draft', error });
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
    const { approvedBy, comments, approvalLevel, action } = req.body;

    if (!isValidUUID(id) || !isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
    }

    if (!approvalLevel || typeof approvalLevel !== 'number') {
      return res.status(400).json({ message: 'Approval level is required' });
    }

    // Use ApprovalWorkflowService to process approval action
    const updatedBOE = await ApprovalWorkflowService.processApprovalAction(
      versionId,
      approvalLevel,
      action,
      approvedBy || 'Unknown Approver',
      comments,
      action === 'reject' ? req.body.rejectionReason : undefined
    );

    res.json(updatedBOE);
  } catch (error) {
    console.error('Error processing BOE approval action:', error);
    res.status(500).json({ message: 'Error processing BOE approval action', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{versionId}/approval-status:
 *   get:
 *     summary: Get approval status for BOE version
 *     parameters:
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.get('/boe-versions/:versionId/approval-status', async (req, res) => {
  try {
    const { versionId } = req.params;

    if (!isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid version ID' });
    }

    const approvalStatus = await ApprovalWorkflowService.getApprovalStatus(versionId);
    res.json(approvalStatus);
  } catch (error) {
    console.error('Error getting approval status:', error);
    res.status(500).json({ message: 'Error getting approval status', error });
  }
});



/**
 * @swagger
 * /api/boe-approval/workflow-config:
 *   get:
 *     summary: Get approval workflow configuration
 */
router.get('/boe-approval/workflow-config', async (req, res) => {
  try {
    const config = ApprovalWorkflowService.getWorkflowConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting workflow config:', error);
    res.status(500).json({ message: 'Error getting workflow config', error });
  }
});

/**
 * @swagger
 * /api/boe-approval/workflow-config:
 *   put:
 *     summary: Update approval workflow configuration
 */
router.put('/boe-approval/workflow-config', async (req, res) => {
  try {
    const config = req.body;
    ApprovalWorkflowService.updateWorkflowConfig(config);
    res.json({ message: 'Workflow configuration updated successfully' });
  } catch (error) {
    console.error('Error updating workflow config:', error);
    res.status(500).json({ message: 'Error updating workflow config', error });
  }
});

/**
 * @swagger
 * /api/boe-approval/check-escalations:
 *   post:
 *     summary: Check and process approval escalations
 */
router.post('/boe-approval/check-escalations', async (req, res) => {
  try {
    await ApprovalWorkflowService.checkEscalations();
    res.json({ message: 'Escalation check completed' });
  } catch (error) {
    console.error('Error checking escalations:', error);
    res.status(500).json({ message: 'Error checking escalations', error });
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

    // Reload with relations to include costCategory and vendor
    const elementWithRelations = await boeElementRepository.findOne({
      where: { id: updatedElement.id },
      relations: ['costCategory', 'vendor', 'boeVersion']
    });

    res.json(elementWithRelations);
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
    // Extract the actual error message from the validation service
    const errorMessage = error instanceof Error ? error.message : 'Error pushing BOE to ledger';
    res.status(500).json({ message: errorMessage });
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

// ============================================================================
// MANAGEMENT RESERVE API ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/boe-versions/{boeVersionId}/management-reserve:
 *   get:
 *     summary: Get management reserve for BOE version
 *     parameters:
 *       - in: path
 *         name: boeVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.get('/boe-versions/:boeVersionId/management-reserve', async (req, res) => {
  try {
    const { boeVersionId } = req.params;

    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const mr = await managementReserveRepository.findOne({
      where: { boeVersion: { id: boeVersionId } },
      relations: ['boeVersion']
    });

    if (!mr) {
      return res.status(404).json({ message: 'Management reserve not found for this BOE version' });
    }

    res.json(mr);
  } catch (error) {
    console.error('Error fetching management reserve:', error);
    res.status(500).json({ message: 'Error fetching management reserve', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{boeVersionId}/management-reserve:
 *   put:
 *     summary: Update management reserve for BOE version
 *     parameters:
 *       - in: path
 *         name: boeVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.put('/boe-versions/:boeVersionId/management-reserve', async (req, res) => {
  try {
    const { boeVersionId } = req.params;
    const mrData = req.body;

    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    // Find existing MR record
    let mr = await managementReserveRepository.findOne({
      where: { boeVersion: { id: boeVersionId } },
      relations: ['boeVersion']
    });

    if (!mr) {
      // Create new MR record if it doesn't exist
      const boeVersion = await boeVersionRepository.findOne({
        where: { id: boeVersionId }
      });

      if (!boeVersion) {
        return res.status(404).json({ message: 'BOE version not found' });
      }

      mr = new ManagementReserve();
      mr.boeVersion = boeVersion;
      mr.baselineAmount = 0;
      mr.baselinePercentage = 0;
      mr.calculationMethod = 'Standard';
    }

    // Update MR fields
    if (mrData.baselineAmount !== undefined) {
      mr.baselineAmount = Number(mrData.baselineAmount);
    }
    if (mrData.baselinePercentage !== undefined) {
      mr.baselinePercentage = Number(mrData.baselinePercentage);
    }
    if (mrData.adjustedAmount !== undefined) {
      mr.adjustedAmount = Number(mrData.adjustedAmount);
    }
    if (mrData.adjustedPercentage !== undefined) {
      mr.adjustedPercentage = Number(mrData.adjustedPercentage);
    }
    if (mrData.calculationMethod !== undefined) {
      mr.calculationMethod = mrData.calculationMethod;
    }
    if (mrData.justification !== undefined) {
      mr.justification = mrData.justification;
    }
    if (mrData.riskFactors !== undefined) {
      mr.riskFactors = mrData.riskFactors;
    }
    if (mrData.notes !== undefined) {
      mr.notes = mrData.notes;
    }

    // Recalculate remaining amount
    mr.remainingAmount = Math.max(0, Number(mr.adjustedAmount) - Number(mr.utilizedAmount));
    mr.utilizationPercentage = Number(mr.adjustedAmount) > 0 ? (Number(mr.utilizedAmount) / Number(mr.adjustedAmount)) * 100 : 0;
    mr.updatedAt = new Date();

    const updatedMR = await managementReserveRepository.save(mr);
    res.json(updatedMR);
  } catch (error) {
    console.error('Error updating management reserve:', error);
    res.status(500).json({ message: 'Error updating management reserve', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{boeVersionId}/management-reserve/calculate:
 *   post:
 *     summary: Calculate management reserve for BOE version
 *     parameters:
 *       - in: path
 *         name: boeVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.post('/boe-versions/:boeVersionId/management-reserve/calculate', async (req, res) => {
  try {
    const { boeVersionId } = req.params;
    const { method, customPercentage } = req.body;

    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId }
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    // Calculate MR using BOEService
    const totalCost = boeVersion.totalEstimatedCost || 0;
    const mrCalculation = BOEService.calculateManagementReserve(totalCost, method, customPercentage);

    // Find or create MR record
    let mr = await managementReserveRepository.findOne({
      where: { boeVersion: { id: boeVersionId } }
    });

    if (!mr) {
      mr = new ManagementReserve();
      mr.boeVersion = boeVersion;
      mr.baselineAmount = mrCalculation.amount;
      mr.baselinePercentage = mrCalculation.percentage;
      mr.calculationMethod = method || 'Standard';
    } else {
      mr.baselineAmount = mrCalculation.amount;
      mr.baselinePercentage = mrCalculation.percentage;
      mr.calculationMethod = method || 'Standard';
    }

    // Set adjusted values to baseline initially
    mr.adjustedAmount = mrCalculation.amount;
    mr.adjustedPercentage = mrCalculation.percentage;
    mr.remainingAmount = Math.max(0, Number(mrCalculation.amount) - Number(mr.utilizedAmount));
    mr.utilizationPercentage = Number(mrCalculation.amount) > 0 ? (Number(mr.utilizedAmount) / Number(mrCalculation.amount)) * 100 : 0;
    mr.updatedAt = new Date();

    const updatedMR = await managementReserveRepository.save(mr);
    res.json(updatedMR);
  } catch (error) {
    console.error('Error calculating management reserve:', error);
    res.status(500).json({ message: 'Error calculating management reserve', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{boeVersionId}/management-reserve/calculate-breakdown:
 *   post:
 *     summary: Calculate management reserve with breakdown information
 *     parameters:
 *       - in: path
 *         name: boeVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.post('/boe-versions/:boeVersionId/management-reserve/calculate-breakdown', async (req, res) => {
  try {
    const { boeVersionId } = req.params;
    const { method, customPercentage, projectComplexity, riskFactors } = req.body;

    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId }
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    const totalCost = boeVersion.totalEstimatedCost || 0;

    // Calculate base percentage based on method
    let basePercentage = 10; // Default
    let complexityAdjustment = 0;
    let riskAdjustment = 0;

    switch (method) {
      case 'Standard':
        basePercentage = totalCost > 1000000 ? 10 : totalCost > 500000 ? 12 : 15;
        break;
      case 'Risk-Based':
        basePercentage = totalCost > 1000000 ? 8 : totalCost > 500000 ? 10 : 12;

        // Add complexity adjustment
        if (projectComplexity === 'High') {
          complexityAdjustment = 2;
        } else if (projectComplexity === 'Medium') {
          complexityAdjustment = 1;
        }

        // Add risk factor adjustments
        if (riskFactors && Array.isArray(riskFactors)) {
          riskAdjustment = riskFactors.length * 0.5; // 0.5% per risk factor
        }
        break;
      case 'Custom':
        basePercentage = customPercentage || 10;
        break;
    }

    const finalPercentage = Math.min(25, Math.max(5, basePercentage + complexityAdjustment + riskAdjustment));
    const amount = totalCost > 0 ? (totalCost * finalPercentage) / 100 : 0;

    const result = {
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round(finalPercentage * 100) / 100,
      breakdown: {
        basePercentage: Math.round(basePercentage * 100) / 100,
        complexityAdjustment: Math.round(complexityAdjustment * 100) / 100,
        riskAdjustment: Math.round(riskAdjustment * 100) / 100,
        finalPercentage: Math.round(finalPercentage * 100) / 100,
        roAdjustment: 0 // Placeholder for future R&O integration
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Error calculating management reserve breakdown:', error);
    res.status(500).json({ message: 'Error calculating management reserve breakdown', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{boeVersionId}/management-reserve/utilize:
 *   post:
 *     summary: Utilize management reserve
 *     parameters:
 *       - in: path
 *         name: boeVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.post('/boe-versions/:boeVersionId/management-reserve/utilize', async (req, res) => {
  try {
    const { boeVersionId } = req.params;
    const { amount, reason, description } = req.body;

    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid utilization amount' });
    }

    const mr = await managementReserveRepository.findOne({
      where: { boeVersion: { id: boeVersionId } }
    });

    if (!mr) {
      return res.status(404).json({ message: 'Management reserve not found for this BOE version' });
    }

    // Check if utilization amount exceeds remaining amount
    if (amount > mr.remainingAmount) {
      return res.status(400).json({
        message: 'Utilization amount exceeds remaining management reserve',
        remainingAmount: mr.remainingAmount,
        requestedAmount: amount
      });
    }

    // Update utilization
    mr.utilizedAmount = Number(mr.utilizedAmount) + Number(amount);
    mr.remainingAmount = Math.max(0, Number(mr.adjustedAmount) - Number(mr.utilizedAmount));
    mr.utilizationPercentage = Number(mr.adjustedAmount) > 0 ? (Number(mr.utilizedAmount) / Number(mr.adjustedAmount)) * 100 : 0;
    mr.updatedAt = new Date();

    // Add utilization note
    const utilizationNote = `Utilized $${amount.toFixed(2)} on ${new Date().toISOString().split('T')[0]}. Reason: ${reason}${description ? `. Description: ${description}` : ''}`;
    mr.notes = mr.notes ? `${mr.notes}\n${utilizationNote}` : utilizationNote;

    const updatedMR = await managementReserveRepository.save(mr);
    res.json(updatedMR);
  } catch (error) {
    console.error('Error utilizing management reserve:', error);
    res.status(500).json({ message: 'Error utilizing management reserve', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{boeVersionId}/management-reserve/history:
 *   get:
 *     summary: Get management reserve utilization history
 *     parameters:
 *       - in: path
 *         name: boeVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.get('/boe-versions/:boeVersionId/management-reserve/history', async (req, res) => {
  try {
    const { boeVersionId } = req.params;

    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const mr = await managementReserveRepository.findOne({
      where: { boeVersion: { id: boeVersionId } }
    });

    if (!mr) {
      return res.status(404).json({ message: 'Management reserve not found for this BOE version' });
    }

    // For now, return a simple history based on notes
    // In the future, this could be a separate table with detailed utilization records
    const history = [];

    if (mr.notes) {
      const noteLines = mr.notes.split('\n').filter(line => line.trim().startsWith('Utilized'));
      history.push(...noteLines.map((line, index) => ({
        id: `utilization-${index}`,
        amount: parseFloat(line.match(/\$([\d.]+)/)?.[1] || '0'),
        reason: line.match(/Reason: (.+?)(?:\. Description:|$)/)?.[1] || '',
        description: line.match(/Description: (.+)$/)?.[1] || '',
        date: line.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || new Date().toISOString().split('T')[0],
        type: 'utilization'
      })));
    }

    res.json(history);
  } catch (error) {
    console.error('Error fetching management reserve history:', error);
    res.status(500).json({ message: 'Error fetching management reserve history', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{boeVersionId}/management-reserve/utilization:
 *   get:
 *     summary: Get management reserve utilization summary
 *     parameters:
 *       - in: path
 *         name: boeVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.get('/boe-versions/:boeVersionId/management-reserve/utilization', async (req, res) => {
  try {
    const { boeVersionId } = req.params;

    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const mr = await managementReserveRepository.findOne({
      where: { boeVersion: { id: boeVersionId } }
    });

    if (!mr) {
      return res.status(404).json({ message: 'Management reserve not found for this BOE version' });
    }

    const utilization = {
      baselineAmount: mr.baselineAmount,
      adjustedAmount: mr.adjustedAmount,
      utilizedAmount: mr.utilizedAmount,
      remainingAmount: mr.remainingAmount,
      utilizationPercentage: mr.utilizationPercentage,
      calculationMethod: mr.calculationMethod,
      lastUpdated: mr.updatedAt
    };

    res.json(utilization);
  } catch (error) {
    console.error('Error fetching management reserve utilization:', error);
    res.status(500).json({ message: 'Error fetching management reserve utilization', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe/create-version:
 *   post:
 *     summary: Create a new BOE version from current BOE
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
 *               creationMethod:
 *                 type: string
 *                 enum: [version-from-current, from-template, manual]
 *                 description: Method of BOE creation
 *               changeSummary:
 *                 type: string
 *                 description: Summary of changes for new version
 *               wizardData:
 *                 type: object
 *                 description: BOE wizard data
 */
router.post('/programs/:id/boe/create-version', async (req, res) => {
  try {
    const { id } = req.params;
    const { creationMethod, changeSummary, wizardData } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    // Validate creation method
    if (!['version-from-current', 'from-template', 'manual'].includes(creationMethod)) {
      return res.status(400).json({ message: 'Invalid creation method' });
    }

    // Get current BOE
    const currentBOE = await boeVersionRepository.findOne({
      where: { program: { id } },
      relations: ['elements']
    });

    // Check if this is the current BOE
    const isCurrentBOE = currentBOE && currentBOE.program?.currentBOEVersionId === currentBOE.id;

    let newVersion;
    let versionNumber;

    if (creationMethod === 'version-from-current') {
      // Validate change summary is provided
      if (!changeSummary || changeSummary.trim().length === 0) {
        return res.status(400).json({ message: 'Change summary is required for version creation' });
      }

      if (!currentBOE) {
        return res.status(404).json({ message: 'No current BOE found to create version from' });
      }

      // Generate next version number
      versionNumber = await generateNextVersionNumber(id);

      // Create new version using existing service method
      newVersion = await BOEService.createBOEWithElements(
        id,
        {
          versionNumber,
          name: `${currentBOE.name} (v${versionNumber.replace('v', '')})`,
          description: `${currentBOE.description || ''}\n\nChange Summary: ${changeSummary}`,
          changeSummary: changeSummary,
          justification: changeSummary
        },
        currentBOE.elements || [],
        [] // No allocations for now - they'll be copied by the service
      );

      // Update program's current BOE version
      await programRepository.update(id, { currentBOEVersionId: newVersion.id });

    } else if (creationMethod === 'from-template') {
      // Handle template-based creation - use existing BOE creation logic
      // For now, we'll use the same version-from-current logic since templates are handled in the wizard
      versionNumber = await generateNextVersionNumber(id);

      // Create new version using existing service method with template data
      newVersion = await BOEService.createBOEWithElements(
        id,
        {
          versionNumber,
          name: wizardData?.name || `New BOE from Template (${versionNumber})`,
          description: wizardData?.description || `BOE created from template with changes: ${changeSummary}`,
          changeSummary: changeSummary,
          justification: changeSummary
        },
        wizardData?.elements || [],
        wizardData?.allocations || []
      );

      // Update program's current BOE version
      await programRepository.update(id, { currentBOEVersionId: newVersion.id });

    } else if (creationMethod === 'manual') {
      // Handle manual creation - use existing BOE creation logic
      versionNumber = await generateNextVersionNumber(id);

      // Create new version using existing service method with manual data
      newVersion = await BOEService.createBOEWithElements(
        id,
        {
          versionNumber,
          name: wizardData?.name || `New Manual BOE (${versionNumber})`,
          description: wizardData?.description || `Manually created BOE with changes: ${changeSummary}`,
          changeSummary: changeSummary,
          justification: changeSummary
        },
        wizardData?.elements || [],
        wizardData?.allocations || []
      );

      // Update program's current BOE version
      await programRepository.update(id, { currentBOEVersionId: newVersion.id });
    }

    // Fetch the complete new version with relations
    const completeVersion = await boeVersionRepository.findOne({
      where: { id: newVersion.id },
      relations: ['elements', 'elements.allocations', 'approvals']
    });

    res.status(201).json({
      message: 'BOE version created successfully',
      boeVersion: completeVersion
    });

  } catch (error) {
    console.error('Error creating BOE version:', error);
    res.status(500).json({ message: 'Error creating BOE version', error });
  }
});

/**
 * @swagger
 * /api/programs/{id}/boe-versions:
 *   get:
 *     summary: Get all BOE versions for a program
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 */
router.get('/programs/:id/boe-versions', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const boeVersions = await boeVersionRepository.find({
      where: { program: { id } },
      relations: ['elements', 'approvals'],
      order: { createdAt: 'DESC' }
    });

    res.json(boeVersions);
  } catch (error) {
    console.error('Error fetching BOE versions:', error);
    res.status(500).json({ message: 'Error fetching BOE versions', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{versionId}/approvals:
 *   get:
 *     summary: Get all approvals for BOE version
 *     parameters:
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.get('/boe-versions/:versionId/approvals', async (req, res) => {
  try {
    const { versionId } = req.params;

    if (!isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid version ID' });
    }

    // Check if BOE version exists
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: versionId }
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    // Get all approvals for this BOE version
    const approvals = await boeApprovalRepository.find({
      where: { boeVersion: { id: versionId } },
      order: { sequenceOrder: 'ASC', createdAt: 'ASC' }
    });

    res.json(approvals);
  } catch (error) {
    console.error('Error getting approvals:', error);
    res.status(500).json({ message: 'Error getting approvals', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{versionId}/approvals:
 *   post:
 *     summary: Create approval for BOE version
 *     parameters:
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.post('/boe-versions/:versionId/approvals', async (req, res) => {
  try {
    const { versionId } = req.params;
    const approvalData = req.body;

    if (!isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid version ID' });
    }

    // Check if BOE version exists
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: versionId }
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    // Create new approval
    const approval = boeApprovalRepository.create({
      ...approvalData,
      boeVersion: { id: versionId }
    });

    const savedApproval = await boeApprovalRepository.save(approval);
    res.status(201).json(savedApproval);
  } catch (error) {
    console.error('Error creating approval:', error);
    res.status(500).json({ message: 'Error creating approval', error });
  }
});

/**
 * @swagger
 * /api/boe-approvals/{approvalId}:
 *   put:
 *     summary: Update approval
 *     parameters:
 *       - in: path
 *         name: approvalId
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval ID
 */
router.put('/boe-approvals/:approvalId', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const updateData = req.body;

    if (!isValidUUID(approvalId)) {
      return res.status(400).json({ message: 'Invalid approval ID' });
    }

    // Check if approval exists
    const existingApproval = await boeApprovalRepository.findOne({
      where: { id: approvalId }
    });

    if (!existingApproval) {
      return res.status(404).json({ message: 'Approval not found' });
    }

    // Update approval
    await boeApprovalRepository.update(approvalId, updateData);

    // Get updated approval
    const updatedApproval = await boeApprovalRepository.findOne({
      where: { id: approvalId }
    });

    res.json(updatedApproval);
  } catch (error) {
    console.error('Error updating approval:', error);
    res.status(500).json({ message: 'Error updating approval', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{id}/history:
 *   get:
 *     summary: Get detailed version history for a BOE version
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.get('/boe-versions/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id },
      relations: ['elements', 'approvals', 'program']
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    // Get all versions for this program to show timeline
    const allVersions = await boeVersionRepository.find({
      where: { program: { id: boeVersion.program.id } },
      order: { createdAt: 'ASC' }
    });

    // Find the index of current version
    const currentIndex = allVersions.findIndex(v => v.id === id);
    const previousVersion = currentIndex > 0 ? allVersions[currentIndex - 1] : null;

    const history = {
      currentVersion: boeVersion,
      previousVersion,
      allVersions: allVersions.map(v => ({
        id: v.id,
        versionNumber: v.versionNumber,
        name: v.name,
        status: v.status,
        totalEstimatedCost: v.totalEstimatedCost,
        createdAt: v.createdAt,
        createdBy: v.createdBy,
        changeSummary: v.changeSummary
      })),
      timeline: allVersions.map((v, index) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        name: v.name,
        status: v.status,
        createdAt: v.createdAt,
        createdBy: v.createdBy,
        changeSummary: v.changeSummary,
        isCurrent: v.id === id,
        position: index + 1,
        totalVersions: allVersions.length
      }))
    };

    res.json(history);
  } catch (error) {
    console.error('Error fetching BOE version history:', error);
    res.status(500).json({ message: 'Error fetching BOE version history', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{id}/compare/{compareId}:
 *   get:
 *     summary: Compare two BOE versions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Base BOE Version ID
 *       - in: path
 *         name: compareId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comparison BOE Version ID
 */
router.get('/boe-versions/:id/compare/:compareId', async (req, res) => {
  try {
    const { id, compareId } = req.params;

    if (!isValidUUID(id) || !isValidUUID(compareId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const [baseVersion, compareVersion] = await Promise.all([
      boeVersionRepository.findOne({
        where: { id },
        relations: ['elements', 'approvals']
      }),
      boeVersionRepository.findOne({
        where: { id: compareId },
        relations: ['elements', 'approvals']
      })
    ]);

    if (!baseVersion || !compareVersion) {
      return res.status(404).json({ message: 'One or both BOE versions not found' });
    }

    // Compare versions
    const comparison = {
      baseVersion: {
        id: baseVersion.id,
        versionNumber: baseVersion.versionNumber,
        name: baseVersion.name,
        status: baseVersion.status,
        totalEstimatedCost: baseVersion.totalEstimatedCost,
        managementReserveAmount: baseVersion.managementReserveAmount,
        managementReservePercentage: baseVersion.managementReservePercentage,
        elements: baseVersion.elements,
        createdAt: baseVersion.createdAt
      },
      compareVersion: {
        id: compareVersion.id,
        versionNumber: compareVersion.versionNumber,
        name: compareVersion.name,
        status: compareVersion.status,
        totalEstimatedCost: compareVersion.totalEstimatedCost,
        managementReserveAmount: compareVersion.managementReserveAmount,
        managementReservePercentage: compareVersion.managementReservePercentage,
        elements: compareVersion.elements,
        createdAt: compareVersion.createdAt
      },
      changes: {
        costVariance: compareVersion.totalEstimatedCost - baseVersion.totalEstimatedCost,
        costVariancePercentage: ((compareVersion.totalEstimatedCost - baseVersion.totalEstimatedCost) / baseVersion.totalEstimatedCost) * 100,
        mrVariance: compareVersion.managementReserveAmount - baseVersion.managementReserveAmount,
        mrVariancePercentage: ((compareVersion.managementReservePercentage - baseVersion.managementReservePercentage) / baseVersion.managementReservePercentage) * 100,
        elementChanges: {
          added: compareVersion.elements.filter(e => !baseVersion.elements.find(be => be.id === e.id)),
          removed: baseVersion.elements.filter(e => !compareVersion.elements.find(ce => ce.id === e.id)),
          modified: baseVersion.elements.filter(be => {
            const ce = compareVersion.elements.find(e => e.id === be.id);
            return ce && (ce.estimatedCost !== be.estimatedCost || ce.description !== be.description);
          })
        }
      }
    };

    res.json(comparison);
  } catch (error) {
    console.error('Error comparing BOE versions:', error);
    res.status(500).json({ message: 'Error comparing BOE versions', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{id}/rollback:
 *   post:
 *     summary: Rollback to a previous BOE version
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID to rollback to
 */
router.post('/boe-versions/:id/rollback', async (req, res) => {
  try {
    const { id } = req.params;
    const { rollbackReason, createNewVersion = true } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const targetVersion = await boeVersionRepository.findOne({
      where: { id },
      relations: ['elements', 'elements.allocations', 'program']
    });

    if (!targetVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    if (targetVersion.status === 'Draft') {
      return res.status(400).json({ message: 'Cannot rollback to a draft version' });
    }

    let newVersion: BOEVersion | undefined;
    if (createNewVersion) {
      // Create a new version based on the target version
      const versionNumber = await generateNextVersionNumber(targetVersion.program.id);

      newVersion = boeVersionRepository.create({
        ...targetVersion,
        id: undefined, // Let TypeORM generate new ID
        versionNumber,
        name: `${targetVersion.name} (Rollback from v${targetVersion.versionNumber})`,
        description: `Rollback to version ${targetVersion.versionNumber}. ${rollbackReason || 'No reason provided'}`,
        status: 'Draft',
        changeSummary: `Rollback to version ${targetVersion.versionNumber}`,
        justification: rollbackReason,
        approvedBy: undefined,
        approvedAt: undefined,
        rejectedBy: undefined,
        rejectedAt: undefined,
        rejectionReason: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: req.body.createdBy || 'system',
        updatedBy: req.body.createdBy || 'system'
      });

      // Save the new version first to get the ID
      const savedVersion = await boeVersionRepository.save(newVersion);

      // Copy elements with allocations
      if (targetVersion.elements && targetVersion.elements.length > 0) {
        for (const element of targetVersion.elements) {
          const newElement = boeElementRepository.create({
            ...element,
            id: undefined, // Let TypeORM generate new ID
            boeVersion: savedVersion
          });
          const savedElement = await boeElementRepository.save(newElement);

          // Copy allocations for this element
          if (element.allocations && element.allocations.length > 0) {
            for (const allocation of element.allocations) {
              const newAllocation = elementAllocationRepository.create({
                ...allocation,
                id: undefined, // Let TypeORM generate new ID
                boeElement: savedElement,
                boeVersion: savedVersion
              });
              await elementAllocationRepository.save(newAllocation);
            }
          }
        }
      }

      // Copy management reserve if it exists
      const targetManagementReserve = await managementReserveRepository.findOne({
        where: { boeVersion: { id: targetVersion.id } }
      });

      if (targetManagementReserve) {
        const newManagementReserve = managementReserveRepository.create({
          ...targetManagementReserve,
          id: undefined, // Let TypeORM generate new ID
          boeVersion: savedVersion,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await managementReserveRepository.save(newManagementReserve);
      }

      await boeVersionRepository.save(savedVersion);

      // Update program to point to new version
      await programRepository.update(targetVersion.program.id, {
        currentBOEVersionId: newVersion.id,
        lastBOEUpdate: new Date()
      });
    }

    res.json({
      success: true,
      message: createNewVersion ? 'Rollback completed successfully' : 'Rollback prepared',
      newVersion: createNewVersion ? newVersion : null
    });
  } catch (error) {
    console.error('Error rolling back BOE version:', error);
    res.status(500).json({ message: 'Error rolling back BOE version', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{id}/comments:
 *   put:
 *     summary: Add or update comments for a BOE version
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 */
router.put('/boe-versions/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, changeSummary, justification } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id }
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    // Update comments and related fields
    if (comments !== undefined) {
      boeVersion.changeSummary = comments;
    }
    if (changeSummary !== undefined) {
      boeVersion.changeSummary = changeSummary;
    }
    if (justification !== undefined) {
      boeVersion.justification = justification;
    }

    boeVersion.updatedAt = new Date();
    boeVersion.updatedBy = req.body.updatedBy || 'system';

    const updatedVersion = await boeVersionRepository.save(boeVersion);

    res.json(updatedVersion);
  } catch (error) {
    console.error('Error updating BOE version comments:', error);
    res.status(500).json({ message: 'Error updating BOE version comments', error });
  }
});

// Helper function to generate next version number (sequential)
async function generateNextVersionNumber(programId: string): Promise<string> {
  const existingVersions = await boeVersionRepository.find({
    where: { program: { id: programId } },
    order: { createdAt: 'DESC' }
  });

  if (existingVersions.length === 0) {
    return 'v1';
  }

  // Parse the latest version number (v1, v2, v3, etc.)
  const latestVersion = existingVersions[0].versionNumber;
  const versionNumber = latestVersion.replace('v', '');
  const nextNumber = parseInt(versionNumber) + 1;

  return `v${nextNumber}`;
}

// R&O Integration placeholder endpoints (for future use)
router.get('/boe-versions/:boeVersionId/management-reserve/risk-matrix', async (req, res) => {
  try {
    const { boeVersionId } = req.params;

    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    // Placeholder response for future R&O integration
    res.json({
      message: 'R&O system not yet implemented',
      placeholder: true,
      riskMatrix: []
    });
  } catch (error) {
    console.error('Error fetching risk matrix:', error);
    res.status(500).json({ message: 'Error fetching risk matrix', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{boeVersionId}/management-reserve/calculate-ro-driven:
 *   post:
 *     summary: Calculate R&O-Driven Management Reserve
 *     description: Calculates MR based on actual risk data using severity-weighted expected values
 *     parameters:
 *       - in: path
 *         name: boeVersionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 *     responses:
 *       200:
 *         description: R&O-Driven MR calculation result
 *       400:
 *         description: Invalid BOE version ID
 *       404:
 *         description: BOE version not found
 *       500:
 *         description: Error calculating R&O-Driven MR
 */
router.post('/boe-versions/:boeVersionId/management-reserve/calculate-ro-driven', async (req, res) => {
  try {
    const { boeVersionId } = req.params;

    if (!isValidUUID(boeVersionId)) {
      return res.status(400).json({ message: 'Invalid BOE version ID' });
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId }
    });

    if (!boeVersion) {
      return res.status(404).json({ message: 'BOE version not found' });
    }

    // Get total cost from BOE
    const totalCost = boeVersion.totalEstimatedCost || 0;

    // Calculate R&O-Driven MR
    const result = await BOEService.calculateRODrivenMR(boeVersionId, totalCost);

    res.json(result);
  } catch (error) {
    console.error('Error calculating R&O-driven MR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error calculating R&O-driven MR';
    res.status(500).json({ message: errorMessage, error });
  }
});

// ============================================================================
// BOE Comments API Endpoints
// ============================================================================

/**
 * GET /api/boe-versions/:versionId/comments
 * Get all comments for a BOE version
 */
router.get('/boe-versions/:versionId/comments', async (req, res) => {
  try {
    const { versionId } = req.params;

    if (!isValidUUID(versionId)) {
      return res.status(400).json({ error: 'Invalid version ID' });
    }

    const comments = await BOECommentService.getCommentsByVersion(versionId);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching BOE comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * POST /api/boe-versions/:versionId/comments
 * Create a new comment for a BOE version
 */
router.post('/boe-versions/:versionId/comments', async (req, res) => {
  try {
    const { versionId } = req.params;
    const { commentType, comment, authorName, authorRole, authorEmail, isInternal } = req.body;

    if (!isValidUUID(versionId)) {
      return res.status(400).json({ error: 'Invalid version ID' });
    }

    const newComment = await BOECommentService.createComment({
      boeVersionId: versionId,
      commentType,
      comment,
      authorName,
      authorRole,
      authorEmail,
      isInternal
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error creating BOE comment:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
});

/**
 * GET /api/boe-versions/:versionId/comments/:commentId
 * Get a specific comment by ID
 */
router.get('/boe-versions/:versionId/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!isValidUUID(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await BOECommentService.getCommentById(commentId);
    res.json(comment);
  } catch (error) {
    console.error('Error fetching BOE comment:', error);
    if (error instanceof Error && error.message === 'Comment not found') {
      res.status(404).json({ error: 'Comment not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch comment' });
    }
  }
});

/**
 * PUT /api/boe-versions/:versionId/comments/:commentId
 * Update a comment
 */
router.put('/boe-versions/:versionId/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment, isResolved, resolvedBy, resolutionNotes } = req.body;

    if (!isValidUUID(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const updatedComment = await BOECommentService.updateComment(commentId, {
      comment,
      isResolved,
      resolvedBy,
      resolutionNotes
    });

    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating BOE comment:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update comment' });
    }
  }
});

/**
 * DELETE /api/boe-versions/:versionId/comments/:commentId
 * Delete a comment
 */
router.delete('/boe-versions/:versionId/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!isValidUUID(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    await BOECommentService.deleteComment(commentId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting BOE comment:', error);
    if (error instanceof Error && error.message === 'Comment not found') {
      res.status(404).json({ error: 'Comment not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }
});

/**
 * GET /api/boe-versions/:versionId/comments/stats
 * Get comment statistics for a BOE version
 */
router.get('/boe-versions/:versionId/comments/stats', async (req, res) => {
  try {
    const { versionId } = req.params;

    if (!isValidUUID(versionId)) {
      return res.status(400).json({ error: 'Invalid version ID' });
    }

    const stats = await BOECommentService.getCommentStats(versionId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching BOE comment stats:', error);
    res.status(500).json({ error: 'Failed to fetch comment statistics' });
  }
});

/**
 * POST /api/boe-versions/:versionId/comments/resolve
 * Resolve multiple comments at once
 */
router.post('/boe-versions/:versionId/comments/resolve', async (req, res) => {
  try {
    const { versionId } = req.params;
    const { commentIds, resolvedBy, resolutionNotes } = req.body;

    if (!isValidUUID(versionId)) {
      return res.status(400).json({ error: 'Invalid version ID' });
    }

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return res.status(400).json({ error: 'Comment IDs array is required' });
    }

    if (!resolvedBy) {
      return res.status(400).json({ error: 'Resolved by is required' });
    }

    const resolvedComments = await BOECommentService.resolveComments(
      commentIds,
      resolvedBy,
      resolutionNotes
    );

    res.json(resolvedComments);
  } catch (error) {
    console.error('Error resolving BOE comments:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to resolve comments' });
    }
  }
});

/**
 * @swagger
 * /api/boe-versions/{versionId}/validate:
 *   get:
 *     summary: Validate BOE version for approval submission
 *     parameters:
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 *     responses:
 *       200:
 *         description: Validation result
 *       400:
 *         description: Invalid version ID
 *       404:
 *         description: BOE version not found
 */
router.get('/boe-versions/:versionId/validate', async (req, res) => {
  try {
    const { versionId } = req.params;

    if (!isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid version ID' });
    }

    const validationResult = await BOEValidationService.validateBOEForApproval(versionId);
    res.json(validationResult);
  } catch (error) {
    console.error('Error validating BOE for approval:', error);
    res.status(500).json({ message: 'Error validating BOE for approval', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{versionId}/validate-ledger:
 *   get:
 *     summary: Validate BOE version for push to ledger
 *     parameters:
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 *     responses:
 *       200:
 *         description: Validation result
 *       400:
 *         description: Invalid version ID
 *       404:
 *         description: BOE version not found
 */
router.get('/boe-versions/:versionId/validate-ledger', async (req, res) => {
  try {
    const { versionId } = req.params;

    if (!isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid version ID' });
    }

    const validationResult = await BOEValidationService.validateBOEForLedgerPush(versionId);
    res.json(validationResult);
  } catch (error) {
    console.error('Error validating BOE for ledger push:', error);
    res.status(500).json({ message: 'Error validating BOE for ledger push', error });
  }
});

/**
 * @swagger
 * /api/boe-versions/{versionId}/validation-status:
 *   get:
 *     summary: Get validation status for BOE version
 *     parameters:
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: BOE Version ID
 *     responses:
 *       200:
 *         description: Validation status
 *       400:
 *         description: Invalid version ID
 *       404:
 *         description: BOE version not found
 */
router.get('/boe-versions/:versionId/validation-status', async (req, res) => {
  try {
    const { versionId } = req.params;

    if (!isValidUUID(versionId)) {
      return res.status(400).json({ message: 'Invalid version ID' });
    }

    const validationStatus = await BOEValidationService.getValidationStatus(versionId);
    res.json(validationStatus);
  } catch (error) {
    console.error('Error getting BOE validation status:', error);
    res.status(500).json({ message: 'Error getting BOE validation status', error });
  }
});

export default router; 