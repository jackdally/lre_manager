import axios from 'axios';
import { LedgerEntry } from '../components/features/ledger/LedgerTable';

export interface BulkEditPayload {
  [field: string]: any;
}

export interface LedgerServiceOptions {
  programId: string;
  onCacheInvalidate?: () => void;
  onDataRefresh?: () => void;
  onSuccess?: (operation: string) => void;
  onError?: (operation: string, error: Error) => void;
}

export class LedgerService {
  private programId: string;
  private onCacheInvalidate?: () => void;
  private onDataRefresh?: () => void;
  private onSuccess?: (operation: string) => void;
  private onError?: (operation: string, error: Error) => void;

  constructor(options: LedgerServiceOptions) {
    this.programId = options.programId;
    this.onCacheInvalidate = options.onCacheInvalidate;
    this.onDataRefresh = options.onDataRefresh;
    this.onSuccess = options.onSuccess;
    this.onError = options.onError;
  }

  private async performOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      const result = await operation();
      
      // Invalidate cache
      this.onCacheInvalidate?.();
      
      // Refresh data
      this.onDataRefresh?.();
      
      // Notify success
      this.onSuccess?.(operationName);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${operationName} failed:`, errorMessage);
      this.onError?.(operationName, new Error(errorMessage));
      throw error;
    }
  }

  // Single entry operations
  async updateEntry(entryId: string, updates: Partial<LedgerEntry>): Promise<any> {
    return this.performOperation(
      async () => {
        const response = await axios.put(`/api/programs/${this.programId}/ledger/${entryId}`, updates);
        return response.data;
      },
      'updateEntry'
    );
  }

  async deleteEntry(entryId: string): Promise<any> {
    return this.performOperation(
      async () => {
        const response = await axios.delete(`/api/programs/${this.programId}/ledger/${entryId}`);
        return response.data;
      },
      'deleteEntry'
    );
  }

  async createEntry(entry: Omit<LedgerEntry, 'id'>): Promise<any> {
    return this.performOperation(
      async () => {
        const response = await axios.post(`/api/programs/${this.programId}/ledger`, entry);
        return response.data;
      },
      'createEntry'
    );
  }

  // Bulk operations
  async bulkUpdateEntries(entryIds: string[], updates: BulkEditPayload): Promise<any[]> {
    return this.performOperation(
      async () => {
        const promises = entryIds.map(id => 
          axios.put(`/api/programs/${this.programId}/ledger/${id}`, updates)
        );
        const responses = await Promise.all(promises);
        return responses.map(r => r.data);
      },
      'bulkUpdateEntries'
    );
  }

  async bulkDeleteEntries(entryIds: string[]): Promise<any[]> {
    return this.performOperation(
      async () => {
        const promises = entryIds.map(id => 
          axios.delete(`/api/programs/${this.programId}/ledger/${id}`)
        );
        const responses = await Promise.all(promises);
        return responses.map(r => r.data);
      },
      'bulkDeleteEntries'
    );
  }

  // Match operations
  async confirmMatch(transactionId: string, ledgerEntryId: string): Promise<any> {
    return this.performOperation(
      async () => {
        const response = await fetch(`/api/import/transaction/${transactionId}/confirm-match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ledgerEntryId }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to confirm match: ${response.status}`);
        }
        
        return response.json();
      },
      'confirmMatch'
    );
  }

  async rejectMatch(transactionId: string, ledgerEntryId: string): Promise<any> {
    return this.performOperation(
      async () => {
        const response = await fetch(`/api/import/transaction/${transactionId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ledgerEntryId }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to reject match: ${response.status}`);
        }
        
        return response.json();
      },
      'rejectMatch'
    );
  }

  async undoReject(transactionId: string, ledgerEntryId: string): Promise<any> {
    return this.performOperation(
      async () => {
        const response = await fetch(`/api/import/transaction/${transactionId}/undo-reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ledgerEntryId }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to undo rejection: ${response.status}`);
        }
        
        return response.json();
      },
      'undoReject'
    );
  }

  async removeMatch(transactionId: string): Promise<any> {
    return this.performOperation(
      async () => {
        const response = await fetch(`/api/import/transaction/${transactionId}/remove-match`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to remove match: ${response.status}`);
        }
        
        return response.json();
      },
      'removeMatch'
    );
  }

  // Other operations
  async updateInvoiceLink(entryId: string, invoiceLinkText: string, invoiceLinkUrl: string): Promise<any> {
    return this.performOperation(
      async () => {
        const response = await axios.put(`/api/programs/${this.programId}/ledger/${entryId}`, {
          invoice_link_text: invoiceLinkText,
          invoice_link_url: invoiceLinkUrl,
        });
        return response.data;
      },
      'updateInvoiceLink'
    );
  }
} 