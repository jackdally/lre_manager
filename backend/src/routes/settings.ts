import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { WbsTemplate } from '../entities/WbsTemplate';
import { WbsTemplateElement } from '../entities/WbsTemplateElement';

const router = Router();

// Get all WBS templates
router.get('/wbs-templates', async (req, res) => {
  try {
    const templateRepository = AppDataSource.getRepository(WbsTemplate);
    const templates = await templateRepository.find({
      relations: ['elements', 'elements.children'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Transform the flat structure into hierarchical structure
    const transformToHierarchical = (elements: WbsTemplateElement[]) => {
      const elementMap = new Map<string, WbsTemplateElement>();
      const rootElements: WbsTemplateElement[] = [];

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
    };

    const templatesWithHierarchy = templates.map(template => ({
      ...template,
      structure: transformToHierarchical(template.elements),
    }));

    res.json(templatesWithHierarchy);
  } catch (error) {
    console.error('Error fetching WBS templates:', error);
    res.status(500).json({ error: 'Failed to fetch WBS templates' });
  }
});

// Create a new WBS template
router.post('/wbs-templates', async (req, res) => {
  try {
    const { name, description, structure, isDefault = false } = req.body;

    if (!name || !structure) {
      return res.status(400).json({ error: 'Name and structure are required' });
    }

    const templateRepository = AppDataSource.getRepository(WbsTemplate);
    const elementRepository = AppDataSource.getRepository(WbsTemplateElement);

    // If this is the new default, unset the current default
    if (isDefault) {
      await templateRepository.update({ isDefault: true }, { isDefault: false });
    }

    // Create the template
    const template = templateRepository.create({
      name,
      description,
      isDefault,
    });

    const savedTemplate = await templateRepository.save(template);

    // Create the elements
    const createElements = async (elements: any[], parentId?: string) => {
      for (const element of elements) {
        const newElement = elementRepository.create({
          code: element.code,
          name: element.name,
          description: element.description,
          level: element.level,
          parentId,
          template: savedTemplate,
        });

        const savedElement = await elementRepository.save(newElement);

        if (element.children && element.children.length > 0) {
          await createElements(element.children, savedElement.id);
        }
      }
    };

    await createElements(structure);

    // Fetch the complete template with elements
    const completeTemplate = await templateRepository.findOne({
      where: { id: savedTemplate.id },
      relations: ['elements', 'elements.children'],
    });

    res.status(201).json(completeTemplate);
  } catch (error) {
    console.error('Error creating WBS template:', error);
    res.status(500).json({ error: 'Failed to create WBS template' });
  }
});

// Update a WBS template
router.put('/wbs-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, structure, isDefault } = req.body;

    const templateRepository = AppDataSource.getRepository(WbsTemplate);
    const elementRepository = AppDataSource.getRepository(WbsTemplateElement);

    const template = await templateRepository.findOne({ where: { id } });
    if (!template) {
      return res.status(404).json({ error: 'WBS template not found' });
    }

    // If this is the new default, unset the current default
    if (isDefault && !template.isDefault) {
      await templateRepository.update({ isDefault: true }, { isDefault: false });
    }

    // Update template
    await templateRepository.update(id, {
      name,
      description,
      isDefault,
    });

    // Delete existing elements
    await elementRepository.delete({ template: { id } });

    // Create new elements
    const createElements = async (elements: any[], parentId?: string) => {
      for (const element of elements) {
        const newElement = elementRepository.create({
          code: element.code,
          name: element.name,
          description: element.description,
          level: element.level,
          parentId,
          template: { id },
        });

        const savedElement = await elementRepository.save(newElement);

        if (element.children && element.children.length > 0) {
          await createElements(element.children, savedElement.id);
        }
      }
    };

    await createElements(structure);

    // Fetch the updated template
    const updatedTemplate = await templateRepository.findOne({
      where: { id },
      relations: ['elements', 'elements.children'],
    });

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating WBS template:', error);
    res.status(500).json({ error: 'Failed to update WBS template' });
  }
});

// Delete a WBS template
router.delete('/wbs-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const templateRepository = AppDataSource.getRepository(WbsTemplate);
    const template = await templateRepository.findOne({ where: { id } });

    if (!template) {
      return res.status(404).json({ error: 'WBS template not found' });
    }

    if (template.isDefault) {
      return res.status(400).json({ error: 'Cannot delete the default template' });
    }

    await templateRepository.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting WBS template:', error);
    res.status(500).json({ error: 'Failed to delete WBS template' });
  }
});

// Set default WBS template
router.patch('/wbs-templates/:id/set-default', async (req, res) => {
  try {
    const { id } = req.params;

    const templateRepository = AppDataSource.getRepository(WbsTemplate);
    const template = await templateRepository.findOne({ where: { id } });

    if (!template) {
      return res.status(404).json({ error: 'WBS template not found' });
    }

    // Unset current default
    await templateRepository.update({ isDefault: true }, { isDefault: false });

    // Set new default
    await templateRepository.update(id, { isDefault: true });

    res.json({ message: 'Default template updated successfully' });
  } catch (error) {
    console.error('Error setting default WBS template:', error);
    res.status(500).json({ error: 'Failed to set default template' });
  }
});

export default router; 