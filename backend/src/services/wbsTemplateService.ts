import { AppDataSource } from '../config/database';
import { WbsTemplate } from '../entities/WbsTemplate';
import { WbsElement } from '../entities/WbsElement';
import { Program } from '../entities/Program';

const wbsTemplateRepo = AppDataSource.getRepository(WbsTemplate);
const wbsElementRepo = AppDataSource.getRepository(WbsElement);

/**
 * Copies WBS template elements to program WBS elements
 * @param programId - The ID of the program to copy the template to
 * @param templateId - The ID of the WBS template to copy from
 */
export async function copyWbsTemplateToProgram(programId: string, templateId: string): Promise<void> {
  try {
    // Get the program
    const program = await AppDataSource.getRepository(Program).findOneBy({ id: programId });
    if (!program) {
      throw new Error('Program not found');
    }

    // Get the WBS template with all its elements
    const template = await wbsTemplateRepo.findOne({
      where: { id: templateId },
      relations: ['elements', 'elements.children']
    });

    if (!template) {
      throw new Error('WBS template not found');
    }

    // Copy all template elements to program WBS elements
    const elementMap = new Map<string, string>(); // template element ID -> new element ID

    // First pass: create all elements without parent relationships
    for (const templateElement of template.elements) {
      const newElement = wbsElementRepo.create({
        code: templateElement.code,
        name: templateElement.name,
        description: templateElement.description,
        level: templateElement.level,
        program: program
      });
      const savedElement = await wbsElementRepo.save(newElement);
      elementMap.set(templateElement.id, savedElement.id);
    }

    // Second pass: update parent relationships
    for (const templateElement of template.elements) {
      if (templateElement.parentId) {
        const newElementId = elementMap.get(templateElement.id);
        const newParentId = elementMap.get(templateElement.parentId);
        
        if (newElementId && newParentId) {
          await wbsElementRepo.update(newElementId, { parentId: newParentId });
        }
      }
    }

    console.log(`Successfully copied WBS template "${template.name}" to program "${program.name}"`);
  } catch (error) {
    console.error('Error copying WBS template to program:', error);
    throw error;
  }
} 