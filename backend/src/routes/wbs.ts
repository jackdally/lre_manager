import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { WbsCategory } from '../entities/WbsCategory';
import { WbsSubcategory } from '../entities/WbsSubcategory';
import { Program } from '../entities/Program';

const router = Router();
const wbsCategoryRepo = AppDataSource.getRepository(WbsCategory);
const wbsSubcategoryRepo = AppDataSource.getRepository(WbsSubcategory);
const programRepo = AppDataSource.getRepository(Program);

// List all WBS categories (and their subcategories) for a program
router.get('/:programId/wbs', async (req, res) => {
  const { programId } = req.params;
  try {
    const categories = await wbsCategoryRepo.find({
      where: { program: { id: programId } },
      relations: ['subcategories'],
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching WBS categories', error: err });
  }
});

// Create a new WBS category for a program
router.post('/:programId/wbs/categories', async (req, res) => {
  const { programId } = req.params;
  try {
    const program = await programRepo.findOneBy({ id: programId });
    if (!program) return res.status(404).json({ message: 'Program not found' });
    const category = wbsCategoryRepo.create({ ...req.body, program });
    const saved = await wbsCategoryRepo.save(category);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error creating WBS category', error: err });
  }
});

// Update a WBS category
router.put('/wbs/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const category = await wbsCategoryRepo.findOneBy({ id });
    if (!category) return res.status(404).json({ message: 'WBS category not found' });
    wbsCategoryRepo.merge(category, req.body);
    const saved = await wbsCategoryRepo.save(category);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error updating WBS category', error: err });
  }
});

// Delete a WBS category
router.delete('/wbs/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const category = await wbsCategoryRepo.findOneBy({ id });
    if (!category) return res.status(404).json({ message: 'WBS category not found' });
    await wbsCategoryRepo.remove(category);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting WBS category', error: err });
  }
});

// Create a new WBS subcategory for a category
router.post('/wbs/categories/:categoryId/subcategories', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const category = await wbsCategoryRepo.findOneBy({ id: categoryId });
    if (!category) return res.status(404).json({ message: 'WBS category not found' });
    const subcategory = wbsSubcategoryRepo.create({ ...req.body, category });
    const saved = await wbsSubcategoryRepo.save(subcategory);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error creating WBS subcategory', error: err });
  }
});

// Update a WBS subcategory
router.put('/wbs/subcategories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const subcategory = await wbsSubcategoryRepo.findOneBy({ id });
    if (!subcategory) return res.status(404).json({ message: 'WBS subcategory not found' });
    wbsSubcategoryRepo.merge(subcategory, req.body);
    const saved = await wbsSubcategoryRepo.save(subcategory);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error updating WBS subcategory', error: err });
  }
});

// Delete a WBS subcategory
router.delete('/wbs/subcategories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const subcategory = await wbsSubcategoryRepo.findOneBy({ id });
    if (!subcategory) return res.status(404).json({ message: 'WBS subcategory not found' });
    await wbsSubcategoryRepo.remove(subcategory);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting WBS subcategory', error: err });
  }
});

export const wbsRouter = router; 