import { Router } from 'express';
import { WbsReportingService } from '../services/wbsReporting';

const router = Router();
const wbsReportingService = new WbsReportingService();

// Get roll-up cost report for a program's WBS structure
router.get('/:programId/wbs-report', async (req, res) => {
  const { programId } = req.params;
  
  try {
    const report = await wbsReportingService.getRollupReport(programId);
    res.json(report);
  } catch (error) {
    console.error('Error generating WBS roll-up report:', error);
    res.status(500).json({ 
      message: 'Error generating WBS roll-up report', 
      error: error instanceof Error ? error.message : error 
    });
  }
});

// Get cost breakdown by WBS level
router.get('/:programId/wbs-report/by-level', async (req, res) => {
  const { programId } = req.params;
  
  try {
    const breakdown = await wbsReportingService.getCostBreakdownByLevel(programId);
    res.json(breakdown);
  } catch (error) {
    console.error('Error generating WBS level breakdown:', error);
    res.status(500).json({ 
      message: 'Error generating WBS level breakdown', 
      error: error instanceof Error ? error.message : error 
    });
  }
});

// Get variance analysis for a specific WBS element
router.get('/wbs-elements/:elementId/variance', async (req, res) => {
  const { elementId } = req.params;
  
  try {
    const analysis = await wbsReportingService.getElementVarianceAnalysis(elementId);
    if (!analysis) {
      return res.status(404).json({ message: 'WBS element not found' });
    }
    res.json(analysis);
  } catch (error) {
    console.error('Error generating WBS element variance analysis:', error);
    res.status(500).json({ 
      message: 'Error generating WBS element variance analysis', 
      error: error instanceof Error ? error.message : error 
    });
  }
});

export default router; 