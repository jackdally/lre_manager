import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { WbsElement } from '../entities/WbsElement';
import { Program } from '../entities/Program';

const router = Router();
const wbsElementRepo = AppDataSource.getRepository(WbsElement);
const programRepo = AppDataSource.getRepository(Program);

// Helper function to transform flat elements to hierarchical structure
function transformToHierarchical(elements: WbsElement[]): WbsElement[] {
  const elementMap = new Map<string, WbsElement>();
  const rootElements: WbsElement[] = [];

  // Create a map of all elements
  elements.forEach(element => {
    elementMap.set(element.id, { ...element, children: [] });
  });

  // Build the hierarchy
  elements.forEach(element => {
    const mappedElement = elementMap.get(element.id)!;
    if (element.parentId) {
      const parent = elementMap.get(element.parentId);
      if (parent) {
        parent.children.push(mappedElement);
      }
    } else {
      rootElements.push(mappedElement);
    }
  });

  return rootElements;
}

// Get all WBS elements for a program (hierarchical)
router.get('/:programId/wbs-elements', async (req, res) => {
  const { programId } = req.params;
  try {
    const elements = await wbsElementRepo.find({
      where: { program: { id: programId } },
      relations: ['parent', 'children'],
      order: { level: 'ASC', code: 'ASC' }
    });

    const hierarchicalElements = transformToHierarchical(elements);
    res.json(hierarchicalElements);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching WBS elements', error: err });
  }
});

// Search WBS elements by code or name within a program
router.get('/:programId/wbs-elements/search', async (req, res) => {
  const { programId } = req.params;
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const elements = await wbsElementRepo
      .createQueryBuilder('element')
      .leftJoin('element.program', 'program')
      .where('program.id = :programId', { programId })
      .andWhere('(element.code ILIKE :query OR element.name ILIKE :query)', { 
        query: `%${query}%` 
      })
      .orderBy('element.level', 'ASC')
      .addOrderBy('element.code', 'ASC')
      .getMany();

    res.json(elements);
  } catch (err) {
    res.status(500).json({ message: 'Error searching WBS elements', error: err });
  }
});

// Create a new WBS element
router.post('/:programId/wbs-elements', async (req, res) => {
  const { programId } = req.params;
  const { code, name, description, level, parentId } = req.body;

  try {
    const program = await programRepo.findOneBy({ id: programId });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    // Validate parent exists if provided
    let parent: WbsElement | null = null;
    if (parentId) {
      parent = await wbsElementRepo.findOne({
        where: { id: parentId, program: { id: programId } }
      });
      if (!parent) {
        return res.status(400).json({ message: 'Parent WBS element not found' });
      }
    }

    const element = wbsElementRepo.create({
      code,
      name,
      description,
      level,
      parent: parent || undefined,
      program
    });

    const saved = await wbsElementRepo.save(element);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error creating WBS element', error: err });
  }
});

// Update a WBS element
router.put('/wbs-elements/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name, description, level, parentId } = req.body;

  try {
    const element = await wbsElementRepo.findOne({
      where: { id },
      relations: ['program', 'parent']
    });

    if (!element) {
      return res.status(404).json({ message: 'WBS element not found' });
    }

    // Validate parent exists if provided
    let parent: WbsElement | null = null;
    if (parentId) {
      parent = await wbsElementRepo.findOne({
        where: { id: parentId, program: { id: element.program.id } }
      });
      if (!parent) {
        return res.status(400).json({ message: 'Parent WBS element not found' });
      }
    }

    // Update the element
    element.code = code;
    element.name = name;
    element.description = description;
    element.level = level;
    element.parent = parent || undefined;

    const updated = await wbsElementRepo.save(element);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating WBS element', error: err });
  }
});

// Delete a WBS element
router.delete('/wbs-elements/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const element = await wbsElementRepo.findOne({
      where: { id },
      relations: ['children']
    });

    if (!element) {
      return res.status(404).json({ message: 'WBS element not found' });
    }

    // Check if element has children
    if (element.children.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete WBS element with children. Please delete children first.' 
      });
    }

    await wbsElementRepo.remove(element);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting WBS element', error: err });
  }
});

export default router; 