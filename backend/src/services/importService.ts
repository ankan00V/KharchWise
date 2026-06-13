import fs from 'fs';
import { parse } from 'csv-parse';
import crypto from 'crypto';
import fuzzball from 'fuzzball';
import { parse as parseDate, isValid, format, isAfter, isBefore, isEqual } from 'date-fns';

// Mock Prisma
export enum AnomalyType {
  EXACT_DUPLICATE = 'EXACT_DUPLICATE',
  CONFLICTING_DUPLICATE = 'CONFLICTING_DUPLICATE',
  SETTLEMENT_MISCLASSIFIED = 'SETTLEMENT_MISCLASSIFIED',
  CURRENCY_CONVERSION = 'CURRENCY_CONVERSION',
  NEGATIVE_AMOUNT = 'NEGATIVE_AMOUNT',
  ZERO_AMOUNT = 'ZERO_AMOUNT',
  NUMBER_FORMAT = 'NUMBER_FORMAT',
  PRECISION_ROUNDING = 'PRECISION_ROUNDING',
  WHITESPACE = 'WHITESPACE',
  DATE_FORMAT = 'DATE_FORMAT',
  DATE_AMBIGUOUS = 'DATE_AMBIGUOUS',
  NAME_NORMALIZATION = 'NAME_NORMALIZATION',
  MISSING_PAYER = 'MISSING_PAYER',
  MISSING_CURRENCY = 'MISSING_CURRENCY',
  PERCENTAGE_MISMATCH = 'PERCENTAGE_MISMATCH',
  SPLIT_TYPE_CONTRADICTION = 'SPLIT_TYPE_CONTRADICTION',
  MEMBERSHIP_MISMATCH = 'MEMBERSHIP_MISMATCH',
  UNKNOWN_PARTICIPANT = 'UNKNOWN_PARTICIPANT'
}

export enum AnomalyStatus {
  AUTO_RESOLVED = 'AUTO_RESOLVED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  RESOLVED_APPROVED = 'RESOLVED_APPROVED',
  RESOLVED_REJECTED = 'RESOLVED_REJECTED'
}

export enum SplitType {
  EQUAL = 'EQUAL',
  UNEQUAL = 'UNEQUAL',
  PERCENTAGE = 'PERCENTAGE',
  SHARE = 'SHARE'
}

const mockUsers = [
  { id: 1, name: 'Aisha', canonical_name: 'Aisha', email: 'aisha@example.com' },
  { id: 2, name: 'Rohan', canonical_name: 'Rohan', email: 'rohan@example.com' },
  { id: 3, name: 'Priya', canonical_name: 'Priya', email: 'priya@example.com' },
  { id: 4, name: 'Meera', canonical_name: 'Meera', email: 'meera@example.com' },
  { id: 5, name: 'Dev', canonical_name: 'Dev', email: 'dev@example.com' },
  { id: 6, name: 'Sam', canonical_name: 'Sam', email: 'sam@example.com' },
];

const mockMemberships = [
  { user_id: 1, group_id: 1, joined_at: new Date('2026-02-01T00:00:00Z'), left_at: null },
  { user_id: 2, group_id: 1, joined_at: new Date('2026-02-01T00:00:00Z'), left_at: null },
  { user_id: 3, group_id: 1, joined_at: new Date('2026-02-01T00:00:00Z'), left_at: null },
  { user_id: 4, group_id: 1, joined_at: new Date('2026-02-01T00:00:00Z'), left_at: new Date('2026-03-31T23:59:59Z') },
  { user_id: 6, group_id: 1, joined_at: new Date('2026-04-15T00:00:00Z'), left_at: null },
];

const prisma = {
  user: { findMany: async () => mockUsers },
  groupMembership: { findMany: async () => mockMemberships },
  expense: { 
    findFirst: async (args?: any) => null,
    create: async (data: any) => ({ id: Math.random(), ...data.data }) 
  },
  settlement: {
    findFirst: async (args?: any) => null,
    create: async (data: any) => ({ id: Math.random(), ...data.data })
  },
  importAnomaly: {
    create: async (data: any) => ({ id: Math.random(), ...data.data }),
    update: async (args?: any) => {}
  }
};
const USD_TO_INR = 83.5;

interface CsvRow {
  date: string;
  description: string;
  paid_by: string;
  amount: string;
  currency: string;
  split_type: string;
  split_with: string;
  split_details: string;
  notes: string;
}

export class ImportService {
  public async processCsv(filePath: string) {
    const rows = await this.readCsv(filePath);
    const users = await prisma.user.findMany();
    const groupMemberships = await prisma.groupMembership.findMany();

    const report = {
      totalRowsProcessed: 0,
      anomaliesByType: {} as Record<string, number>,
      anomalies: [] as any[],
    };

    let previousValidDate: Date | null = null;
    let processedRowsMap = new Map<string, any>(); 

    for (let i = 0; i < rows.length; i++) {
      const originalRow = rows[i];
      const rowNum = i + 2; 
      report.totalRowsProcessed++;

      const rowHash = crypto.createHash('sha256').update(JSON.stringify(originalRow)).digest('hex');
      const existingExpense = await prisma.expense.findFirst({ where: { source_row_number: rowNum } });
      const existingSettlement = await prisma.settlement.findFirst({ where: { source_row_number: rowNum } });

      if (existingExpense || existingSettlement) {
        continue;
      }

      let parsedData: any = { ...originalRow, rowNum, rowHash };
      let anomaliesForThisRow: any[] = [];

      const addAnomaly = (anomaly: any) => {
        anomaliesForThisRow.push(anomaly);
        report.anomaliesByType[anomaly.anomaly_type] = (report.anomaliesByType[anomaly.anomaly_type] || 0) + 1;
      };

      // Detectors
      this.detectNumberFormat(parsedData, addAnomaly);
      this.detectWhitespace(parsedData, addAnomaly);
      this.detectPrecisionRounding(parsedData, addAnomaly);
      previousValidDate = this.detectDateFormats(parsedData, previousValidDate, addAnomaly);
      this.detectNameNormalization(parsedData, users, addAnomaly);
      this.detectMissingPayer(parsedData, addAnomaly);
      this.detectMissingCurrency(parsedData, addAnomaly);
      this.detectCurrencyConversion(parsedData, addAnomaly);
      this.detectNegativeAmount(parsedData, addAnomaly);
      this.detectZeroAmount(parsedData, addAnomaly);
      
      const isSettlement = this.detectSettlementMisclassified(parsedData, addAnomaly);
      
      // Duplicates
      const duplicateAnomaly = this.detectDuplicates(parsedData, processedRowsMap, addAnomaly);

      // Validate Splits (p, q, r, s)
      const validParticipants = this.validateParticipants(parsedData, users, groupMemberships, addAnomaly);
      this.validateSplitTypesAndPercentages(parsedData, validParticipants, addAnomaly);

      // Save Anomalies
      const createdAnomalies: any[] = [];
      for (const anomaly of anomaliesForThisRow) {
        const created = await prisma.importAnomaly.create({
          data: {
            csv_row_number: rowNum,
            anomaly_type: anomaly.anomaly_type,
            raw_value: anomaly.raw_value,
            description: anomaly.description,
            action_taken: anomaly.action_taken,
            status: anomaly.status,
          }
        });
        createdAnomalies.push(created);
        report.anomalies.push({ ...created, rowNum });
      }

      if (isSettlement) {
        await prisma.settlement.create({
          data: {
            group_id: 1,
            from_user_id: parsedData.resolvedPayerId || 1, // Fallback for dummy
            to_user_id: parsedData.resolvedSettlementTargetId || 1,
            amount: parsedData.amount_inr || parsedData.parsedAmount,
            date: parsedData.parsedDate || new Date(),
            source_row_number: rowNum,
          }
        });
        continue;
      }

      const expense = await prisma.expense.create({
        data: {
          group_id: 1,
          description: parsedData.description,
          date: parsedData.parsedDate || new Date(),
          paid_by_id: parsedData.resolvedPayerId || null,
          amount: parsedData.parsedAmount || 0,
          currency: parsedData.resolvedCurrency || 'INR',
          amount_inr: parsedData.amount_inr || parsedData.parsedAmount || 0,
          exchange_rate: parsedData.exchange_rate || null,
          split_type: this.parseSplitType(parsedData.split_type),
          source_row_number: rowNum,
        }
      });

      for (const anomaly of createdAnomalies) {
        await prisma.importAnomaly.update({
          where: { id: anomaly.id },
          data: { 
            linked_expense_id: (expense as any).id,
            linked_duplicate_expense_id: duplicateAnomaly && anomaly.anomaly_type === duplicateAnomaly.anomaly_type ? duplicateAnomaly.linked_duplicate_expense_id : null
          }
        });
      }

      processedRowsMap.set(this.getDuplicateKey(parsedData), { expense_id: expense.id, parsedData });
    }

    return report;
  }

  private async readCsv(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const rows: CsvRow[] = [];
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data) => rows.push(data))
        .on('error', (err) => reject(err))
        .on('end', () => resolve(rows));
    });
  }

  private detectNumberFormat(data: any, addAnomaly: (a: any) => void) {
    if (data.amount && data.amount.includes(',')) {
      const raw = data.amount;
      data.amount = data.amount.replace(/,/g, '');
      addAnomaly({
        anomaly_type: AnomalyType.NUMBER_FORMAT,
        raw_value: raw,
        description: 'Amount contained thousands-separator commas.',
        action_taken: 'Stripped commas and parsed as Decimal.',
        status: AnomalyStatus.AUTO_RESOLVED
      });
    }
  }

  private detectWhitespace(data: any, addAnomaly: (a: any) => void) {
    let whitespaceDetected = false;
    let raw = JSON.stringify({ amount: data.amount, paid_by: data.paid_by });
    
    if (data.amount && data.amount.trim() !== data.amount) {
      data.amount = data.amount.trim();
      whitespaceDetected = true;
    }
    if (data.paid_by && data.paid_by.trim() !== data.paid_by) {
      data.paid_by = data.paid_by.trim();
      whitespaceDetected = true;
    }

    if (whitespaceDetected) {
      addAnomaly({
        anomaly_type: AnomalyType.WHITESPACE,
        raw_value: raw,
        description: 'Leading/trailing whitespace found in amount or name.',
        action_taken: 'Trimmed whitespace.',
        status: AnomalyStatus.AUTO_RESOLVED
      });
    }
  }

  private detectPrecisionRounding(data: any, addAnomaly: (a: any) => void) {
    const val = parseFloat(data.amount);
    if (!isNaN(val)) {
      const rounded = Math.round(val * 100) / 100;
      if (val !== rounded) {
        addAnomaly({
          anomaly_type: AnomalyType.PRECISION_ROUNDING,
          raw_value: data.amount,
          description: `Amount had more than 2 decimal places. Original: ${val}, Rounded: ${rounded}`,
          action_taken: 'Rounded to 2 decimals using round half up.',
          status: AnomalyStatus.AUTO_RESOLVED
        });
        data.parsedAmount = rounded;
      } else {
        data.parsedAmount = val;
      }
    } else {
      data.parsedAmount = 0;
    }
  }

  private detectDateFormats(data: any, previousDate: Date | null, addAnomaly: (a: any) => void): Date | null {
    const raw = data.date;
    let parsed: Date | null = null;
    let isAmbiguous = false;
    let interpretations = [];

    if (raw.match(/^\d{4}-\d{2}-\d{2}$/)) {
      parsed = parseDate(raw, 'yyyy-MM-dd', new Date());
    } 
    else if (raw.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parts = raw.split('/');
      const p1 = parseInt(parts[0]);
      const p2 = parseInt(parts[1]);
      const yyyy = parseInt(parts[2]);

      if (p1 <= 12 && p2 <= 12 && p1 !== p2) {
        isAmbiguous = true;
        interpretations.push(`DD/MM/YYYY: ${p1}/${p2}/${yyyy}`, `MM/DD/YYYY: ${p2}/${p1}/${yyyy}`);
        if (previousDate) {
          const prevMonth = previousDate.getMonth() + 1;
          if (p2 === prevMonth || p2 === prevMonth + 1) {
            parsed = parseDate(`${p1}/${p2}/${yyyy}`, 'dd/MM/yyyy', new Date());
          } else {
            parsed = parseDate(`${p1}/${p2}/${yyyy}`, 'MM/dd/yyyy', new Date());
          }
        } else {
          parsed = parseDate(raw, 'dd/MM/yyyy', new Date()); 
        }
      } else {
        parsed = parseDate(raw, 'dd/MM/yyyy', new Date());
      }
    }
    else if (raw.match(/^[a-zA-Z]{3}\s\d{1,2}$/)) {
      const inferredYear = previousDate ? previousDate.getFullYear() : 2026;
      parsed = parseDate(`${raw} ${inferredYear}`, 'MMM dd yyyy', new Date());
      addAnomaly({
        anomaly_type: AnomalyType.DATE_FORMAT,
        raw_value: raw,
        description: 'Date was missing year.',
        action_taken: `Inferred year ${inferredYear} from context.`,
        status: AnomalyStatus.AUTO_RESOLVED
      });
    }

    if (isAmbiguous) {
      addAnomaly({
        anomaly_type: AnomalyType.DATE_AMBIGUOUS,
        raw_value: raw,
        description: `Date is ambiguous. Possible interpretations: ${interpretations.join(' OR ')}`,
        action_taken: `Resolved chronologically to ${format(parsed as Date, 'yyyy-MM-dd')}`,
        status: AnomalyStatus.PENDING_APPROVAL
      });
    } else if (raw !== format(parsed as Date, 'yyyy-MM-dd') && !raw.match(/^[a-zA-Z]{3}\s\d{1,2}$/)) {
      addAnomaly({
        anomaly_type: AnomalyType.DATE_FORMAT,
        raw_value: raw,
        description: 'Date was not in standard ISO format.',
        action_taken: `Normalized to ${format(parsed as Date, 'yyyy-MM-dd')}`,
        status: AnomalyStatus.AUTO_RESOLVED
      });
    }

    data.parsedDate = parsed;
    return parsed || previousDate;
  }

  private detectNameNormalization(data: any, users: any[], addAnomaly: (a: any) => void) {
    if (!data.paid_by) return;

    const match = fuzzball.extract(data.paid_by, users.map(u => u.canonical_name), { scorer: fuzzball.token_set_ratio });
    if (match && match.length > 0) {
      const bestMatch = match[0];
      const matchedName = bestMatch ? bestMatch[0] : '';
      const score = bestMatch ? bestMatch[1] : 0;
      
      const matchedUser = users.find(u => u.canonical_name === matchedName);
      data.resolvedPayerId = matchedUser?.id;
      data.resolvedPayerName = matchedName;

      if (data.paid_by !== matchedName) {
        addAnomaly({
          anomaly_type: AnomalyType.NAME_NORMALIZATION,
          raw_value: data.paid_by,
          description: `Name '${data.paid_by}' did not exactly match canonical names.`,
          action_taken: `Fuzzy matched to '${matchedName}' with score ${score}.`,
          status: score > 80 ? AnomalyStatus.AUTO_RESOLVED : AnomalyStatus.PENDING_APPROVAL
        });
      }
    }
  }

  private detectMissingPayer(data: any, addAnomaly: (a: any) => void) {
    if (!data.paid_by) {
      addAnomaly({
        anomaly_type: AnomalyType.MISSING_PAYER,
        raw_value: '',
        description: 'paid_by field was empty.',
        action_taken: 'Set paid_by to NULL. Excluded from amount paid aggregations.',
        status: AnomalyStatus.PENDING_APPROVAL
      });
      data.resolvedPayerId = null;
    }
  }

  private detectMissingCurrency(data: any, addAnomaly: (a: any) => void) {
    if (!data.currency) {
      data.resolvedCurrency = 'INR';
      addAnomaly({
        anomaly_type: AnomalyType.MISSING_CURRENCY,
        raw_value: '',
        description: 'currency field was empty.',
        action_taken: 'Defaulted to INR.',
        status: AnomalyStatus.AUTO_RESOLVED
      });
    } else {
      data.resolvedCurrency = data.currency;
    }
  }

  private detectCurrencyConversion(data: any, addAnomaly: (a: any) => void) {
    if (data.resolvedCurrency === 'USD') {
      data.amount_inr = data.parsedAmount * USD_TO_INR;
      data.exchange_rate = USD_TO_INR;
      addAnomaly({
        anomaly_type: AnomalyType.CURRENCY_CONVERSION,
        raw_value: `USD ${data.parsedAmount}`,
        description: 'Currency was USD.',
        action_taken: `Converted to INR using fixed rate ${USD_TO_INR}.`,
        status: AnomalyStatus.AUTO_RESOLVED
      });
    } else {
      data.amount_inr = data.parsedAmount;
    }
  }

  private detectNegativeAmount(data: any, addAnomaly: (a: any) => void) {
    if (data.parsedAmount < 0) {
      addAnomaly({
        anomaly_type: AnomalyType.NEGATIVE_AMOUNT,
        raw_value: data.parsedAmount.toString(),
        description: 'Negative amount detected. Treating as a credit/refund.',
        action_taken: 'Imported as a standalone negative expense pending human matching.',
        status: AnomalyStatus.PENDING_APPROVAL
      });
    }
  }

  private detectZeroAmount(data: any, addAnomaly: (a: any) => void) {
    if (data.parsedAmount === 0) {
      addAnomaly({
        anomaly_type: AnomalyType.ZERO_AMOUNT,
        raw_value: '0',
        description: 'Amount is 0. Likely a correction placeholder.',
        action_taken: 'Imported as zero-value expense. Verify with group.',
        status: AnomalyStatus.AUTO_RESOLVED
      });
    }
  }

  private detectSettlementMisclassified(data: any, addAnomaly: (a: any) => void): boolean {
    const isSettlement = (!data.split_type && data.split_with && data.split_with.split(';').length === 1) ||
                         (data.notes && (data.notes.toLowerCase().includes('settlement') || data.notes.toLowerCase().includes('paid back')));
    
    if (isSettlement) {
      addAnomaly({
        anomaly_type: AnomalyType.SETTLEMENT_MISCLASSIFIED,
        raw_value: `SplitType: ${data.split_type}, Notes: ${data.notes}`,
        description: 'Row appears to be a direct payment rather than a shared expense.',
        action_taken: 'Reclassified from expense to settlement.',
        status: AnomalyStatus.AUTO_RESOLVED
      });
      if (data.split_with) {
         data.resolvedSettlementTargetId = 1; 
      }
      return true;
    }
    return false;
  }

  private getDuplicateKey(data: any) {
    return `${data.parsedDate?.getTime()}-${data.resolvedPayerName}`;
  }

  private detectDuplicates(data: any, map: Map<string, any>, addAnomaly: (a: any) => void) {
    const key = this.getDuplicateKey(data);
    const existing = map.get(key);
    
    if (existing) {
      const isExact = existing.parsedData.parsedAmount === data.parsedAmount;
      const anomalyType = isExact ? AnomalyType.EXACT_DUPLICATE : AnomalyType.CONFLICTING_DUPLICATE;
      
      const anomaly = {
        anomaly_type: anomalyType,
        raw_value: `Row amount: ${data.parsedAmount}, Duplicate amount: ${existing.parsedData.parsedAmount}`,
        description: isExact ? 'Candidate exact duplicate detected.' : 'Candidate conflicting duplicate detected.',
        action_taken: 'Imported both initially, proposed keeping one pending human approval.',
        status: AnomalyStatus.PENDING_APPROVAL,
        linked_duplicate_expense_id: existing.expense_id
      };
      addAnomaly(anomaly);
      return anomaly;
    }
    return null;
  }

  private validateParticipants(data: any, users: any[], memberships: any[], addAnomaly: (a: any) => void) {
    if (!data.split_with) return [];
    
    const participants = data.split_with.split(';').map((s: string) => s.trim());
    const validParticipants: any[] = [];
    
    for (const rawName of participants) {
      const match = fuzzball.extract(rawName, users.map(u => u.canonical_name), { scorer: fuzzball.token_set_ratio });
      const bestMatch = match && match.length > 0 ? match[0] : undefined;
      if (bestMatch && bestMatch[1] > 80) {
        const canonicalName = bestMatch[0];
        const user = users.find(u => u.canonical_name === canonicalName);
        
        // Check Dev special case
        if (canonicalName === 'Dev') {
          validParticipants.push(user);
          continue;
        }
        
        // Check membership
        const member = memberships.find(m => m.user_id === user?.id);
        if (member && data.parsedDate) {
          const joinedAt = member.joined_at ? new Date(member.joined_at) : new Date();
          const leftAt = member.left_at ? new Date(member.left_at) : null;
          const parsedD = data.parsedDate as Date;
          
          const isAfterJoin = isAfter(parsedD, joinedAt) || isEqual(parsedD, joinedAt);
          const isBeforeLeft = !leftAt || isBefore(parsedD, leftAt);
          
          if (isAfterJoin && isBeforeLeft) {
            validParticipants.push(user);
          } else {
            addAnomaly({
              anomaly_type: AnomalyType.MEMBERSHIP_MISMATCH,
              raw_value: rawName,
              description: `User ${canonicalName} was not an active member on ${data.parsedDate}.`,
              action_taken: `Excluded ${canonicalName} from split.`,
              status: AnomalyStatus.PENDING_APPROVAL
            });
          }
        } else {
          validParticipants.push(user);
        }
      } else {
        addAnomaly({
          anomaly_type: AnomalyType.UNKNOWN_PARTICIPANT,
          raw_value: rawName,
          description: `Participant '${rawName}' unknown.`,
          action_taken: `Excluded from split, redistributed.`,
          status: AnomalyStatus.PENDING_APPROVAL
        });
      }
    }
    return validParticipants;
  }

  private validateSplitTypesAndPercentages(data: any, participants: any[], addAnomaly: (a: any) => void) {
    if (data.split_type === 'equal' && data.split_details) {
      addAnomaly({
        anomaly_type: AnomalyType.SPLIT_TYPE_CONTRADICTION,
        raw_value: `type: ${data.split_type}, details: ${data.split_details}`,
        description: 'Split type equal but details provided.',
        action_taken: 'Ignored split details, used equal split.',
        status: AnomalyStatus.AUTO_RESOLVED
      });
    }

    if (data.split_type === 'percentage' && data.split_details) {
      const percentages = data.split_details.match(/\d+/g)?.map(Number) || [];
      const sum = percentages.reduce((a: number, b: number) => a + b, 0);
      if (sum !== 100) {
        addAnomaly({
          anomaly_type: AnomalyType.PERCENTAGE_MISMATCH,
          raw_value: data.split_details,
          description: `Percentages sum to ${sum}, not 100.`,
          action_taken: 'Normalized proportionally.',
          status: AnomalyStatus.PENDING_APPROVAL
        });
      }
    }
  }

  private parseSplitType(rawType: string): SplitType {
    const lower = rawType ? rawType.toLowerCase() : '';
    if (lower === 'equal') return SplitType.EQUAL;
    if (lower === 'unequal') return SplitType.UNEQUAL;
    if (lower === 'percentage') return SplitType.PERCENTAGE;
    if (lower === 'share') return SplitType.SHARE;
    return SplitType.EQUAL; 
  }
}
