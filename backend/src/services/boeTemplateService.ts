import { AppDataSource } from '../config/database';
import { BOETemplate } from '../entities/BOETemplate';
import { BOETemplateElement } from '../entities/BOETemplateElement';

const boeTemplateRepository = AppDataSource.getRepository(BOETemplate);
const boeTemplateElementRepository = AppDataSource.getRepository(BOETemplateElement);

export class BOETemplateService {
  /**
   * Get all active templates
   */
  static async getTemplates(): Promise<BOETemplate[]> {
    return await boeTemplateRepository.find({
      where: { isActive: true },
      relations: ['elements'],
      order: { isDefault: 'DESC', name: 'ASC' }
    });
  }

  /**
   * Get template by ID
   */
  static async getTemplate(id: string): Promise<BOETemplate | null> {
    return await boeTemplateRepository.findOne({
      where: { id, isActive: true },
      relations: ['elements']
    });
  }

  /**
   * Get default template
   */
  static async getDefaultTemplate(): Promise<BOETemplate | null> {
    return await boeTemplateRepository.findOne({
      where: { isDefault: true, isActive: true },
      relations: ['elements']
    });
  }

  /**
   * Create a new template
   */
  static async createTemplate(templateData: {
    name: string;
    description: string;
    category: string;
    isDefault?: boolean;
  }, userId?: string): Promise<BOETemplate> {
    const template = new BOETemplate();
    template.name = templateData.name;
    template.description = templateData.description;
    template.category = templateData.category;
    template.version = '1.0';
    template.isActive = true;
    template.isDefault = templateData.isDefault || false;
    template.createdBy = userId || null;
    template.updatedBy = userId || null;

    return await boeTemplateRepository.save(template);
  }

  /**
   * Update a template
   */
  static async updateTemplate(
    id: string, 
    updateData: {
      name?: string;
      description?: string;
      category?: string;
      isDefault?: boolean;
    },
    userId?: string
  ): Promise<BOETemplate> {
    const template = await boeTemplateRepository.findOne({
      where: { id }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Update fields
    if (updateData.name) template.name = updateData.name;
    if (updateData.description) template.description = updateData.description;
    if (updateData.category) template.category = updateData.category;
    if (updateData.isDefault !== undefined) template.isDefault = updateData.isDefault;
    template.updatedBy = userId || null;

    return await boeTemplateRepository.save(template);
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(id: string): Promise<void> {
    const template = await boeTemplateRepository.findOne({
      where: { id }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Soft delete by setting isActive to false
    template.isActive = false;
    await boeTemplateRepository.save(template);
  }
} 