import { AppDataSource } from '../config/database';
import { BOEVersion } from '../entities/BOEVersion';
import { BOEElement } from '../entities/BOEElement';
import { BOEElementAllocation } from '../entities/BOEElementAllocation';
import { ManagementReserve } from '../entities/ManagementReserve';

const boeVersionRepository = AppDataSource.getRepository(BOEVersion);
const boeElementRepository = AppDataSource.getRepository(BOEElement);
const boeElementAllocationRepository = AppDataSource.getRepository(BOEElementAllocation);
const managementReserveRepository = AppDataSource.getRepository(ManagementReserve);

export interface BOEValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validationDetails: {
    hasElements: boolean;
    hasAllocations: boolean;
    hasVendors: boolean;
    hasManagementReserve: boolean;
    missingAllocations: string[];
    missingVendors: string[];
    incompleteElements: string[];
  };
}

export class BOEValidationService {
  /**
   * Validates a BOE version for approval submission
   * @param boeVersionId - The BOE version ID to validate
   * @returns BOEValidationResult with detailed validation information
   */
  static async validateBOEForApproval(boeVersionId: string): Promise<BOEValidationResult> {

    const result: BOEValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      validationDetails: {
        hasElements: false,
        hasAllocations: false,
        hasVendors: false,
        hasManagementReserve: false,
        missingAllocations: [],
        missingVendors: [],
        incompleteElements: []
      }
    };

    try {
      // Check if BOE version exists
      const boeVersion = await boeVersionRepository.findOne({
        where: { id: boeVersionId }
      });

      if (!boeVersion) {
        result.errors.push('BOE version not found');
        result.isValid = false;
        return result;
      }

      // Check if BOE is in Draft status
      if (boeVersion.status !== 'Draft') {
        result.errors.push('BOE must be in Draft status to submit for approval');
        result.isValid = false;
        return result;
      }

      // Get all BOE elements
      const elements = await boeElementRepository.find({
        where: { boeVersion: { id: boeVersionId } },
        relations: ['costCategory', 'vendor']
      });

      if (elements.length === 0) {
        result.errors.push('BOE must have at least one WBS element');
        result.isValid = false;
        return result;
      }

      result.validationDetails.hasElements = true;

      // Get all allocations
      const allocations = await boeElementAllocationRepository.find({
        where: { boeVersion: { id: boeVersionId } }
      });

      // Note: We don't fail here if no allocations exist, as we'll check each element individually below
      if (allocations.length > 0) {
        result.validationDetails.hasAllocations = true;
      }

      // Check Management Reserve
      const managementReserve = await managementReserveRepository.findOne({
        where: { boeVersion: { id: boeVersionId } }
      });

      if (!managementReserve) {
        result.errors.push('Missing Management Reserve: Calculation and justification required');
        result.isValid = false;
      } else if (!managementReserve.justification || managementReserve.justification.trim() === '') {
        result.errors.push('Missing Management Reserve: Justification required');
        result.isValid = false;
      } else {
        result.validationDetails.hasManagementReserve = true;
      }

      // Validate each element and collect issues by type
      const missingAllocations: string[] = [];
      const missingVendors: string[] = [];
      const incompleteParentElements: { parent: string; missingChildren: string[] }[] = [];

      for (const element of elements) {
        const elementAllocations = allocations.filter(a => a.boeElementId === element.id);
        
        // Check if element has allocations (only for leaf elements)
        const hasChildren = elements.some((e: BOEElement) => e.parentElementId === element.id);
        
        if (!hasChildren) { // This is a leaf element
          if (elementAllocations.length === 0) {
            result.validationDetails.missingAllocations.push(element.name);
            missingAllocations.push(`${element.code} - ${element.name}`);
            result.isValid = false;
          }
        } else { // This is a parent element
          // Check if all children have allocations
          const childElements = elements.filter((e: BOEElement) => e.parentElementId === element.id);
          const childrenWithAllocations = childElements.filter((child: BOEElement) => 
            allocations.some((a: BOEElementAllocation) => a.boeElementId === child.id)
          );
          
          if (childrenWithAllocations.length !== childElements.length) {
            result.validationDetails.incompleteElements.push(element.name);
            const missingChildren = childElements.filter((child: BOEElement) => 
              !allocations.some((a: BOEElementAllocation) => a.boeElementId === child.id)
            );
            const missingChildNames = missingChildren.map((child: BOEElement) => `${child.code} - ${child.name}`);
            incompleteParentElements.push({
              parent: `${element.code} - ${element.name}`,
              missingChildren: missingChildNames
            });
            result.isValid = false;
          }
        }

        // Check vendor assignment (only for leaf elements)
        if (!hasChildren && !element.vendor) {
          result.validationDetails.missingVendors.push(element.name);
          missingVendors.push(`${element.code} - ${element.name}`);
          result.isValid = false;
        }
      }

      // Helper function to sort WBS elements by their codes
      const sortWbsElements = (elements: string[]) => {
        return elements.sort((a, b) => {
          const codeA = a.split(' - ')[0];
          const codeB = b.split(' - ')[0];
          
          // Split codes into parts (e.g., "1.2.3" -> [1, 2, 3])
          const partsA = codeA.split('.').map(Number);
          const partsB = codeB.split('.').map(Number);
          
          // Compare each part
          const maxLength = Math.max(partsA.length, partsB.length);
          for (let i = 0; i < maxLength; i++) {
            const partA = partsA[i] || 0;
            const partB = partsB[i] || 0;
            if (partA !== partB) {
              return partA - partB;
            }
          }
          return 0;
        });
      };

      // Format aggregated error messages
      if (missingAllocations.length > 0) {
        const sortedAllocations = sortWbsElements(missingAllocations);
        result.errors.push(`Missing Allocations: ${sortedAllocations.join(', ')}`);
      }

      if (missingVendors.length > 0) {
        const sortedVendors = sortWbsElements(missingVendors);
        result.errors.push(`Missing Vendor Assignments: ${sortedVendors.join(', ')}`);
      }

      if (incompleteParentElements.length > 0) {
        const parentIssues = incompleteParentElements.map(item => {
          const sortedMissingChildren = sortWbsElements(item.missingChildren);
          return `${item.parent} (missing: ${sortedMissingChildren.join(', ')})`;
        });
        result.errors.push(`Incomplete Parent Elements: ${parentIssues.join('; ')}`);
      }

      // Check if any elements have vendors
      const elementsWithVendors = elements.filter((e: BOEElement) => e.vendor);
      if (elementsWithVendors.length > 0) {
        result.validationDetails.hasVendors = true;
      }

      // Add warnings for potential issues
      if (elements.length < 3) {
        result.warnings.push('Consider adding more WBS elements for better cost breakdown');
      }

      const totalEstimatedCost = elements.reduce((sum, element) => sum + (element.estimatedCost || 0), 0);
      if (totalEstimatedCost === 0) {
        result.warnings.push('Total estimated cost is zero - verify all elements have cost estimates');
      }

      return result;

    } catch (error) {
      console.error('Error validating BOE for approval:', error);
      result.errors.push('Error during validation: ' + (error as Error).message);
      result.isValid = false;
      return result;
    }
  }

  /**
   * Validates a BOE version for push to ledger
   * @param boeVersionId - The BOE version ID to validate
   * @returns BOEValidationResult with detailed validation information
   */
  static async validateBOEForLedgerPush(boeVersionId: string): Promise<BOEValidationResult> {

    const result: BOEValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      validationDetails: {
        hasElements: false,
        hasAllocations: false,
        hasVendors: false,
        hasManagementReserve: false,
        missingAllocations: [],
        missingVendors: [],
        incompleteElements: []
      }
    };

    try {
      // Check if BOE version exists
      const boeVersion = await boeVersionRepository.findOne({
        where: { id: boeVersionId }
      });

      if (!boeVersion) {
        result.errors.push('BOE version not found');
        result.isValid = false;
        return result;
      }

      // Check if BOE is in Approved status
      if (boeVersion.status !== 'Approved') {
        result.errors.push('BOE must be in Approved status to push to ledger');
        result.isValid = false;
        return result;
      }

      // Get all allocations
      const allocations = await boeElementAllocationRepository.find({
        where: { boeVersion: { id: boeVersionId } }
      });

      if (allocations.length === 0) {
        result.errors.push('No element allocations found for this BOE version. Please create allocations before pushing to ledger.');
        result.isValid = false;
        return result;
      }

      result.validationDetails.hasAllocations = true;

      // Check Management Reserve
      const managementReserve = await managementReserveRepository.findOne({
        where: { boeVersion: { id: boeVersionId } }
      });

      if (!managementReserve) {
        result.errors.push('Management Reserve calculation is required before pushing to ledger');
        result.isValid = false;
      } else {
        result.validationDetails.hasManagementReserve = true;
      }

      return result;

    } catch (error) {
      console.error('Error validating BOE for ledger push:', error);
      result.errors.push('Error during validation: ' + (error as Error).message);
      result.isValid = false;
      return result;
    }
  }

  /**
   * Gets validation status for display in UI
   * @param boeVersionId - The BOE version ID to check
   * @returns Simplified validation status for UI display
   */
  static async getValidationStatus(boeVersionId: string): Promise<{
    isValid: boolean;
    canSubmitForApproval: boolean;
    canPushToLedger: boolean;
    issues: string[];
  }> {
    const approvalValidation = await this.validateBOEForApproval(boeVersionId);
    const ledgerValidation = await this.validateBOEForLedgerPush(boeVersionId);

    return {
      isValid: approvalValidation.isValid,
      canSubmitForApproval: approvalValidation.isValid,
      canPushToLedger: ledgerValidation.isValid,
      issues: [...approvalValidation.errors, ...ledgerValidation.errors]
    };
  }
} 