import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { CostCategory } from '../entities/CostCategory';

const router = Router();

// GET /api/cost-categories - Get all cost categories
router.get('/', async (req, res) => {
  try {
    const costCategoryRepository = AppDataSource.getRepository(CostCategory);
    const categories = await costCategoryRepository.find({
      order: { code: 'ASC' }
    });
    
    res.json(categories.map(cat => cat.toJSON()));
  } catch (error) {
    console.error('Error fetching cost categories:', error);
    res.status(500).json({ error: 'Failed to fetch cost categories' });
  }
});

// GET /api/cost-categories/active - Get active cost categories only
router.get('/active', async (req, res) => {
  try {
    const costCategoryRepository = AppDataSource.getRepository(CostCategory);
    const categories = await costCategoryRepository.find({
      where: { isActive: true },
      order: { code: 'ASC' }
    });
    
    res.json(categories.map(cat => cat.toJSON()));
  } catch (error) {
    console.error('Error fetching active cost categories:', error);
    res.status(500).json({ error: 'Failed to fetch active cost categories' });
  }
});

// GET /api/cost-categories/:id - Get cost category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const costCategoryRepository = AppDataSource.getRepository(CostCategory);
    const category = await costCategoryRepository.findOne({ where: { id } });
    
    if (!category) {
      return res.status(404).json({ error: 'Cost category not found' });
    }
    
    res.json(category.toJSON());
  } catch (error) {
    console.error('Error fetching cost category:', error);
    res.status(500).json({ error: 'Failed to fetch cost category' });
  }
});

// POST /api/cost-categories - Create new cost category
router.post('/', async (req, res) => {
  try {
    const { code, name, description, isActive = true } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }
    
    const costCategoryRepository = AppDataSource.getRepository(CostCategory);
    
    // Check if code already exists
    const existingCategory = await costCategoryRepository.findOne({ where: { code } });
    if (existingCategory) {
      return res.status(400).json({ error: 'Cost category code already exists' });
    }
    
    const newCategory = costCategoryRepository.create({
      code,
      name,
      description,
      isActive
    });
    
    const savedCategory = await costCategoryRepository.save(newCategory);
    res.status(201).json(savedCategory.toJSON());
  } catch (error) {
    console.error('Error creating cost category:', error);
    res.status(500).json({ error: 'Failed to create cost category' });
  }
});

// PUT /api/cost-categories/:id - Update cost category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, isActive } = req.body;
    
    const costCategoryRepository = AppDataSource.getRepository(CostCategory);
    const category = await costCategoryRepository.findOne({ where: { id } });
    
    if (!category) {
      return res.status(404).json({ error: 'Cost category not found' });
    }
    
    // Check if code already exists (if changing code)
    if (code && code !== category.code) {
      const existingCategory = await costCategoryRepository.findOne({ where: { code } });
      if (existingCategory) {
        return res.status(400).json({ error: 'Cost category code already exists' });
      }
    }
    
    // Update fields
    if (code !== undefined) category.code = code;
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    
    const updatedCategory = await costCategoryRepository.save(category);
    res.json(updatedCategory.toJSON());
  } catch (error) {
    console.error('Error updating cost category:', error);
    res.status(500).json({ error: 'Failed to update cost category' });
  }
});

// DELETE /api/cost-categories/:id - Delete cost category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const costCategoryRepository = AppDataSource.getRepository(CostCategory);
    
    // Check if category exists
    const category = await costCategoryRepository.findOne({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: 'Cost category not found' });
    }
    
    // Check if category is being used by any ledger entries
    const ledgerRepository = AppDataSource.getRepository('LedgerEntry');
    const ledgerEntries = await ledgerRepository.count({ where: { costCategoryId: id } });
    
    if (ledgerEntries > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete cost category that is being used by ledger entries',
        ledgerEntriesCount: ledgerEntries
      });
    }
    
    await costCategoryRepository.remove(category);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting cost category:', error);
    res.status(500).json({ error: 'Failed to delete cost category' });
  }
});

export default router; 