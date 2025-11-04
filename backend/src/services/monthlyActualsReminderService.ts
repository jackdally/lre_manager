import { AppDataSource } from '../config/database';
import { MonthlyReminder } from '../entities/MonthlyReminder';
import { Program } from '../entities/Program';
import { LedgerEntry } from '../entities/LedgerEntry';

const monthlyReminderRepository = AppDataSource.getRepository(MonthlyReminder);
const programRepository = AppDataSource.getRepository(Program);
const ledgerRepository = AppDataSource.getRepository(LedgerEntry);

export class MonthlyActualsReminderService {
  /**
   * Check for missing actuals and create reminders for programs
   * This should be called on the 5th of each month
   */
  static async checkAndCreateReminders(): Promise<{ remindersCreated: number; programsChecked: number }> {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthString = previousMonth.toISOString().slice(0, 7); // YYYY-MM format

    // Get all active programs
    const activePrograms = await programRepository.find({
      where: { status: 'Active' }
    });

    let remindersCreated = 0;

    for (const program of activePrograms) {
      const hasMissingActuals = await this.checkProgramHasMissingActuals(program.id, monthString);
      
      if (hasMissingActuals) {
        // Check if reminder already exists
        const existingReminder = await monthlyReminderRepository.findOne({
          where: {
            programId: program.id,
            month: monthString
          }
        });

        if (!existingReminder) {
          // Create new reminder
          const reminder = monthlyReminderRepository.create({
            programId: program.id,
            program,
            month: monthString,
            isDismissed: false,
            emailSent: false,
            inAppNotificationShown: false
          });

          await monthlyReminderRepository.save(reminder);
          remindersCreated++;

          // Send email notification (placeholder for now)
          await this.sendEmailNotification(program, monthString, reminder.id);

          // Mark email as sent
          reminder.emailSent = true;
          reminder.emailSentAt = new Date();
          await monthlyReminderRepository.save(reminder);
        }
      }
    }

    return {
      remindersCreated,
      programsChecked: activePrograms.length
    };
  }

  /**
   * Check if a program has missing actuals for a given month
   */
  static async checkProgramHasMissingActuals(programId: string, month: string): Promise<boolean> {
    // Parse month string (YYYY-MM) to get start and end dates
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    // Use query builder to find entries with planned_date in the month but missing actuals
    const entriesWithMissingActuals = await ledgerRepository
      .createQueryBuilder('ledger')
      .where('ledger.programId = :programId', { programId })
      .andWhere('ledger.planned_date >= :startStr', { startStr })
      .andWhere('ledger.planned_date <= :endStr', { endStr })
      .andWhere('ledger.planned_amount > 0')
      .andWhere('(ledger.actual_date IS NULL OR ledger.actual_amount IS NULL OR ledger.actual_amount = 0)')
      .getMany();

    return entriesWithMissingActuals.length > 0;
  }

  /**
   * Send email notification for missing actuals
   * Note: Currently logs the notification. Email sending will be integrated when email service is available.
   */
  private static async sendEmailNotification(program: Program, month: string, reminderId: string): Promise<void> {
    const uploadUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/programs/${program.id}/actuals`;
    
    // Check if program has an email address configured
    if (!program.program_manager_email) {
      console.log(`[Email Notification] Skipped - No email address configured for program: ${program.name} (${program.code})`);
      return;
    }

    // TODO: Integrate with email service when available
    // Import email template functions when ready
    // import { generateMonthlyActualsReminderSubject, generateMonthlyActualsReminderBody } from '../templates/monthlyActualsReminderEmail';
    
    // For now, log the notification with email address
    console.log(`[Email Notification] Program: ${program.name} (${program.code}), Month: ${month}, Reminder ID: ${reminderId}`);
    console.log(`[Email Notification] To: ${program.program_manager_email}`);
    console.log(`[Email Notification] Upload URL: ${uploadUrl}`);
    
    // When email service is integrated, uncomment and use:
    // const subject = generateMonthlyActualsReminderSubject({ 
    //   programName: program.name, 
    //   programCode: program.code, 
    //   month, 
    //   reminderId, 
    //   uploadUrl,
    //   programManagerEmail: program.program_manager_email
    // });
    // const body = generateMonthlyActualsReminderBody({ 
    //   programName: program.name, 
    //   programCode: program.code, 
    //   month, 
    //   reminderId, 
    //   uploadUrl,
    //   programManagerEmail: program.program_manager_email
    // });
    // await NotificationService.sendEmail(program.program_manager_email, subject, body);
  }

  /**
   * Get pending reminders for a program
   */
  static async getPendingRemindersForProgram(programId: string): Promise<MonthlyReminder[]> {
    return await monthlyReminderRepository.find({
      where: {
        programId,
        isDismissed: false
      },
      order: {
        month: 'DESC'
      },
      relations: ['program']
    });
  }

  /**
   * Get all pending reminders (for notification system)
   */
  static async getAllPendingReminders(): Promise<MonthlyReminder[]> {
    return await monthlyReminderRepository.find({
      where: {
        isDismissed: false
      },
      order: {
        createdAt: 'DESC'
      },
      relations: ['program']
    });
  }

  /**
   * Dismiss a reminder
   */
  static async dismissReminder(reminderId: string, dismissedBy?: string): Promise<MonthlyReminder> {
    const reminder = await monthlyReminderRepository.findOne({
      where: { id: reminderId }
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    reminder.isDismissed = true;
    reminder.dismissedAt = new Date();
    reminder.dismissedBy = dismissedBy;

    return await monthlyReminderRepository.save(reminder);
  }

  /**
   * Mark in-app notification as shown
   */
  static async markInAppNotificationShown(reminderId: string): Promise<MonthlyReminder> {
    const reminder = await monthlyReminderRepository.findOne({
      where: { id: reminderId }
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    reminder.inAppNotificationShown = true;
    reminder.inAppNotificationShownAt = new Date();

    return await monthlyReminderRepository.save(reminder);
  }
}

