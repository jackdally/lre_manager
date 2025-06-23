import { AppDataSource } from '../config/database';
import { ImportSession, ImportStatus } from '../entities/ImportSession';
import { ImportTransaction, TransactionStatus } from '../entities/ImportTransaction';
import { LedgerEntry } from '../entities/LedgerEntry';
import { Program } from '../entities/Program';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { Like, Between } from 'typeorm';

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

      console.log(`[PROCESSING DEBUG] Starting to process file: ${session.originalFilename}`);
      console.log(`[PROCESSING DEBUG] Program: ${session.program.code} (${session.program.name})`);

      // Read and parse the file
      const workbook = XLSX.readFile(session.filename);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      console.log(`[PROCESSING DEBUG] Found ${rows.length} rows in file`);
      console.log(`[PROCESSING DEBUG] Column mapping:`, session.importConfig);

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
              if (validationFailCount <= 3) {
                console.log(`[PROCESSING DEBUG] Row ${i + 2} validation failed: Vendor=${!!vendorName}, Desc=${!!description}, Amount=${!isNaN(amount)}, Date=${!!dateStr}`);
              }
            } else if (!programCodeRaw || typeof programCodeRaw !== 'string' || programCodeRaw.trim() === '') {
              noProgramCodeCount++;
              if (noProgramCodeCount <= 3) {
                console.log(`[PROCESSING DEBUG] Row ${i + 2} no program code: "${vendorName}" - "${description}"`);
              }
            } else {
              // Check if it's a program mismatch (has program code but doesn't match)
              const programCodeMatch = programCodeRaw.match(/([A-Z]{3}\.\d{4})/);
              if (programCodeMatch && programCodeMatch[1] !== session.program.code) {
                programMismatchCount++;
                if (programMismatchCount <= 3) {
                  console.log(`[PROCESSING DEBUG] Row ${i + 2} program mismatch: Expected ${session.program.code}, got ${programCodeMatch[1]} from "${programCodeRaw}"`);
                }
              } else {
                // Invalid program code format
                noProgramCodeCount++;
                if (noProgramCodeCount <= 3) {
                  console.log(`[PROCESSING DEBUG] Row ${i + 2} invalid program code format: "${programCodeRaw}"`);
                }
              }
            }
          }
        } catch (error) {
          errorCount++;
          console.error(`[PROCESSING DEBUG] Error processing row ${i + 2}:`, error);
        }
      }

      console.log(`[PROCESSING DEBUG] Parsing results: ${transactions.length} valid, ${validationFailCount} validation failures, ${noProgramCodeCount} no program code, ${programMismatchCount} program mismatches, ${errorCount} errors`);

      // Save all transactions
      const savedTransactions = await this.importTransactionRepo.save(transactions);
      console.log(`[PROCESSING DEBUG] Saved ${savedTransactions.length} transactions to database`);

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

    // Debug: Log the first few rows to see what we're getting
    if (Math.random() < 0.1) { // Log ~10% of rows for debugging
      console.log(`[PARSING DEBUG] Raw row data:`, JSON.stringify(row, null, 2));
      console.log(`[PARSING DEBUG] Extracted: Program="${programCodeRaw}", Vendor=${vendorName}, Desc=${description}, Amount=${amount}, Date=${dateStr}, Period=${periodStr}`);
    }

    // Validate required fields (excluding program code for now)
    if (!vendorName || !description || isNaN(amount) || !dateStr) {
      if (Math.random() < 0.1) { // Log some validation failures
        console.log(`[PARSING DEBUG] Validation failed: Vendor=${!!vendorName}, Desc=${!!description}, Amount=${!isNaN(amount)}, Date=${!!dateStr}`);
      }
      return null;
    }

    // Handle program code - extract ABC.1234 pattern if present
    let programCode = null;
    if (programCodeRaw && typeof programCodeRaw === 'string' && programCodeRaw.trim() !== '') {
      // Extract program code using regex pattern ABC.1234 (3 letters + period + 4 numbers)
      const programCodeMatch = programCodeRaw.match(/([A-Z]{3}\.\d{4})/);
      if (programCodeMatch) {
        programCode = programCodeMatch[1];
        console.log(`[PARSING DEBUG] Extracted program code: "${programCode}" from "${programCodeRaw}"`);
      } else {
        console.log(`[PARSING DEBUG] No valid program code pattern found in: "${programCodeRaw}"`);
      }
    }

    // Skip transactions without a valid program code
    if (!programCode) {
      if (Math.random() < 0.1) { // Log some skipped transactions
        console.log(`[PARSING DEBUG] Skipping transaction without program code: "${vendorName}" - "${description}"`);
      }
      return null;
    }

    // Check if this transaction belongs to the current program
    if (programCode !== session.program.code) {
      if (Math.random() < 0.1) { // Log some program mismatches
        console.log(`[PARSING DEBUG] Program mismatch: Expected ${session.program.code}, got ${programCode}`);
      }
      return null;
    }

    // Parse date
    const transactionDate = this.parseDate(dateStr, config.dateFormat);
    
    // Parse period if available
    let periodDate = null;
    if (periodStr) {
      periodDate = this.parsePeriod(periodStr);
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
      status: TransactionStatus.UNMATCHED
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

    console.log(`[MATCHING DEBUG] Processing ${transactions.length} transactions against ${ledgerEntries.length} ledger entries`);
    console.log(`[MATCHING DEBUG] Program: ${session.program.code} (${session.program.name})`);
    
    // Debug: Show sample of ledger entries
    console.log(`[MATCHING DEBUG] Sample ledger entries:`);
    ledgerEntries.slice(0, 3).forEach((entry, i) => {
      console.log(`  ${i + 1}. Vendor: "${entry.vendor_name}", Desc: "${entry.expense_description}", Planned: ${entry.planned_amount}, Date: ${entry.planned_date}, Actual: ${entry.actual_amount}`);
    });

    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const transaction of transactions) {
      console.log(`\n[MATCHING DEBUG] Processing transaction: "${transaction.vendorName}" - "${transaction.description}" ($${transaction.amount}) on ${transaction.transactionDate}`);
      
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
          confidence: m.confidence,
          matchType: m.matchType,
          reasons: m.reasons
        }));
        matchedCount++;
        console.log(`[MATCHING DEBUG] ✓ Found match with confidence ${bestMatch.confidence}: "${bestMatch.ledgerEntry.vendor_name}" - "${bestMatch.ledgerEntry.expense_description}"`);
        console.log(`[MATCHING DEBUG]   Match reasons: ${bestMatch.reasons.join(', ')}`);
      } else {
        transaction.status = TransactionStatus.UNMATCHED;
        unmatchedCount++;
        console.log(`[MATCHING DEBUG] ✗ No matches found`);
      }

      await this.importTransactionRepo.save(transaction);
    }

    console.log(`\n[MATCHING DEBUG] Final results: ${matchedCount} matched, ${unmatchedCount} unmatched`);

    // Update session counts
    session.matchedRecords = matchedCount;
    session.unmatchedRecords = unmatchedCount;
    session.status = ImportStatus.COMPLETED;
    await this.importSessionRepo.save(session);
  }

  private async findMatches(
    transaction: ImportTransaction,
    ledgerEntries: LedgerEntry[],
    config: ImportConfig
  ): Promise<MatchResult[]> {
    const matches: MatchResult[] = [];
    const tolerance = config.amountTolerance || 0.01; // 1% default tolerance
    const threshold = config.matchThreshold || 0.7; // 70% default threshold

    console.log(`[MATCHING DEBUG]   Checking ${ledgerEntries.length} ledger entries with threshold ${threshold}, tolerance ${tolerance}`);

    let checkedCount = 0;
    let skippedActualsCount = 0;
    let belowThresholdCount = 0;

    for (const entry of ledgerEntries) {
      checkedCount++;
      
      // Skip entries that already have actuals - we want to match to planned/baseline entries
      if (entry.actual_amount !== null || entry.actual_date !== null) {
        skippedActualsCount++;
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
        
        console.log(`[MATCHING DEBUG]   ✓ Potential match (${confidence.toFixed(3)}): "${entry.vendor_name}" - "${entry.expense_description}"`);
      } else {
        belowThresholdCount++;
        if (confidence > 0.3) { // Log high-ish confidence matches that didn't make threshold
          console.log(`[MATCHING DEBUG]   - Below threshold (${confidence.toFixed(3)}): "${entry.vendor_name}" - "${entry.expense_description}"`);
        }
      }
    }

    console.log(`[MATCHING DEBUG]   Summary: Checked ${checkedCount}, Skipped ${skippedActualsCount} (has actuals), Below threshold ${belowThresholdCount}, Matches found ${matches.length}`);

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
    
    // Log detailed scoring for high confidence matches or when debugging specific entries
    if (finalConfidence > 0.3 || (transaction.vendorName.toLowerCase().includes('test') || entry.vendor_name.toLowerCase().includes('test'))) {
      console.log(`[MATCHING DEBUG]     Scoring breakdown for "${entry.vendor_name}":`);
      console.log(`[MATCHING DEBUG]       Vendor: ${debugScores.vendor.toFixed(1)}/50 (similarity: ${vendorSimilarity.toFixed(3)})`);
      console.log(`[MATCHING DEBUG]       Date: ${debugScores.date.toFixed(1)}/30 (matched: ${dateMatched})`);
      console.log(`[MATCHING DEBUG]       Amount: ${debugScores.amount.toFixed(1)}/15 (planned: ${entry.planned_amount}, actual: ${transaction.amount})`);
      console.log(`[MATCHING DEBUG]       Description: ${debugScores.description.toFixed(1)}/5 (similarity: ${descSimilarity.toFixed(3)})`);
      console.log(`[MATCHING DEBUG]       Total: ${score.toFixed(1)}/${maxScore} = ${finalConfidence.toFixed(3)}`);
    }

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

  async undoReject(transactionId: string): Promise<void> {
    const transaction = await this.importTransactionRepo.findOneBy({ id: transactionId });
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'rejected') throw new Error('Transaction is not rejected');
    transaction.status = TransactionStatus.MATCHED;
    await this.importTransactionRepo.save(transaction);
  }

  async rejectMatch(transactionId: string): Promise<void> {
    const transaction = await this.importTransactionRepo.findOneBy({ id: transactionId });
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'matched') throw new Error('Only matched transactions can be rejected');
    transaction.status = TransactionStatus.REJECTED;
    await this.importTransactionRepo.save(transaction);
  }
} 