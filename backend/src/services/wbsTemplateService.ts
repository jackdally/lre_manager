import { AppDataSource } from '../config/database';
import { WbsTemplate } from '../entities/WbsTemplate';
import { WbsCategory } from '../entities/WbsCategory';
import { WbsSubcategory } from '../entities/WbsSubcategory';
import { Program } from '../entities/Program';

const wbsTemplateRepo = AppDataSource.getRepository(WbsTemplate);
const wbsCategoryRepo = AppDataSource.getRepository(WbsCategory);
const wbsSubcategoryRepo = AppDataSource.getRepository(WbsSubcategory);

/**
 * Copies WBS template elements to program WBS categories
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

    // Get root level elements (level 1 - categories)
    const rootElements = template.elements.filter(element => element.level === 1);

    // Create categories and subcategories
    for (const rootElement of rootElements) {
      // Create the category
      const category = wbsCategoryRepo.create({
        name: rootElement.name,
        program: program
      });
      const savedCategory = await wbsCategoryRepo.save(category);

      // Find children of this root element (subcategories)
      const childElements = template.elements.filter(element => 
        element.parentId === rootElement.id
      );

      // Create subcategories
      for (const childElement of childElements) {
        const subcategory = wbsSubcategoryRepo.create({
          name: childElement.name,
          category: savedCategory
        });
        await wbsSubcategoryRepo.save(subcategory);
      }
    }

    console.log(`Successfully copied WBS template "${template.name}" to program "${program.name}"`);
  } catch (error) {
    console.error('Error copying WBS template to program:', error);
    throw error;
  }
} 