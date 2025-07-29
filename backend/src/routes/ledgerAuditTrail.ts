import { Router } from 'express';
import { LedgerAuditTrailService } from '../services/ledgerAuditTrailService';

const router = Router();

// Get audit trail for a specific ledger entry
router.get('/ledger-entry/:ledgerEntryId', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    
    if (!ledgerEntryId) {
      return res.status(400).json({ message: 'Ledger entry ID is required' });
    }

    const auditTrail = await LedgerAuditTrailService.getAuditTrailForLedgerEntry(ledgerEntryId);
    res.json(auditTrail);
  } catch (error) {
    console.error('Error fetching ledger entry audit trail:', error);
    res.status(500).json({ message: 'Error fetching audit trail', error });
  }
});

// Get audit trail for a BOE version
router.get('/boe/:boeVersionId', async (req, res) => {
  try {
    const { boeVersionId } = req.params;
    
    if (!boeVersionId) {
      return res.status(400).json({ message: 'BOE version ID is required' });
    }

    const auditTrail = await LedgerAuditTrailService.getBOEAuditTrail(boeVersionId);
    res.json(auditTrail);
  } catch (error) {
    console.error('Error fetching BOE audit trail:', error);
    res.status(500).json({ message: 'Error fetching audit trail', error });
  }
});

// Get audit trail for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const auditTrail = await LedgerAuditTrailService.getSessionAuditTrail(sessionId);
    res.json(auditTrail);
  } catch (error) {
    console.error('Error fetching session audit trail:', error);
    res.status(500).json({ message: 'Error fetching audit trail', error });
  }
});

// Get audit trail summary for a ledger entry
router.get('/ledger-entry/:ledgerEntryId/summary', async (req, res) => {
  try {
    const { ledgerEntryId } = req.params;
    
    if (!ledgerEntryId) {
      return res.status(400).json({ message: 'Ledger entry ID is required' });
    }

    const summary = await LedgerAuditTrailService.getAuditSummary(ledgerEntryId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching audit trail summary:', error);
    res.status(500).json({ message: 'Error fetching audit trail summary', error });
  }
});

export default router; 