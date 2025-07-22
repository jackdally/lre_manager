import { AppDataSource } from '../config/database';
import { BOETemplate } from '../entities/BOETemplate';
import { BOETemplateElement } from '../entities/BOETemplateElement';

const boeTemplateRepository = AppDataSource.getRepository(BOETemplate);
const boeTemplateElementRepository = AppDataSource.getRepository(BOETemplateElement);

export class BOETemplateService {
  /**
   * Create a new version of an existing template
   */
  static async createNewVersion(
    templateId: string, 
    versionData: {
      name?: string;
      description?: string;
      versionNotes?: string;
      changeLog?: string;
      isPublic?: boolean;
      sharedWithUsers?: string[];
      sharedWithRoles?: string[];
      accessLevel?: 'Private' | 'Shared' | 'Public';
      allowCopy?: boolean;
      allowModify?: boolean;
    },
    userId?: string
  ): Promise<BOETemplate> {
    // Get the original template
    const originalTemplate = await boeTemplateRepository.findOne({
      where: { id: templateId },
      relations: ['elements']
    });

    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    // Determine new version numbers
    const newVersion = this.calculateNextVersion(originalTemplate, versionData.versionNotes);

    // Create new template version
    const newTemplate = new BOETemplate();
    newTemplate.name = versionData.name || originalTemplate.name;
    newTemplate.description = versionData.description || originalTemplate.description;
    newTemplate.category = originalTemplate.category;
    newTemplate.version = `${newVersion.majorVersion}.${newVersion.minorVersion}.${newVersion.patchVersion}`;
    newTemplate.majorVersion = newVersion.majorVersion;
    newTemplate.minorVersion = newVersion.minorVersion;
    newTemplate.patchVersion = newVersion.patchVersion;
    newTemplate.isActive = true;
    newTemplate.isDefault = false;
    newTemplate.parentTemplateId = originalTemplate.id;
    newTemplate.rootTemplateId = originalTemplate.rootTemplateId || originalTemplate.id;
    newTemplate.isLatestVersion = true;
    newTemplate.versionNotes = versionData.versionNotes;
    newTemplate.changeLog = versionData.changeLog;
    newTemplate.isPublic = versionData.isPublic ?? originalTemplate.isPublic;
    newTemplate.sharedWithUsers = versionData.sharedWithUsers || originalTemplate.sharedWithUsers;
    newTemplate.sharedWithRoles = versionData.sharedWithRoles || originalTemplate.sharedWithRoles;
    newTemplate.accessLevel = versionData.accessLevel || originalTemplate.accessLevel;
    newTemplate.allowCopy = versionData.allowCopy ?? originalTemplate.allowCopy;
    newTemplate.allowModify = versionData.allowModify ?? originalTemplate.allowModify;
    newTemplate.createdBy = userId || null;
    newTemplate.updatedBy = userId || null;

    // Save the new template
    const savedTemplate = await boeTemplateRepository.save(newTemplate);

    // Copy all elements from the original template
    if (originalTemplate.elements) {
      for (const element of originalTemplate.elements) {
        const newElement = new BOETemplateElement();
        newElement.code = element.code;
        newElement.name = element.name;
        newElement.description = element.description;
        newElement.level = element.level;
        newElement.parentElementId = element.parentElementId;
        newElement.costCategoryId = element.costCategoryId;
        newElement.estimatedCost = element.estimatedCost;
        newElement.managementReservePercentage = element.managementReservePercentage;
        newElement.isRequired = element.isRequired;
        newElement.isOptional = element.isOptional;
        newElement.notes = element.notes;
        newElement.template = savedTemplate;

        await boeTemplateElementRepository.save(newElement);
      }
    }

    // Mark the original template as not the latest version
    originalTemplate.isLatestVersion = false;
    await boeTemplateRepository.save(originalTemplate);

    return savedTemplate;
  }

  /**
   * Calculate the next version number based on semantic versioning
   */
  private static calculateNextVersion(
    template: BOETemplate, 
    versionNotes?: string
  ): { majorVersion: number; minorVersion: number; patchVersion: number } {
    const currentMajor = template.majorVersion;
    const currentMinor = template.minorVersion;
    const currentPatch = template.patchVersion;

    // Determine version increment based on version notes
    if (versionNotes) {
      const notes = versionNotes.toLowerCase();
      
      // Major version for breaking changes
      if (notes.includes('breaking') || notes.includes('major') || notes.includes('incompatible')) {
        return {
          majorVersion: currentMajor + 1,
          minorVersion: 0,
          patchVersion: 0
        };
      }
      
      // Minor version for new features
      if (notes.includes('feature') || notes.includes('enhancement') || notes.includes('new')) {
        return {
          majorVersion: currentMajor,
          minorVersion: currentMinor + 1,
          patchVersion: 0
        };
      }
    }

    // Default to patch version for bug fixes and minor updates
    return {
      majorVersion: currentMajor,
      minorVersion: currentMinor,
      patchVersion: currentPatch + 1
    };
  }

  /**
   * Get version history for a template
   */
  static async getVersionHistory(templateId: string): Promise<BOETemplate[]> {
    const template = await boeTemplateRepository.findOne({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    const rootId = template.rootTemplateId || template.id;
    
    return await boeTemplateRepository.find({
      where: { rootTemplateId: rootId },
      order: { 
        majorVersion: 'DESC', 
        minorVersion: 'DESC', 
        patchVersion: 'DESC' 
      }
    });
  }

  /**
   * Compare two template versions
   */
  static async compareVersions(version1Id: string, version2Id: string): Promise<any> {
    const [template1, template2] = await Promise.all([
      boeTemplateRepository.findOne({
        where: { id: version1Id },
        relations: ['elements']
      }),
      boeTemplateRepository.findOne({
        where: { id: version2Id },
        relations: ['elements']
      })
    ]);

    if (!template1 || !template2) {
      throw new Error('One or both templates not found');
    }

    // Compare basic properties
    const basicChanges = {
      name: template1.name !== template2.name ? { from: template1.name, to: template2.name } : null,
      description: template1.description !== template2.description ? { from: template1.description, to: template2.description } : null,
      category: template1.category !== template2.category ? { from: template1.category, to: template2.category } : null,
      isPublic: template1.isPublic !== template2.isPublic ? { from: template1.isPublic, to: template2.isPublic } : null,
      accessLevel: template1.accessLevel !== template2.accessLevel ? { from: template1.accessLevel, to: template2.accessLevel } : null
    };

    // Compare elements
    const elements1 = template1.elements || [];
    const elements2 = template2.elements || [];
    
    const elementChanges = {
      added: elements2.filter(e2 => !elements1.find(e1 => e1.code === e2.code)),
      removed: elements1.filter(e1 => !elements2.find(e2 => e2.code === e1.code)),
      modified: elements1.filter(e1 => {
        const e2 = elements2.find(e => e.code === e1.code);
        return e2 && (
          e1.name !== e2.name ||
          e1.description !== e2.description ||
          e1.estimatedCost !== e2.estimatedCost ||
          e1.isRequired !== e2.isRequired
        );
      }).map(e1 => {
        const e2 = elements2.find(e => e.code === e1.code)!;
        return {
          code: e1.code,
          changes: {
            name: e1.name !== e2.name ? { from: e1.name, to: e2.name } : null,
            description: e1.description !== e2.description ? { from: e1.description, to: e2.description } : null,
            estimatedCost: e1.estimatedCost !== e2.estimatedCost ? { from: e1.estimatedCost, to: e2.estimatedCost } : null,
            isRequired: e1.isRequired !== e2.isRequired ? { from: e1.isRequired, to: e2.isRequired } : null
          }
        };
      })
    };

    return {
      template1: {
        id: template1.id,
        version: template1.getFullVersion(),
        name: template1.name
      },
      template2: {
        id: template2.id,
        version: template2.getFullVersion(),
        name: template2.name
      },
      basicChanges,
      elementChanges
    };
  }

  /**
   * Rollback to a previous version
   */
  static async rollbackToVersion(templateId: string, targetVersionId: string, userId?: string): Promise<BOETemplate> {
    const currentTemplate = await boeTemplateRepository.findOne({
      where: { id: templateId }
    });

    const targetTemplate = await boeTemplateRepository.findOne({
      where: { id: targetVersionId },
      relations: ['elements']
    });

    if (!currentTemplate || !targetTemplate) {
      throw new Error('Template not found');
    }

    // Verify they belong to the same template family
    const currentRoot = currentTemplate.rootTemplateId || currentTemplate.id;
    const targetRoot = targetTemplate.rootTemplateId || targetTemplate.id;

    if (currentRoot !== targetRoot) {
      throw new Error('Cannot rollback to a version from a different template');
    }

    // Create a new version based on the target version
    return await this.createNewVersion(
      targetVersionId,
      {
        versionNotes: `Rollback from version ${currentTemplate.getFullVersion()} to ${targetTemplate.getFullVersion()}`,
        changeLog: `Rollback operation performed by user ${userId}`
      },
      userId
    );
  }

  /**
   * Check if user has access to template
   */
  static async checkTemplateAccess(templateId: string, userId?: string, userRoles?: string[]): Promise<boolean> {
    const template = await boeTemplateRepository.findOne({
      where: { id: templateId }
    });

    if (!template) {
      return false;
    }

    // Public templates are accessible to everyone
    if (template.isPublic || template.accessLevel === 'Public') {
      return true;
    }

    // Private templates are only accessible to the creator
    if (template.accessLevel === 'Private') {
      return template.createdBy === userId;
    }

    // Shared templates check specific users and roles
    if (template.accessLevel === 'Shared') {
      // Check if user is in shared users list
      if (template.sharedWithUsers && userId && template.sharedWithUsers.includes(userId)) {
        return true;
      }

      // Check if user has any of the shared roles
      if (template.sharedWithRoles && userRoles) {
        const hasSharedRole = template.sharedWithRoles.some(role => userRoles.includes(role));
        if (hasSharedRole) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get templates accessible to a user
   */
  static async getAccessibleTemplates(userId?: string, userRoles?: string[]): Promise<BOETemplate[]> {
    const query = boeTemplateRepository.createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true })
      .andWhere('template.isLatestVersion = :isLatest', { isLatest: true });

    // Add access conditions
    const accessConditions = [
      'template.isPublic = :isPublic',
      'template.accessLevel = :publicLevel'
    ];

    const parameters: any = {
      isPublic: true,
      publicLevel: 'Public'
    };

    if (userId) {
      accessConditions.push('template.createdBy = :userId');
      parameters.userId = userId;
    }

    if (userId) {
      accessConditions.push('template.sharedWithUsers LIKE :userInList');
      parameters.userInList = `%${userId}%`;
    }

    if (userRoles && userRoles.length > 0) {
      const roleConditions = userRoles.map((role, index) => {
        const paramName = `role${index}`;
        parameters[paramName] = role;
        return `template.sharedWithRoles LIKE :${paramName}`;
      });
      accessConditions.push(`(${roleConditions.join(' OR ')})`);
    }

    query.andWhere(`(${accessConditions.join(' OR ')})`, parameters);

    return await query.getMany();
  }
} 