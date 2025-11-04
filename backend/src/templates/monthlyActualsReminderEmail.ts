/**
 * Email template for monthly actuals reminders
 * This is a placeholder template structure - actual email sending will be integrated
 * when email service is available
 */

export interface MonthlyActualsReminderEmailData {
  programName: string;
  programCode: string;
  month: string; // Format: YYYY-MM
  reminderId: string;
  uploadUrl: string;
  programManagerEmail?: string;
}

/**
 * Format month string for display
 */
function formatMonth(monthString: string): string {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Generate email subject for monthly actuals reminder
 */
export function generateMonthlyActualsReminderSubject(data: MonthlyActualsReminderEmailData): string {
  return `Monthly Actuals Reminder - ${data.programName} (${data.programCode})`;
}

/**
 * Generate email HTML body for monthly actuals reminder
 */
export function generateMonthlyActualsReminderBody(data: MonthlyActualsReminderEmailData): string {
  const monthDisplay = formatMonth(data.month);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2563eb;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Monthly Actuals Reminder</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      
      <p>This is a reminder that actuals data is missing for <strong>${data.programName}</strong> (${data.programCode}) for the month of <strong>${monthDisplay}</strong>.</p>
      
      <p>To ensure accurate program tracking and reporting, please upload the actuals data for this period.</p>
      
      <div style="text-align: center;">
        <a href="${data.uploadUrl}" class="button">Upload Actuals</a>
      </div>
      
      <p>If you have already uploaded the actuals, please verify that they have been properly matched to ledger entries.</p>
      
      <div class="footer">
        <p>This is an automated reminder from the LRE Manager system.</p>
        <p>If you have questions, please contact your program administrator.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email body for monthly actuals reminder
 */
export function generateMonthlyActualsReminderText(data: MonthlyActualsReminderEmailData): string {
  const monthDisplay = formatMonth(data.month);
  
  return `
Monthly Actuals Reminder

Hello,

This is a reminder that actuals data is missing for ${data.programName} (${data.programCode}) for the month of ${monthDisplay}.

To ensure accurate program tracking and reporting, please upload the actuals data for this period.

Upload Actuals: ${data.uploadUrl}

If you have already uploaded the actuals, please verify that they have been properly matched to ledger entries.

This is an automated reminder from the LRE Manager system.
If you have questions, please contact your program administrator.
  `.trim();
}

