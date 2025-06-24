import { AppDataSource } from '../config/database';
import { ImportSession, ImportStatus } from '../entities/ImportSession';
import { ImportTransaction, TransactionStatus, DuplicateType } from '../entities/ImportTransaction';
import { LedgerEntry } from '../entities/LedgerEntry';
import { Program } from '../entities/Program';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { Like, Between } from 'typeorm';
import { RejectedMatch } from '../entities/RejectedMatch';

export interface ImportConfig {
  programCodeColumn: string;
  vendorColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  dateColumn: string;
  periodColumn?: string;
  categoryColumn?: string;
  subcategoryColumn?: string;
  invoiceColumn?: string;
  referenceColumn?: string;
  dateFormat?: string;
  amountTolerance?: number;
  matchThreshold?: number;
}

export interface MatchResult {
  ledgerEntry: LedgerEntry;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'partial' | 'date-based' | 'wbs-based';
  reasons: string[];
}

export class ImportService {
  private importSessionRepo = AppDataSource.getRepository(ImportSession);
  private importTransactionRepo = AppDataSource.getRepository(ImportTransaction);
  private ledgerRepo = AppDataSource.getRepository(LedgerEntry);
  private programRepo = AppDataSource.getRepository(Program);
  private rejectedMatchRepo = AppDataSource.getRepository(RejectedMatch);

  async createImportSession(
    filename: string,
    originalFilename: string,
    description: string,
    programId: string,
    config: ImportConfig
  ): Promise<ImportSession> {
    const program = await this.programRepo.findOneBy({ id: programId });
    if (!program) {
      throw new Error('Program not found');
    }

    const session = this.importSessionRepo.create({
      filename,
      originalFilename,
      description,
      program,
      importConfig: config,
      status: ImportStatus.PENDING
    });

    return await this.importSessionRepo.save(session);
  }

  async replaceImportSession(
    replaceSessionId: string,
    newFilename: string,
    newOriginalFilename: string,
    newDescription: string,
    programId: string,
    config: ImportConfig,
    options: {
      preserveConfirmedMatches: boolean;
      preserveAllMatches: boolean;
      forceReplace: boolean;
    }
  ): Promise<any> {
    // Get the existing session to replace
    const existingSession = await this.importSessionRepo.findOne({
      where: { id: replaceSessionId },
      relations: ['program']
    });

    if (!existingSession) {
      throw new Error('Import session to replace not found');
    }

    // Verify the session belongs to the correct program
    if (existingSession.program.id !== programId) {
      throw new Error('Session does not belong to the specified program');
    }

    // Create a new session for the replacement
    const newSession = this.importSessionRepo.create({
      filename: newFilename,
      originalFilename: newOriginalFilename,
      description: newDescription,
      program: existingSession.program,
      importConfig: config,
      status: ImportStatus.PENDING
    });
    const savedNewSession = await this.importSessionRepo.save(newSession);

    // Mark the original session as replaced
    existingSession.status = ImportStatus.REPLACED;
    existingSession.replacedBySessionId = savedNewSession.id;
    await this.importSessionRepo.save(existingSession);

    // Get existing transactions to determine what to preserve
    const existingTransactions = await this.importTransactionRepo.find({
      where: { importSession: { id: replaceSessionId } },
      relations: ['matchedLedgerEntry']
    });

    // Handle force replace: mark all transactions as replaced and reverse ledger entries
    if (options.forceReplace) {
      for (const transaction of existingTransactions) {
        // Reverse ledger entry if transaction was confirmed or added to ledger
        if (transaction.matchedLedgerEntry && 
            (transaction.status === TransactionStatus.CONFIRMED || 
             transaction.status === TransactionStatus.ADDED_TO_LEDGER)) {
          
          const ledgerEntry = await this.ledgerRepo.findOneBy({ id: transaction.matchedLedgerEntry.id });
          if (ledgerEntry) {
            // Clear actuals and add audit note
            ledgerEntry.actual_amount = null;
            ledgerEntry.actual_date = null;
            ledgerEntry.notes = `REVERSED: Force replace of import session ${replaceSessionId}. ` +
                            `Original transaction: ${transaction.vendorName} - ${transaction.description} ` +
                            `($${transaction.amount} on ${transaction.transactionDate}). ` +
                            `Replaced by session: ${savedNewSession.id}`;
            
            await this.ledgerRepo.save(ledgerEntry);
          }
        }
        
        // Mark transaction as replaced (not rejected)
        transaction.status = TransactionStatus.REPLACED;
        await this.importTransactionRepo.save(transaction);
      }
    }

    // Determine which transactions to preserve based on options (only if not force replace)
    let transactionsToPreserve: ImportTransaction[] = [];
    if (!options.forceReplace) {
      if (options.preserveAllMatches) {
        transactionsToPreserve = existingTransactions.filter(t =>
          t.status === TransactionStatus.MATCHED ||
          t.status === TransactionStatus.CONFIRMED ||
          t.status === TransactionStatus.ADDED_TO_LEDGER
        );
      } else if (options.preserveConfirmedMatches) {
        transactionsToPreserve = existingTransactions.filter(t =>
          t.status === TransactionStatus.CONFIRMED ||
          t.status === TransactionStatus.ADDED_TO_LEDGER
        );
      }
    }

    // Copy preserved transactions to the new session
    for (const tx of transactionsToPreserve) {
      const copy = this.importTransactionRepo.create({
        ...tx,
        id: undefined, // Let DB assign new ID
        importSession: savedNewSession,
        preservedFromSessionId: tx.importSession.id
      });
      await this.importTransactionRepo.save(copy);
    }

    // Process the new file in the new session
    const result = await this.processNetSuiteFile(savedNewSession.id);

    return {
      sessionId: savedNewSession.id,
      preservedTransactions: transactionsToPreserve.length,
      replacedSessionId: replaceSessionId,
      forceReplaced: options.forceReplace,
      replacedTransactions: options.forceReplace ? existingTransactions.length : 0,
      ...result
    };
  }

  async processNetSuiteFile(sessionId: string): Promise<any> {
    const session = await this.importSessionRepo.findOne({
      where: { id: sessionId },
      relations: ['program']
    });

    if (!session) {
      throw new Error('Import session not found');
    }

    try {
      // Update status to processing
      session.status = ImportStatus.PROCESSING;
      await this.importSessionRepo.save(session);

      // Read and parse the file
      const workbook = XLSX.readFile(session.filename);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const config = session.importConfig as ImportConfig;
      const transactions: ImportTransaction[] = [];
      let errorCount = 0;
      let programMismatchCount = 0;
      let validationFailCount = 0;
      let noProgramCodeCount = 0;

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const transaction = await this.parseTransactionRow(row, config, session);
          if (transaction) {
            transactions.push(transaction);
          } else {
            // Check why the transaction was rejected
            const programCodeRaw = row[config.programCodeColumn];
            const vendorName = row[config.vendorColumn];
            const description = row[config.descriptionColumn];
            const amount = parseFloat(row[config.amountColumn]);
            const dateStr = row[config.dateColumn];

            if (!vendorName || !description || isNaN(amount) || !dateStr) {
              validationFailCount++;
            } else if (!programCodeRaw || typeof programCodeRaw !== 'string' || programCodeRaw.trim() === '') {
              noProgramCodeCount++;
            } else {
              // Check if it's a program mismatch (has program code but doesn't match)
              const programCodeMatch = programCodeRaw.match(/([A-Z]{3}\.\d{4})/);
              if (programCodeMatch && programCodeMatch[1] !== session.program.code) {
                programMismatchCount++;
              } else {
                // Invalid program code format
                noProgramCodeCount++;
              }
            }
          }
        } catch (error) {
          errorCount++;
        }
      }

      // Save all transactions
      const savedTransactions = await this.importTransactionRepo.save(transactions);

      // Update session with counts
      session.totalRecords = rows.length;
      session.processedRecords = savedTransactions.length;
      session.errorRecords = errorCount;
      await this.importSessionRepo.save(session);

      // Perform smart matching
      await this.performSmartMatching(sessionId);

      return {
        sessionId,
        totalRecords: rows.length,
        processedRecords: savedTransactions.length,
        errorRecords: errorCount
      };

    } catch (error) {
      session.status = ImportStatus.FAILED;
      session.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.importSessionRepo.save(session);
      throw error;
    }
  }

  private async parseTransactionRow(
    row: any,
    config: ImportConfig,
    session: ImportSession
  ): Promise<ImportTransaction | null> {
    // Extract data from row based on config
    const programCodeRaw = row[config.programCodeColumn];
    const vendorName = row[config.vendorColumn];
    const description = row[config.descriptionColumn];
    const amount = parseFloat(row[config.amountColumn]);
    const dateStr = row[config.dateColumn];
    const periodStr = config.periodColumn ? row[config.periodColumn] : null;
    const invoiceNumber = config.invoiceColumn ? row[config.invoiceColumn] : null;

    // Validate required fields (excluding program code for now)
    if (!vendorName || !description || isNaN(amount) || !dateStr) {
      return null;
    }

    // Handle program code - extract ABC.1234 pattern if present
    let programCode = null;
    if (programCodeRaw && typeof programCodeRaw === 'string' && programCodeRaw.trim() !== '') {
      // Extract program code using regex pattern ABC.1234 (3 letters + period + 4 numbers)
      const programCodeMatch = programCodeRaw.match(/([A-Z]{3}\.\d{4})/);
      if (programCodeMatch) {
        programCode = programCodeMatch[1];
      }
    }

    // Skip transactions without a valid program code
    if (!programCode) {
      return null;
    }

    // Check if this transaction belongs to the current program
    if (programCode !== session.program.code) {
      return null;
    }

    // Parse date
    const transactionDate = this.parseDate(dateStr, config.dateFormat);
    
    // Parse period if available
    let periodDate = null;
    if (periodStr) {
      periodDate = this.parsePeriod(periodStr);
    }

    // Duplicate detection logic
    let duplicateType = DuplicateType.NONE;
    let duplicateOfId: string | null = null;
    let existing: ImportTransaction | null = null;

    if (invoiceNumber && vendorName) {
      existing = await this.importTransactionRepo.findOne({
        where: { invoiceNumber, vendorName },
      });
      if (existing && existing.status !== TransactionStatus.REPLACED) {
        // Check if all fields match (true duplicate)
        if (
          existing.amount === amount &&
          existing.transactionDate === transactionDate &&
          ((periodDate && existing.rawData?.Period === periodDate) || (!periodDate && !existing.rawData?.Period)) &&
          existing.description === description
        ) {
          return null; // True duplicate, skip
        } else {
          duplicateType = DuplicateType.DIFFERENT_INFO;
          duplicateOfId = existing.id;
        }
      }
    } else {
      // Fallback: vendorName + date + amount (removed period comparison to fix JSON error)
      existing = await this.importTransactionRepo.findOne({
        where: {
          vendorName,
          transactionDate,
          amount
        },
      });
      if (existing && existing.status !== TransactionStatus.REPLACED) {
        return null; // True duplicate, skip
      }
    }

    const transaction = this.importTransactionRepo.create({
      vendorName: vendorName.trim(),
      description: description.trim(),
      amount,
      transactionDate,
      programCode,
      category: config.categoryColumn ? row[config.categoryColumn] || null : null,
      subcategory: config.subcategoryColumn ? row[config.subcategoryColumn] || null : null,
      invoiceNumber: config.invoiceColumn ? row[config.invoiceColumn] || null : null,
      referenceNumber: config.referenceColumn ? row[config.referenceColumn] || null : null,
      rawData: row,
      importSession: session,
      status: TransactionStatus.UNMATCHED,
      duplicateType,
      duplicateOfId
    });

    return transaction;
  }

  private parseDate(dateStr: string | number, format?: string): string {
    // Handle Excel date numbers (like 45782)
    if (typeof dateStr === 'number') {
      // Excel dates are days since 1900-01-01, but Excel incorrectly treats 1900 as a leap year
      // So we need to adjust for this
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }

    // Handle string dates
    if (typeof dateStr !== 'string') {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    // Handle common NetSuite date formats
    if (format === 'MM/DD/YYYY') {
      const [month, day, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try to parse as ISO date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    // Fallback: try common formats
    const patterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/    // MM-DD-YYYY
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern);
      if (match) {
        const [, first, second, third] = match;
        // Determine format based on which part is 4 digits
        if (third.length === 4) {
          // MM/DD/YYYY or MM-DD-YYYY
          return `${third}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
        } else if (first.length === 4) {
          // YYYY-MM-DD
          return `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
        }
      }
    }

    throw new Error(`Unable to parse date: ${dateStr}`);
  }

  private parsePeriod(periodStr: string): string {
    // Parse period format like "Jun 2025" or "June 2025"
    const monthNames: { [key: string]: string } = {
      'jan': '01', 'january': '01',
      'feb': '02', 'february': '02',
      'mar': '03', 'march': '03',
      'apr': '04', 'april': '04',
      'may': '05',
      'jun': '06', 'june': '06',
      'jul': '07', 'july': '07',
      'aug': '08', 'august': '08',
      'sep': '09', 'september': '09',
      'oct': '10', 'october': '10',
      'nov': '11', 'november': '11',
      'dec': '12', 'december': '12'
    };

    const parts = periodStr.trim().toLowerCase().split(' ');
    if (parts.length === 2) {
      const month = monthNames[parts[0]];
      const year = parts[1];
      
      if (month && year && /^\d{4}$/.test(year)) {
        return `${year}-${month}-01`; // Return first day of the month
      }
    }

    return periodStr; // Return as-is if can't parse
  }

  async performSmartMatching(sessionId: string): Promise<void> {
    const session = await this.importSessionRepo.findOne({
      where: { id: sessionId },
      relations: ['program']
    });

    if (!session) return;

    const transactions = await this.importTransactionRepo.find({
      where: { importSession: { id: sessionId } },
      relations: ['importSession', 'importSession.program']
    });

    const ledgerEntries = await this.ledgerRepo.find({
      where: { program: { id: session.program.id } }
    });

    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const transaction of transactions) {
      const matches = await this.findMatches(transaction, ledgerEntries, session.importConfig);
      
      if (matches.length > 0) {
        const bestMatch = matches[0];
        transaction.status = TransactionStatus.MATCHED;
        transaction.matchedLedgerEntry = bestMatch.ledgerEntry;
        transaction.matchConfidence = bestMatch.confidence;
        transaction.suggestedMatches = matches.map(m => ({
          id: m.ledgerEntry.id,
          vendorName: m.ledgerEntry.vendor_name,
          description: m.ledgerEntry.expense_description,
          planned_amount: m.ledgerEntry.planned_amount,
          planned_date: m.ledgerEntry.planned_date,
          confidence: m.confidence,
          matchType: m.matchType,
          reasons: m.reasons
        }));
        matchedCount++;
      } else {
        transaction.status = TransactionStatus.UNMATCHED;
        unmatchedCount++;
      }

      await this.importTransactionRepo.save(transaction);
    }

    // Update session counts
    session.matchedRecords = matchedCount;
    session.unmatchedRecords = unmatchedCount;
    session.status = ImportStatus.COMPLETED;
    await this.importSessionRepo.save(session);
  }

  public async findMatches(
    transaction: ImportTransaction,
    ledgerEntries: LedgerEntry[],
    config: ImportConfig
  ): Promise<MatchResult[]> {
    const matches: MatchResult[] = [];
    const tolerance = config.amountTolerance || 0.01; // 1% default tolerance
    const threshold = config.matchThreshold || 0.7; // 70% default threshold

    // Get rejected ledger entry IDs for this transaction
    const rejectedMatches = await this.rejectedMatchRepo.find({
      where: { transaction: { id: transaction.id } },
      relations: ['ledgerEntry']
    });
    const rejectedLedgerEntryIds = new Set(rejectedMatches.map(rm => rm.ledgerEntry.id));

    let checkedCount = 0;
    let skippedActualsCount = 0;
    let skippedRejectedCount = 0;
    let belowThresholdCount = 0;

    for (const entry of ledgerEntries) {
      checkedCount++;
      
      // Skip entries that already have actuals - we want to match to planned/baseline entries
      if (entry.actual_amount !== null || entry.actual_date !== null) {
        skippedActualsCount++;
        continue;
      }

      // Skip entries that have been rejected for this transaction
      if (rejectedLedgerEntryIds.has(entry.id)) {
        skippedRejectedCount++;
        continue;
      }

      const confidence = this.calculateMatchConfidence(transaction, entry, tolerance);
      
      if (confidence >= threshold) {
        const matchType = this.determineMatchType(transaction, entry, confidence);
        const reasons = this.generateMatchReasons(transaction, entry, confidence);
        
        matches.push({
          ledgerEntry: entry,
          confidence,
          matchType,
          reasons
        });
      } else {
        belowThresholdCount++;
      }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateMatchConfidence(
    transaction: ImportTransaction,
    entry: LedgerEntry,
    tolerance: number
  ): number {
    // Skip entries that already have actuals - we want to match to planned/baseline entries
    if (entry.actual_amount !== null || entry.actual_date !== null) {
      return 0;
    }

    let score = 0;
    let maxScore = 0;
    let debugScores: { [key: string]: number } = {};

    // Vendor name matching (50% weight) - highest priority since it's most reliable
    maxScore += 50;
    const vendorSimilarity = this.calculateStringSimilarity(
      transaction.vendorName.toLowerCase(),
      entry.vendor_name.toLowerCase()
    );
    const vendorScore = 50 * vendorSimilarity;
    score += vendorScore;
    debugScores.vendor = vendorScore;

    // Date matching (30% weight) - compare by month using period field or transaction date
    maxScore += 30;
    let dateMatched = false;
    let dateScore = 0;
    
    // First try to match using period field if available
    if (transaction.rawData && transaction.rawData.Period) {
      const periodDate = this.parsePeriod(transaction.rawData.Period);
      if (periodDate && entry.planned_date) {
        const periodMonth = new Date(periodDate).getMonth();
        const periodYear = new Date(periodDate).getFullYear();
        const plannedMonth = new Date(entry.planned_date).getMonth();
        const plannedYear = new Date(entry.planned_date).getFullYear();
        
        if (periodMonth === plannedMonth && periodYear === plannedYear) {
          dateScore = 30;
          dateMatched = true;
        }
      }
    }
    
    // Fallback to transaction date if period didn't match
    if (!dateMatched && transaction.transactionDate && entry.planned_date) {
      const transMonth = new Date(transaction.transactionDate).getMonth();
      const transYear = new Date(transaction.transactionDate).getFullYear();
      const plannedMonth = new Date(entry.planned_date).getMonth();
      const plannedYear = new Date(entry.planned_date).getFullYear();
      
      if (transMonth === plannedMonth && transYear === plannedYear) {
        dateScore = 30;
        dateMatched = true;
      }
    }
    
    score += dateScore;
    debugScores.date = dateScore;

    // Amount matching (15% weight) - compare against planned_amount only
    maxScore += 15;
    let amountScore = 0;
    if (entry.planned_amount !== null) {
      const amountDiff = Math.abs(transaction.amount - entry.planned_amount);
      const amountPercent = amountDiff / transaction.amount;
      if (amountPercent <= tolerance) {
        amountScore = 15 * (1 - amountPercent / tolerance);
      }
    }
    score += amountScore;
    debugScores.amount = amountScore;

    // Description matching (5% weight) - reduced since it rarely matches
    maxScore += 5;
    const descSimilarity = this.calculateStringSimilarity(
      transaction.description.toLowerCase(),
      entry.expense_description.toLowerCase()
    );
    const descScore = 5 * descSimilarity;
    score += descScore;
    debugScores.description = descScore;

    const finalConfidence = maxScore > 0 ? score / maxScore : 0;
    
    return finalConfidence;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    
    // Simple Jaccard similarity
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private determineMatchType(
    transaction: ImportTransaction,
    entry: LedgerEntry,
    confidence: number
  ): 'exact' | 'fuzzy' | 'partial' | 'date-based' | 'wbs-based' {
    if (confidence >= 0.95) return 'exact';
    if (confidence >= 0.8) return 'fuzzy';
    if (confidence >= 0.6) return 'partial';
    
    // Check for date-based or WBS-based matches
    if (entry.actual_date && transaction.transactionDate) {
      const dateDiff = Math.abs(
        new Date(transaction.transactionDate).getTime() - 
        new Date(entry.actual_date).getTime()
      );
      if (dateDiff <= 3 * 24 * 60 * 60 * 1000) { // Within 3 days
        return 'date-based';
      }
    }
    
    return 'wbs-based';
  }

  private generateMatchReasons(
    transaction: ImportTransaction,
    entry: LedgerEntry,
    confidence: number
  ): string[] {
    const reasons: string[] = [];
    
    if (entry.actual_amount !== null) {
      const amountDiff = Math.abs(transaction.amount - entry.actual_amount);
      if (amountDiff < 0.01) {
        reasons.push('Exact amount match');
      } else {
        reasons.push(`Amount within ${amountDiff.toFixed(2)} tolerance`);
      }
    }
    
    if (transaction.vendorName.toLowerCase() === entry.vendor_name.toLowerCase()) {
      reasons.push('Exact vendor name match');
    } else {
      const similarity = this.calculateStringSimilarity(
        transaction.vendorName.toLowerCase(),
        entry.vendor_name.toLowerCase()
      );
      if (similarity > 0.8) {
        reasons.push(`Vendor name ${(similarity * 100).toFixed(0)}% similar`);
      }
    }
    
    if (entry.actual_date && transaction.transactionDate) {
      const dateDiff = Math.abs(
        new Date(transaction.transactionDate).getTime() - 
        new Date(entry.actual_date).getTime()
      );
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
      if (daysDiff <= 1) {
        reasons.push('Same transaction date');
      } else if (daysDiff <= 7) {
        reasons.push(`Date within ${Math.round(daysDiff)} days`);
      }
    }
    
    return reasons;
  }

  async confirmMatch(transactionId: string, ledgerEntryId: string): Promise<void> {
    const transaction = await this.importTransactionRepo.findOne({
      where: { id: transactionId },
      relations: ['matchedLedgerEntry']
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const ledgerEntry = await this.ledgerRepo.findOneBy({ id: ledgerEntryId });
    if (!ledgerEntry) {
      throw new Error('Ledger entry not found');
    }

    // Update the ledger entry with actual data
    ledgerEntry.actual_amount = transaction.amount;
    ledgerEntry.actual_date = transaction.transactionDate;
    if (transaction.invoiceNumber) {
      ledgerEntry.notes = `Invoice: ${transaction.invoiceNumber}`;
    }

    await this.ledgerRepo.save(ledgerEntry);

    // Update transaction status
    transaction.status = TransactionStatus.CONFIRMED;
    transaction.matchedLedgerEntry = ledgerEntry;
    await this.importTransactionRepo.save(transaction);
  }

  async addUnmatchedToLedger(transactionId: string, wbsCategory: string, wbsSubcategory: string): Promise<void> {
    const transaction = await this.importTransactionRepo.findOne({
      where: { id: transactionId },
      relations: ['importSession', 'importSession.program']
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Create new ledger entry
    const ledgerEntry = this.ledgerRepo.create({
      vendor_name: transaction.vendorName,
      expense_description: transaction.description,
      wbs_category: wbsCategory,
      wbs_subcategory: wbsSubcategory,
      baseline_date: null,
      baseline_amount: null,
      planned_date: null,
      planned_amount: null,
      actual_date: transaction.transactionDate,
      actual_amount: transaction.amount,
      notes: `Unplanned expense from import. Invoice: ${transaction.invoiceNumber || 'N/A'}`,
      program: transaction.importSession.program
    });

    await this.ledgerRepo.save(ledgerEntry);

    // Update transaction status
    transaction.status = TransactionStatus.ADDED_TO_LEDGER;
    transaction.matchedLedgerEntry = ledgerEntry;
    await this.importTransactionRepo.save(transaction);
  }

  async getImportSession(sessionId: string): Promise<ImportSession | null> {
    return await this.importSessionRepo.findOne({
      where: { id: sessionId },
      relations: ['program']
    });
  }

  async getImportTransactions(sessionId: string): Promise<ImportTransaction[]> {
    return await this.importTransactionRepo.find({
      where: { importSession: { id: sessionId } },
      relations: ['matchedLedgerEntry', 'importSession']
    });
  }

  async getImportSessions(programId: string): Promise<ImportSession[]> {
    return await this.importSessionRepo.find({
      where: { program: { id: programId } },
      relations: ['program'],
      order: { createdAt: 'DESC' }
    });
  }

  async removeMatch(transactionId: string): Promise<void> {
    const transaction = await this.importTransactionRepo.findOne({
      where: { id: transactionId },
      relations: ['matchedLedgerEntry']
    });
    if (!transaction) throw new Error('Transaction not found');
    if (!transaction.matchedLedgerEntry) throw new Error('No matched ledger entry to remove');
    const ledgerEntry = await this.ledgerRepo.findOneBy({ id: transaction.matchedLedgerEntry.id });
    if (!ledgerEntry) throw new Error('Ledger entry not found');
    // Remove actuals from ledger entry
    ledgerEntry.actual_amount = null;
    ledgerEntry.actual_date = null;
    if (ledgerEntry.notes && ledgerEntry.notes.startsWith('Invoice:')) ledgerEntry.notes = null;
    await this.ledgerRepo.save(ledgerEntry);
    // Revert transaction status (do NOT clear matchedLedgerEntry)
    transaction.status = TransactionStatus.MATCHED;
    await this.importTransactionRepo.save(transaction);
  }

  async undoReject(transactionId: string, ledgerEntryId: string): Promise<void> {
    const rejected = await this.rejectedMatchRepo.findOne({ 
      where: { transaction: { id: transactionId }, ledgerEntry: { id: ledgerEntryId } },
      relations: ['ledgerEntry']
    });
    
    if (rejected) {
      await this.rejectedMatchRepo.remove(rejected);
    }
    
    // Log all remaining rejected matches for this transaction
    const remainingRejected = await this.rejectedMatchRepo.find({
      where: { transaction: { id: transactionId } },
      relations: ['ledgerEntry']
    });
  }

  async rejectMatch(transactionId: string, ledgerEntryId: string): Promise<void> {
    const transaction = await this.importTransactionRepo.findOneBy({ id: transactionId });
    if (!transaction) throw new Error('Transaction not found');
    
    // Prevent duplicate rejected match
    const existing = await this.rejectedMatchRepo.findOne({ 
      where: { transaction: { id: transactionId }, ledgerEntry: { id: ledgerEntryId } },
      relations: ['ledgerEntry']
    });
    
    if (!existing) {
      const ledgerEntry = await this.ledgerRepo.findOneBy({ id: ledgerEntryId });
      if (!ledgerEntry) throw new Error('Ledger entry not found');
      
      const rejected = this.rejectedMatchRepo.create({ transaction, ledgerEntry: { id: ledgerEntryId } });
      await this.rejectedMatchRepo.save(rejected);
    }
    
    // Do NOT set status to unmatched or clear matchedLedgerEntry
    // The status should remain 'matched' even if all matches are rejected
    await this.importTransactionRepo.save(transaction);
  }

  async getRejectedLedgerEntries(transactionId: string): Promise<LedgerEntry[]> {
    const rejected = await this.rejectedMatchRepo.find({ where: { transaction: { id: transactionId } }, relations: ['ledgerEntry'] });
    return rejected.map(r => r.ledgerEntry);
  }

  // Public helper for routes: get transaction with session and program
  public async getTransactionWithSession(transactionId: string) {
    return this.importTransactionRepo.findOne({
      where: { id: transactionId },
      relations: ['importSession', 'importSession.program']
    });
  }

  // Public helper for routes: get all ledger entries for a program
  public async getLedgerEntriesForProgram(programId: string) {
    return this.ledgerRepo.find({ where: { program: { id: programId } } });
  }

  // Public helper for routes: get all rejected matches for a transaction
  public async getRejectedMatchesForTransaction(transactionId: string) {
    return this.rejectedMatchRepo.find({ where: { transaction: { id: transactionId } }, relations: ['ledgerEntry'] });
  }
} 