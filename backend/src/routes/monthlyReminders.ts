import { Router } from 'express';
import { MonthlyActualsReminderService } from '../services/monthlyActualsReminderService';
import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';

const router = Router();
const programRepository = AppDataSource.getRepository(Program);

// Add UUID validation helper
function isValidUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * @swagger
 * /api/programs/{id}/monthly-reminders:
 *   get:
 *     summary: Get pending monthly reminders for a program
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     responses:
 *       200:
 *         description: List of pending reminders
 *       400:
 *         description: Invalid Program ID
 *       404:
 *         description: Program not found
 */
router.get('/programs/:id/monthly-reminders', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    // Verify program exists
    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const reminders = await MonthlyActualsReminderService.getPendingRemindersForProgram(id);
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching monthly reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching reminders';
    res.status(500).json({ message: errorMessage });
  }
});

/**
 * @swagger
 * /api/programs/{id}/monthly-reminders/{reminderId}/dismiss:
 *   post:
 *     summary: Dismiss a monthly reminder
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Reminder ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dismissedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reminder dismissed successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Reminder not found
 */
router.post('/programs/:id/monthly-reminders/:reminderId/dismiss', async (req, res) => {
  try {
    const { id, reminderId } = req.params;
    const { dismissedBy } = req.body;

    if (!isValidUUID(id) || !isValidUUID(reminderId)) {
      return res.status(400).json({ message: 'Invalid program ID or reminder ID' });
    }

    // Verify program exists
    const program = await programRepository.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const dismissedReminder = await MonthlyActualsReminderService.dismissReminder(reminderId, dismissedBy);
    res.json(dismissedReminder);
  } catch (error) {
    console.error('Error dismissing reminder:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error dismissing reminder';
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ message: errorMessage });
    }
    res.status(500).json({ message: errorMessage });
  }
});

/**
 * @swagger
 * /api/monthly-reminders/pending:
 *   get:
 *     summary: Get all pending monthly reminders (for notification system)
 *     responses:
 *       200:
 *         description: List of all pending reminders
 */
router.get('/monthly-reminders/pending', async (req, res) => {
  try {
    const reminders = await MonthlyActualsReminderService.getAllPendingReminders();
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching all pending reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching reminders';
    res.status(500).json({ message: errorMessage });
  }
});

/**
 * @swagger
 * /api/monthly-reminders/check-and-create:
 *   post:
 *     summary: Manually trigger reminder check (for testing/admin)
 *     responses:
 *       200:
 *         description: Reminder check completed
 */
router.post('/monthly-reminders/check-and-create', async (req, res) => {
  try {
    const result = await MonthlyActualsReminderService.checkAndCreateReminders();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error checking and creating reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error checking reminders';
    res.status(500).json({ message: errorMessage });
  }
});

export default router;

