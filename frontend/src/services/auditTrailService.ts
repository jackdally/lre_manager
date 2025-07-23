import { LedgerAuditTrail } from '../types/auditTrail';

export interface AuditTrailResponse {
  success: boolean;
  data: LedgerAuditTrail[];
  error?: string;
}

export class AuditTrailService {
  static async getAuditTrailForLedgerEntry(ledgerEntryId: string): Promise<AuditTrailResponse> {
    try {
      const response = await fetch(`/api/ledger-audit-trail/ledger-entry/${ledgerEntryId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return { 
        success: false, 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getBOEAuditTrail(boeVersionId: string): Promise<AuditTrailResponse> {
    try {
      const response = await fetch(`/api/ledger-audit-trail/boe/${boeVersionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching BOE audit trail:', error);
      return { 
        success: false, 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getSessionAuditTrail(sessionId: string): Promise<AuditTrailResponse> {
    try {
      const response = await fetch(`/api/ledger-audit-trail/session/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching session audit trail:', error);
      return { 
        success: false, 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
} 