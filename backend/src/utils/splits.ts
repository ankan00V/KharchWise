import { Decimal } from '@prisma/client/runtime/library';

export enum SplitType {
  EQUAL = 'EQUAL',
  PERCENTAGE = 'PERCENTAGE',
  EXACT = 'EXACT',
  SHARE = 'SHARE',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface SplitInput {
  userId: number;
  shareValue?: number; // e.g., percentage, share units, exact amount, adjustment amount
}

export interface SplitResult {
  userId: number;
  amount: Decimal;
}

/**
 * Calculates expense splits ensuring the total matches the exact amount without penny-drop errors.
 * Uses integer math (pennies/paise) under the hood to guarantee precision.
 * 
 * @param amount Total amount of the expense
 * @param participants Array of participants and their split share values
 * @param splitType How the expense is divided
 * @returns Array of precise amounts per user that sum exactly to `amount`
 */
export function calculateSplits(
  amount: Decimal,
  participants: SplitInput[],
  splitType: SplitType
): SplitResult[] {
  // Convert to smallest currency unit (e.g., pennies/paise) to avoid floating point issues
  const totalCents = Math.round(amount.toNumber() * 100);
  let results: { userId: number; amountCents: number }[] = [];

  switch (splitType) {
    case SplitType.EQUAL: {
      const activeParticipants = participants.filter(p => p.shareValue !== 0);
      const count = activeParticipants.length;
      if (count === 0) break;
      
      const baseShare = Math.floor(totalCents / count);
      let remainder = totalCents % count;

      results = participants.map(p => {
        if (p.shareValue === 0) return { userId: p.userId, amountCents: 0 };
        
        let share = baseShare;
        if (remainder > 0) {
          share += 1;
          remainder -= 1;
        }
        return { userId: p.userId, amountCents: share };
      });
      break;
    }

    case SplitType.PERCENTAGE: {
      let remainder = totalCents;
      let totalPercentage = 0;
      
      results = participants.map(p => {
        const perc = p.shareValue || 0;
        totalPercentage += perc;
        const share = Math.floor((totalCents * perc) / 100);
        remainder -= share;
        return { userId: p.userId, amountCents: share };
      });

      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error('Percentages must sum to exactly 100');
      }

      // Distribute remaining pennies
      if (remainder !== 0) {
        results.sort((a, b) => b.amountCents - a.amountCents);
        for (let i = 0; i < remainder; i++) {
          results[i % results.length]!.amountCents += 1;
        }
      }
      break;
    }

    case SplitType.EXACT: {
      let sum = 0;
      results = participants.map(p => {
        const share = Math.round((p.shareValue || 0) * 100);
        sum += share;
        return { userId: p.userId, amountCents: share };
      });

      if (sum !== totalCents) {
        throw new Error('Exact amounts do not sum to total expense amount');
      }
      break;
    }

    case SplitType.SHARE: {
      const totalShares = participants.reduce((acc, p) => acc + (p.shareValue || 0), 0);
      if (totalShares === 0) throw new Error('Total shares must be greater than zero');
      
      let remainder = totalCents;
      results = participants.map(p => {
        const shareUnits = p.shareValue || 0;
        const shareCents = Math.floor((totalCents * shareUnits) / totalShares);
        remainder -= shareCents;
        return { userId: p.userId, amountCents: shareCents };
      });

      // Distribute remaining pennies to those with highest shares first
      if (remainder !== 0) {
        // Sort by shareValue descending, then apply remainder
        const sortedIndices = participants
          .map((p, index) => ({ index, share: p.shareValue || 0 }))
          .sort((a, b) => b.share - a.share);
        
        for (let i = 0; i < remainder; i++) {
          results[sortedIndices[i % sortedIndices.length]!.index]!.amountCents += 1;
        }
      }
      break;
    }

    case SplitType.ADJUSTMENT: {
      const totalAdjustmentCents = participants.reduce((acc, p) => acc + Math.round((p.shareValue || 0) * 100), 0);
      if (totalAdjustmentCents > totalCents) {
        throw new Error('Adjustments exceed total amount');
      }
      
      const remainingCents = totalCents - totalAdjustmentCents;
      const count = participants.length;
      const baseShare = Math.floor(remainingCents / count);
      let remainder = remainingCents % count;

      results = participants.map(p => {
        let share = baseShare + Math.round((p.shareValue || 0) * 100);
        if (remainder > 0) {
          share += 1;
          remainder -= 1;
        }
        return { userId: p.userId, amountCents: share };
      });
      break;
    }

    default:
      throw new Error(`Unsupported SplitType: ${splitType}`);
  }

  return results.map(r => ({
    userId: r.userId,
    amount: new Decimal(r.amountCents).dividedBy(100)
  }));
}
