import { Router } from 'express';
import { RiskOpportunityService } from '../services/riskOpportunityService';
import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';
import { Risk } from '../entities/Risk';
import { Opportunity } from '../entities/Opportunity';

const router = Router();
const programRepository = AppDataSource.getRepository(Program);
const riskRepository = AppDataSource.getRepository(Risk);
const opportunityRepository = AppDataSource.getRepository(Opportunity);

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

/**
 * @swagger
 * /api/risks/{riskId}/utilize-mr:
 *   post:
 *     summary: Utilize Management Reserve for a materialized risk
 *     description: Links MR utilization to a specific risk entry and updates both the risk and MR records
 *     parameters:
 *       - in: path
 *         name: riskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Risk ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount of MR to utilize
 *               reason:
 *                 type: string
 *                 description: Reason for MR utilization
 *     responses:
 *       200:
 *         description: MR utilized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 risk:
 *                   $ref: '#/components/schemas/Risk'
 *                 managementReserve:
 *                   $ref: '#/components/schemas/ManagementReserve'
 *       400:
 *         description: Invalid request (invalid risk ID, amount, or reason)
 *       404:
 *         description: Risk not found or MR not found
 *       500:
 *         description: Error utilizing MR
 */
router.post('/risks/:riskId/utilize-mr', async (req, res) => {
  try {
    const { riskId } = req.params;
    const { amount, reason } = req.body;

    if (!isValidUUID(riskId)) {
      return res.status(400).json({ message: 'Invalid risk ID' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid utilization amount' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    // Verify risk exists
    const risk = await riskRepository.findOne({
      where: { id: riskId },
    });

    if (!risk) {
      return res.status(404).json({ message: 'Risk not found' });
    }

    const result = await RiskOpportunityService.utilizeMRForRisk(riskId, amount, reason);
    res.json(result);
  } catch (error) {
    console.error('Error utilizing MR for risk:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error utilizing MR';
    
    // Check for specific error types
    if (errorMessage.includes('exceeds remaining')) {
      return res.status(400).json({ message: errorMessage });
    }
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ message: errorMessage });
    }
    
    res.status(500).json({ message: errorMessage });
  }
});

// ==================== RISK ROUTES ====================

// GET /api/programs/:id/risks - List risks with filtering/sorting
router.get('/programs/:id/risks', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, severity, disposition, owner, search, sortBy, sortOrder } = req.query;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const queryBuilder = riskRepository
      .createQueryBuilder('risk')
      .leftJoinAndSelect('risk.category', 'category')
      .leftJoinAndSelect('risk.wbsElement', 'wbsElement')
      .where('risk.programId = :programId', { programId: id });

    // Apply filters
    if (category) {
      queryBuilder.andWhere('risk.categoryId = :categoryId', { categoryId: category });
    }
    if (severity) {
      queryBuilder.andWhere('risk.severity = :severity', { severity });
    }
    if (disposition) {
      queryBuilder.andWhere('risk.disposition = :disposition', { disposition });
    }
    if (owner) {
      queryBuilder.andWhere('risk.owner = :owner', { owner });
    }
    if (search) {
      queryBuilder.andWhere(
        '(risk.title ILIKE :search OR risk.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const sort = sortBy as string || 'createdAt';
    const order = (sortOrder as string || 'DESC').toUpperCase() as 'ASC' | 'DESC';
    queryBuilder.orderBy(`risk.${sort}`, order);

    const risks = await queryBuilder.getMany();

    // Calculate risk scores for each risk
    const risksWithScores = risks.map(risk => {
      const riskScore = RiskOpportunityService.calculateRiskScore(risk);
      const expectedValue = RiskOpportunityService.calculateExpectedValue(
        Number(risk.costImpactMin),
        Number(risk.costImpactMostLikely),
        Number(risk.costImpactMax)
      );
      return {
        ...risk,
        riskScore,
        expectedValue,
      };
    });

    res.json(risksWithScores);
  } catch (error) {
    console.error('Error fetching risks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching risks';
    res.status(500).json({ message: errorMessage });
  }
});

// POST /api/programs/:id/risks - Create new risk
router.post('/programs/:id/risks', async (req, res) => {
  try {
    const { id } = req.params;
    const riskData = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    // Verify program exists
    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    // Validate required fields
    if (!riskData.title || !riskData.severity || riskData.probability === undefined) {
      return res.status(400).json({ message: 'Title, severity, and probability are required' });
    }

    // Validate financial impact
    if (
      riskData.costImpactMin === undefined ||
      riskData.costImpactMostLikely === undefined ||
      riskData.costImpactMax === undefined
    ) {
      return res.status(400).json({ message: 'All cost impact fields are required' });
    }

    // Validate range
    if (
      Number(riskData.costImpactMin) > Number(riskData.costImpactMostLikely) ||
      Number(riskData.costImpactMostLikely) > Number(riskData.costImpactMax)
    ) {
      return res.status(400).json({ message: 'Invalid cost impact range: min <= mostLikely <= max' });
    }

    // Validate probability
    if (Number(riskData.probability) < 0 || Number(riskData.probability) > 100) {
      return res.status(400).json({ message: 'Probability must be between 0 and 100' });
    }

    const risk = riskRepository.create({
      program,
      title: riskData.title,
      description: riskData.description || null,
      categoryId: riskData.categoryId || null,
      costImpactMin: Number(riskData.costImpactMin),
      costImpactMostLikely: Number(riskData.costImpactMostLikely),
      costImpactMax: Number(riskData.costImpactMax),
      probability: Number(riskData.probability),
      severity: riskData.severity,
      owner: riskData.owner || null,
      identifiedDate: riskData.identifiedDate ? new Date(riskData.identifiedDate) : new Date(),
      targetMitigationDate: riskData.targetMitigationDate ? new Date(riskData.targetMitigationDate) : null,
      mitigationStrategy: riskData.mitigationStrategy || null,
      wbsElementId: riskData.wbsElementId || null,
      disposition: riskData.disposition || 'Identified',
      status: riskData.status || 'Identified',
    });

    const savedRisk = await riskRepository.save(risk);

    // If initial note provided, add it
    if (riskData.initialNote) {
      await RiskOpportunityService.addRiskNote(savedRisk.id, riskData.initialNote, riskData.createdBy);
    }

    // Fetch with relations
    const riskWithRelations = await riskRepository.findOne({
      where: { id: savedRisk.id },
      relations: ['category', 'wbsElement'],
    });

    const riskScore = RiskOpportunityService.calculateRiskScore(riskWithRelations!);
    const expectedValue = RiskOpportunityService.calculateExpectedValue(
      Number(riskWithRelations!.costImpactMin),
      Number(riskWithRelations!.costImpactMostLikely),
      Number(riskWithRelations!.costImpactMax)
    );

    res.status(201).json({
      ...riskWithRelations,
      riskScore,
      expectedValue,
    });
  } catch (error) {
    console.error('Error creating risk:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error creating risk';
    res.status(500).json({ message: errorMessage });
  }
});

// GET /api/risks/:id - Get single risk with notes
router.get('/risks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid risk ID' });
    }

    const risk = await riskRepository.findOne({
      where: { id },
      relations: ['category', 'wbsElement', 'notes'],
    });

    if (!risk) {
      return res.status(404).json({ message: 'Risk not found' });
    }

    const riskScore = RiskOpportunityService.calculateRiskScore(risk);
    const expectedValue = RiskOpportunityService.calculateExpectedValue(
      Number(risk.costImpactMin),
      Number(risk.costImpactMostLikely),
      Number(risk.costImpactMax)
    );

    res.json({
      ...risk,
      riskScore,
      expectedValue,
    });
  } catch (error) {
    console.error('Error fetching risk:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching risk';
    res.status(500).json({ message: errorMessage });
  }
});

// PUT /api/risks/:id - Update risk
router.put('/risks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const riskData = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid risk ID' });
    }

    const risk = await riskRepository.findOne({
      where: { id },
      relations: ['category', 'wbsElement'],
    });

    if (!risk) {
      return res.status(404).json({ message: 'Risk not found' });
    }

    // Validate financial impact if provided
    if (
      riskData.costImpactMin !== undefined ||
      riskData.costImpactMostLikely !== undefined ||
      riskData.costImpactMax !== undefined
    ) {
      const min = riskData.costImpactMin !== undefined ? Number(riskData.costImpactMin) : Number(risk.costImpactMin);
      const mostLikely = riskData.costImpactMostLikely !== undefined 
        ? Number(riskData.costImpactMostLikely) 
        : Number(risk.costImpactMostLikely);
      const max = riskData.costImpactMax !== undefined ? Number(riskData.costImpactMax) : Number(risk.costImpactMax);

      if (min > mostLikely || mostLikely > max) {
        return res.status(400).json({ message: 'Invalid cost impact range: min <= mostLikely <= max' });
      }
    }

    // Update fields
    if (riskData.title !== undefined) risk.title = riskData.title;
    if (riskData.description !== undefined) risk.description = riskData.description;
    if (riskData.categoryId !== undefined) risk.categoryId = riskData.categoryId;
    if (riskData.costImpactMin !== undefined) risk.costImpactMin = Number(riskData.costImpactMin);
    if (riskData.costImpactMostLikely !== undefined) risk.costImpactMostLikely = Number(riskData.costImpactMostLikely);
    if (riskData.costImpactMax !== undefined) risk.costImpactMax = Number(riskData.costImpactMax);
    if (riskData.probability !== undefined) {
      const prob = Number(riskData.probability);
      if (prob < 0 || prob > 100) {
        return res.status(400).json({ message: 'Probability must be between 0 and 100' });
      }
      risk.probability = prob;
    }
    if (riskData.severity !== undefined) risk.severity = riskData.severity;
    if (riskData.owner !== undefined) risk.owner = riskData.owner;
    if (riskData.identifiedDate !== undefined) risk.identifiedDate = riskData.identifiedDate ? new Date(riskData.identifiedDate) : null;
    if (riskData.targetMitigationDate !== undefined) risk.targetMitigationDate = riskData.targetMitigationDate ? new Date(riskData.targetMitigationDate) : null;
    if (riskData.actualMitigationDate !== undefined) risk.actualMitigationDate = riskData.actualMitigationDate ? new Date(riskData.actualMitigationDate) : null;
    if (riskData.mitigationStrategy !== undefined) risk.mitigationStrategy = riskData.mitigationStrategy;
    if (riskData.wbsElementId !== undefined) risk.wbsElementId = riskData.wbsElementId;
    if (riskData.status !== undefined) risk.status = riskData.status;

    risk.updatedAt = new Date();

    const updatedRisk = await riskRepository.save(risk);

    // Fetch with relations
    const riskWithRelations = await riskRepository.findOne({
      where: { id: updatedRisk.id },
      relations: ['category', 'wbsElement'],
    });

    const riskScore = RiskOpportunityService.calculateRiskScore(riskWithRelations!);
    const expectedValue = RiskOpportunityService.calculateExpectedValue(
      Number(riskWithRelations!.costImpactMin),
      Number(riskWithRelations!.costImpactMostLikely),
      Number(riskWithRelations!.costImpactMax)
    );

    res.json({
      ...riskWithRelations,
      riskScore,
      expectedValue,
    });
  } catch (error) {
    console.error('Error updating risk:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating risk';
    res.status(500).json({ message: errorMessage });
  }
});

// DELETE /api/risks/:id - Delete risk
router.delete('/risks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid risk ID' });
    }

    const risk = await riskRepository.findOne({ where: { id } });

    if (!risk) {
      return res.status(404).json({ message: 'Risk not found' });
    }

    await riskRepository.remove(risk);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting risk:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error deleting risk';
    res.status(500).json({ message: errorMessage });
  }
});

// POST /api/risks/:id/disposition - Update risk disposition
router.post('/risks/:id/disposition', async (req, res) => {
  try {
    const { id } = req.params;
    const { disposition, reason, dispositionDate } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid risk ID' });
    }

    if (!disposition || !reason) {
      return res.status(400).json({ message: 'Disposition and reason are required' });
    }

    const risk = await RiskOpportunityService.updateRiskDisposition(
      id,
      disposition,
      reason,
      dispositionDate ? new Date(dispositionDate) : undefined
    );

    const riskScore = RiskOpportunityService.calculateRiskScore(risk);
    const expectedValue = RiskOpportunityService.calculateExpectedValue(
      Number(risk.costImpactMin),
      Number(risk.costImpactMostLikely),
      Number(risk.costImpactMax)
    );

    res.json({
      ...risk,
      riskScore,
      expectedValue,
    });
  } catch (error) {
    console.error('Error updating risk disposition:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating risk disposition';
    
    if (errorMessage.includes('Invalid disposition transition')) {
      return res.status(400).json({ message: errorMessage });
    }
    
    res.status(500).json({ message: errorMessage });
  }
});

// POST /api/risks/:id/notes - Add note to risk
router.post('/risks/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, createdBy } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid risk ID' });
    }

    if (!note || !note.trim()) {
      return res.status(400).json({ message: 'Note is required' });
    }

    const riskNote = await RiskOpportunityService.addRiskNote(id, note, createdBy);
    res.status(201).json(riskNote);
  } catch (error) {
    console.error('Error adding risk note:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error adding risk note';
    res.status(500).json({ message: errorMessage });
  }
});

// GET /api/risks/:id/notes - Get risk notes history
router.get('/risks/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid risk ID' });
    }

    const notes = await RiskOpportunityService.getRiskNotes(id);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching risk notes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching risk notes';
    res.status(500).json({ message: errorMessage });
  }
});

// GET /api/programs/:id/risks/matrix - Get risk matrix data
router.get('/programs/:id/risks/matrix', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const matrix = await RiskOpportunityService.getRiskMatrix(id);
    res.json(matrix);
  } catch (error) {
    console.error('Error fetching risk matrix:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching risk matrix';
    res.status(500).json({ message: errorMessage });
  }
});

// ==================== OPPORTUNITY ROUTES ====================

// GET /api/programs/:id/opportunities - List opportunities
router.get('/programs/:id/opportunities', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, benefitSeverity, disposition, owner, search, sortBy, sortOrder } = req.query;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const queryBuilder = opportunityRepository
      .createQueryBuilder('opportunity')
      .leftJoinAndSelect('opportunity.category', 'category')
      .leftJoinAndSelect('opportunity.wbsElement', 'wbsElement')
      .where('opportunity.programId = :programId', { programId: id });

    // Apply filters
    if (category) {
      queryBuilder.andWhere('opportunity.categoryId = :categoryId', { categoryId: category });
    }
    if (benefitSeverity) {
      queryBuilder.andWhere('opportunity.benefitSeverity = :benefitSeverity', { benefitSeverity });
    }
    if (disposition) {
      queryBuilder.andWhere('opportunity.disposition = :disposition', { disposition });
    }
    if (owner) {
      queryBuilder.andWhere('opportunity.owner = :owner', { owner });
    }
    if (search) {
      queryBuilder.andWhere(
        '(opportunity.title ILIKE :search OR opportunity.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const sort = sortBy as string || 'createdAt';
    const order = (sortOrder as string || 'DESC').toUpperCase() as 'ASC' | 'DESC';
    queryBuilder.orderBy(`opportunity.${sort}`, order);

    const opportunities = await queryBuilder.getMany();

    // Calculate opportunity scores
    const opportunitiesWithScores = opportunities.map(opportunity => {
      const opportunityScore = RiskOpportunityService.calculateOpportunityScore(opportunity);
      const expectedBenefit = RiskOpportunityService.calculateExpectedValue(
        Number(opportunity.benefitMin),
        Number(opportunity.benefitMostLikely),
        Number(opportunity.benefitMax)
      );
      return {
        ...opportunity,
        opportunityScore,
        expectedBenefit,
      };
    });

    res.json(opportunitiesWithScores);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching opportunities';
    res.status(500).json({ message: errorMessage });
  }
});

// POST /api/programs/:id/opportunities - Create new opportunity
router.post('/programs/:id/opportunities', async (req, res) => {
  try {
    const { id } = req.params;
    const opportunityData = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    // Validate required fields
    if (!opportunityData.title || !opportunityData.benefitSeverity || opportunityData.probability === undefined) {
      return res.status(400).json({ message: 'Title, benefitSeverity, and probability are required' });
    }

    // Validate financial benefit
    if (
      opportunityData.benefitMin === undefined ||
      opportunityData.benefitMostLikely === undefined ||
      opportunityData.benefitMax === undefined
    ) {
      return res.status(400).json({ message: 'All benefit fields are required' });
    }

    // Validate range
    if (
      Number(opportunityData.benefitMin) > Number(opportunityData.benefitMostLikely) ||
      Number(opportunityData.benefitMostLikely) > Number(opportunityData.benefitMax)
    ) {
      return res.status(400).json({ message: 'Invalid benefit range: min <= mostLikely <= max' });
    }

    // Validate probability
    if (Number(opportunityData.probability) < 0 || Number(opportunityData.probability) > 100) {
      return res.status(400).json({ message: 'Probability must be between 0 and 100' });
    }

    const opportunity = opportunityRepository.create({
      program,
      title: opportunityData.title,
      description: opportunityData.description || null,
      categoryId: opportunityData.categoryId || null,
      benefitMin: Number(opportunityData.benefitMin),
      benefitMostLikely: Number(opportunityData.benefitMostLikely),
      benefitMax: Number(opportunityData.benefitMax),
      probability: Number(opportunityData.probability),
      benefitSeverity: opportunityData.benefitSeverity,
      owner: opportunityData.owner || null,
      identifiedDate: opportunityData.identifiedDate ? new Date(opportunityData.identifiedDate) : new Date(),
      targetRealizationDate: opportunityData.targetRealizationDate ? new Date(opportunityData.targetRealizationDate) : null,
      realizationStrategy: opportunityData.realizationStrategy || null,
      wbsElementId: opportunityData.wbsElementId || null,
      disposition: opportunityData.disposition || 'Identified',
      status: opportunityData.status || 'Identified',
    });

    const savedOpportunity = await opportunityRepository.save(opportunity);

    // If initial note provided, add it
    if (opportunityData.initialNote) {
      await RiskOpportunityService.addOpportunityNote(savedOpportunity.id, opportunityData.initialNote, opportunityData.createdBy);
    }

    // Fetch with relations
    const opportunityWithRelations = await opportunityRepository.findOne({
      where: { id: savedOpportunity.id },
      relations: ['category', 'wbsElement'],
    });

    const opportunityScore = RiskOpportunityService.calculateOpportunityScore(opportunityWithRelations!);
    const expectedBenefit = RiskOpportunityService.calculateExpectedValue(
      Number(opportunityWithRelations!.benefitMin),
      Number(opportunityWithRelations!.benefitMostLikely),
      Number(opportunityWithRelations!.benefitMax)
    );

    res.status(201).json({
      ...opportunityWithRelations,
      opportunityScore,
      expectedBenefit,
    });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error creating opportunity';
    res.status(500).json({ message: errorMessage });
  }
});

// GET /api/opportunities/:id - Get single opportunity
router.get('/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid opportunity ID' });
    }

    const opportunity = await opportunityRepository.findOne({
      where: { id },
      relations: ['category', 'wbsElement', 'notes'],
    });

    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    const opportunityScore = RiskOpportunityService.calculateOpportunityScore(opportunity);
    const expectedBenefit = RiskOpportunityService.calculateExpectedValue(
      Number(opportunity.benefitMin),
      Number(opportunity.benefitMostLikely),
      Number(opportunity.benefitMax)
    );

    res.json({
      ...opportunity,
      opportunityScore,
      expectedBenefit,
    });
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching opportunity';
    res.status(500).json({ message: errorMessage });
  }
});

// PUT /api/opportunities/:id - Update opportunity
router.put('/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const opportunityData = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid opportunity ID' });
    }

    const opportunity = await opportunityRepository.findOne({
      where: { id },
      relations: ['category', 'wbsElement'],
    });

    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    // Validate financial benefit if provided
    if (
      opportunityData.benefitMin !== undefined ||
      opportunityData.benefitMostLikely !== undefined ||
      opportunityData.benefitMax !== undefined
    ) {
      const min = opportunityData.benefitMin !== undefined 
        ? Number(opportunityData.benefitMin) 
        : Number(opportunity.benefitMin);
      const mostLikely = opportunityData.benefitMostLikely !== undefined 
        ? Number(opportunityData.benefitMostLikely) 
        : Number(opportunity.benefitMostLikely);
      const max = opportunityData.benefitMax !== undefined 
        ? Number(opportunityData.benefitMax) 
        : Number(opportunity.benefitMax);

      if (min > mostLikely || mostLikely > max) {
        return res.status(400).json({ message: 'Invalid benefit range: min <= mostLikely <= max' });
      }
    }

    // Update fields
    if (opportunityData.title !== undefined) opportunity.title = opportunityData.title;
    if (opportunityData.description !== undefined) opportunity.description = opportunityData.description;
    if (opportunityData.categoryId !== undefined) opportunity.categoryId = opportunityData.categoryId;
    if (opportunityData.benefitMin !== undefined) opportunity.benefitMin = Number(opportunityData.benefitMin);
    if (opportunityData.benefitMostLikely !== undefined) opportunity.benefitMostLikely = Number(opportunityData.benefitMostLikely);
    if (opportunityData.benefitMax !== undefined) opportunity.benefitMax = Number(opportunityData.benefitMax);
    if (opportunityData.probability !== undefined) {
      const prob = Number(opportunityData.probability);
      if (prob < 0 || prob > 100) {
        return res.status(400).json({ message: 'Probability must be between 0 and 100' });
      }
      opportunity.probability = prob;
    }
    if (opportunityData.benefitSeverity !== undefined) opportunity.benefitSeverity = opportunityData.benefitSeverity;
    if (opportunityData.owner !== undefined) opportunity.owner = opportunityData.owner;
    if (opportunityData.identifiedDate !== undefined) opportunity.identifiedDate = opportunityData.identifiedDate ? new Date(opportunityData.identifiedDate) : null;
    if (opportunityData.targetRealizationDate !== undefined) opportunity.targetRealizationDate = opportunityData.targetRealizationDate ? new Date(opportunityData.targetRealizationDate) : null;
    if (opportunityData.actualRealizationDate !== undefined) opportunity.actualRealizationDate = opportunityData.actualRealizationDate ? new Date(opportunityData.actualRealizationDate) : null;
    if (opportunityData.realizationStrategy !== undefined) opportunity.realizationStrategy = opportunityData.realizationStrategy;
    if (opportunityData.actualBenefit !== undefined) opportunity.actualBenefit = opportunityData.actualBenefit !== null ? Number(opportunityData.actualBenefit) : null;
    if (opportunityData.wbsElementId !== undefined) opportunity.wbsElementId = opportunityData.wbsElementId;
    if (opportunityData.status !== undefined) opportunity.status = opportunityData.status;

    opportunity.updatedAt = new Date();

    const updatedOpportunity = await opportunityRepository.save(opportunity);

    // Fetch with relations
    const opportunityWithRelations = await opportunityRepository.findOne({
      where: { id: updatedOpportunity.id },
      relations: ['category', 'wbsElement'],
    });

    const opportunityScore = RiskOpportunityService.calculateOpportunityScore(opportunityWithRelations!);
    const expectedBenefit = RiskOpportunityService.calculateExpectedValue(
      Number(opportunityWithRelations!.benefitMin),
      Number(opportunityWithRelations!.benefitMostLikely),
      Number(opportunityWithRelations!.benefitMax)
    );

    res.json({
      ...opportunityWithRelations,
      opportunityScore,
      expectedBenefit,
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating opportunity';
    res.status(500).json({ message: errorMessage });
  }
});

// DELETE /api/opportunities/:id - Delete opportunity
router.delete('/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid opportunity ID' });
    }

    const opportunity = await opportunityRepository.findOne({ where: { id } });

    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    await opportunityRepository.remove(opportunity);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error deleting opportunity';
    res.status(500).json({ message: errorMessage });
  }
});

// POST /api/opportunities/:id/disposition - Update opportunity disposition
router.post('/opportunities/:id/disposition', async (req, res) => {
  try {
    const { id } = req.params;
    const { disposition, reason, dispositionDate } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid opportunity ID' });
    }

    if (!disposition || !reason) {
      return res.status(400).json({ message: 'Disposition and reason are required' });
    }

    const opportunity = await RiskOpportunityService.updateOpportunityDisposition(
      id,
      disposition,
      reason,
      dispositionDate ? new Date(dispositionDate) : undefined
    );

    const opportunityScore = RiskOpportunityService.calculateOpportunityScore(opportunity);
    const expectedBenefit = RiskOpportunityService.calculateExpectedValue(
      Number(opportunity.benefitMin),
      Number(opportunity.benefitMostLikely),
      Number(opportunity.benefitMax)
    );

    res.json({
      ...opportunity,
      opportunityScore,
      expectedBenefit,
    });
  } catch (error) {
    console.error('Error updating opportunity disposition:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating opportunity disposition';
    
    if (errorMessage.includes('Invalid disposition transition')) {
      return res.status(400).json({ message: errorMessage });
    }
    
    res.status(500).json({ message: errorMessage });
  }
});

// POST /api/opportunities/:id/notes - Add note to opportunity
router.post('/opportunities/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, createdBy } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid opportunity ID' });
    }

    if (!note || !note.trim()) {
      return res.status(400).json({ message: 'Note is required' });
    }

    const opportunityNote = await RiskOpportunityService.addOpportunityNote(id, note, createdBy);
    res.status(201).json(opportunityNote);
  } catch (error) {
    console.error('Error adding opportunity note:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error adding opportunity note';
    res.status(500).json({ message: errorMessage });
  }
});

// GET /api/opportunities/:id/notes - Get opportunity notes history
router.get('/opportunities/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid opportunity ID' });
    }

    const notes = await RiskOpportunityService.getOpportunityNotes(id);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching opportunity notes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching opportunity notes';
    res.status(500).json({ message: errorMessage });
  }
});

// GET /api/programs/:id/opportunities/matrix - Get opportunity matrix data
router.get('/programs/:id/opportunities/matrix', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    const matrix = await RiskOpportunityService.getOpportunityMatrix(id);
    res.json(matrix);
  } catch (error) {
    console.error('Error fetching opportunity matrix:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching opportunity matrix';
    res.status(500).json({ message: errorMessage });
  }
});

export default router;

