import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { RiskCategory } from '../entities/RiskCategory';

const router = Router();

// GET /api/risk-categories - Get all risk categories
router.get('/', async (req, res) => {
  try {
    const riskCategoryRepository = AppDataSource.getRepository(RiskCategory);
    const categories = await riskCategoryRepository.find({
      order: { code: 'ASC' }
    });
    
    res.json(categories.map(cat => cat.toJSON()));
  } catch (error) {
    console.error('Error fetching risk categories:', error);
    res.status(500).json({ error: 'Failed to fetch risk categories' });
  }
});

// GET /api/risk-categories/active - Get active risk categories only
router.get('/active', async (req, res) => {
  try {
    const riskCategoryRepository = AppDataSource.getRepository(RiskCategory);
    const categories = await riskCategoryRepository.find({
      where: { isActive: true },
      order: { code: 'ASC' }
    });
    
    res.json(categories.map(cat => cat.toJSON()));
  } catch (error) {
    console.error('Error fetching active risk categories:', error);
    res.status(500).json({ error: 'Failed to fetch active risk categories' });
  }
});

// GET /api/risk-categories/all - Get all including inactive
router.get('/all', async (req, res) => {
  try {
    const riskCategoryRepository = AppDataSource.getRepository(RiskCategory);
    const categories = await riskCategoryRepository.find({
      order: { code: 'ASC' }
    });
    
    res.json(categories.map(cat => cat.toJSON()));
  } catch (error) {
    console.error('Error fetching all risk categories:', error);
    res.status(500).json({ error: 'Failed to fetch risk categories' });
  }
});

// GET /api/risk-categories/:id - Get risk category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const riskCategoryRepository = AppDataSource.getRepository(RiskCategory);
    const category = await riskCategoryRepository.findOne({ where: { id } });
    
    if (!category) {
      return res.status(404).json({ error: 'Risk category not found' });
    }
    
    res.json(category.toJSON());
  } catch (error) {
    console.error('Error fetching risk category:', error);
    res.status(500).json({ error: 'Failed to fetch risk category' });
  }
});

// POST /api/risk-categories - Create new risk category
router.post('/', async (req, res) => {
  try {
    const { code, name, description, isActive = true } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }
    
    const riskCategoryRepository = AppDataSource.getRepository(RiskCategory);
    
    // Check if code already exists
    const existingCategory = await riskCategoryRepository.findOne({ where: { code } });
    if (existingCategory) {
      return res.status(400).json({ error: 'Risk category code already exists' });
    }
    
    const newCategory = riskCategoryRepository.create({
      code,
      name,
      description,
      isActive,
      isSystem: false, // User-created categories are not system categories
    });
    
    const savedCategory = await riskCategoryRepository.save(newCategory);
    res.status(201).json(savedCategory.toJSON());
  } catch (error) {
    console.error('Error creating risk category:', error);
    res.status(500).json({ error: 'Failed to create risk category' });
  }
});

// PUT /api/risk-categories/:id - Update risk category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, isActive } = req.body;
    
    const riskCategoryRepository = AppDataSource.getRepository(RiskCategory);
    const category = await riskCategoryRepository.findOne({ where: { id } });
    
    if (!category) {
      return res.status(404).json({ error: 'Risk category not found' });
    }
    
    // Prevent modifying system categories
    if (category.isSystem && (code !== category.code || name !== category.name)) {
      return res.status(400).json({ 
        error: 'Cannot modify code or name of system categories' 
      });
    }
    
    // Check if code already exists (if changing code)
    if (code && code !== category.code) {
      const existingCategory = await riskCategoryRepository.findOne({ where: { code } });
      if (existingCategory) {
        return res.status(400).json({ error: 'Risk category code already exists' });
      }
    }
    
    // Update fields
    if (code !== undefined && !category.isSystem) category.code = code;
    if (name !== undefined && !category.isSystem) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    
    const updatedCategory = await riskCategoryRepository.save(category);
    res.json(updatedCategory.toJSON());
  } catch (error) {
    console.error('Error updating risk category:', error);
    res.status(500).json({ error: 'Failed to update risk category' });
  }
});

// DELETE /api/risk-categories/:id - Deactivate risk category (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const riskCategoryRepository = AppDataSource.getRepository(RiskCategory);
    
    // Check if category exists
    const category = await riskCategoryRepository.findOne({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: 'Risk category not found' });
    }
    
    // Prevent deleting system categories
    if (category.isSystem) {
      return res.status(400).json({ 
        error: 'Cannot delete system categories' 
      });
    }
    
    // Check if category is being used by any risks or opportunities
    const riskRepository = AppDataSource.getRepository('Risk');
    const opportunityRepository = AppDataSource.getRepository('Opportunity');
    
    const risksCount = await riskRepository.count({ where: { categoryId: id } });
    const opportunitiesCount = await opportunityRepository.count({ where: { categoryId: id } });
    
    if (risksCount > 0 || opportunitiesCount > 0) {
      // Soft delete - just deactivate
      category.isActive = false;
      await riskCategoryRepository.save(category);
      return res.json({ 
        message: 'Category deactivated (still in use)',
        category: category.toJSON()
      });
    }
    
    // Hard delete if not in use
    await riskCategoryRepository.remove(category);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting risk category:', error);
    res.status(500).json({ error: 'Failed to delete risk category' });
  }
});

export default router;

