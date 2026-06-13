import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rounding utility shared function
export const roundToTwoDecimals = (val: number): number => Math.round(val * 100) / 100;

export class BalanceEngine {
  
  // 1. computeGroupBalances(groupId)
  public async computeGroupBalances(groupId: number, asOfDate?: Date) {
    // Fetch non-deleted expenses with their splits
    const expenses = await prisma.expense.findMany({
      where: {
        group_id: groupId,
        deleted_at: null,
        ...(asOfDate ? { date: { lte: asOfDate } } : {})
      },
      include: {
        splits: true
      }
    });

    // Fetch settlements
    const settlements = await prisma.settlement.findMany({
      where: {
        group_id: groupId,
        ...(asOfDate ? { date: { lte: asOfDate } } : {})
      }
    });

    const ledger: Record<number, Record<number, number>> = {};

    const initLedger = (u1: number, u2: number) => {
      if (!ledger[u1]) ledger[u1] = {};
      if (ledger[u1][u2] === undefined) ledger[u1][u2] = 0;
      if (!ledger[u2]) ledger[u2] = {};
      if (ledger[u2][u1] === undefined) ledger[u2][u1] = 0;
    };

    /*
     * Algorithm EXACTLY as requested:
     * a. For each expense, the payer is owed `share_amount` by each other person in ExpenseSplit
     *    (the payer's own share_amount, if present, nets to zero against themselves — don't double count)
     * b. Accumulate this into a running ledger: ledger[A][B] = net amount A owes B (can be negative, meaning B owes A)
     * c. Apply Settlements: if A paid B a settlement of X, reduce ledger[A][B] by X (i.e. A's debt to B decreases)
     * d. Simplify: for each pair (A,B), compute net = ledger[A][B] - ledger[B][A], collapse into a single signed value, then discard ledger[B][A]
     * e. Round each final net amount to 2 decimals
     */

    // a & b. Process Expenses
    for (const exp of expenses) {
      if (!exp.paid_by_id) continue; // Skip unknown payer
      const payerId = exp.paid_by_id;

      for (const split of exp.splits) {
        const participantId = split.user_id;
        if (payerId === participantId) continue; // nets to zero against themselves

        initLedger(participantId, payerId);
        // Participant owes Payer the share_amount
        ledger[participantId]![payerId]! += split.share_amount.toNumber();
      }
    }

    // c. Apply Settlements
    for (const st of settlements) {
      const fromId = st.from_user_id;
      const toId = st.to_user_id;
      initLedger(fromId, toId);
      
      // A paid B a settlement of X, reduce ledger[A][B] by X
      ledger[fromId]![toId]! -= st.amount.toNumber();
    }

    // d & e. Simplify and Round
    const simplifiedLedger: Record<number, Record<number, number>> = {};
    const processedPairs = new Set<string>();

    for (const aStr of Object.keys(ledger)) {
      const A = parseInt(aStr);
      simplifiedLedger[A] = simplifiedLedger[A] || {};
      
      const targets = ledger[A] || {};
      for (const bStr of Object.keys(targets)) {
        const B = parseInt(bStr);
        if (A === B) continue;
        
        const pairKey = A < B ? `${A}-${B}` : `${B}-${A}`;
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const aOwesB = (ledger[A] && ledger[A]![B]) || 0;
        const bOwesA = (ledger[B] && ledger[B]![A]) || 0;

        // net = ledger[A][B] - ledger[B][A]
        let net = aOwesB - bOwesA;
        // Round to 2 decimals
        net = roundToTwoDecimals(net);

        if (!simplifiedLedger[A]) simplifiedLedger[A] = {};
        if (!simplifiedLedger[B]) simplifiedLedger[B] = {};

        if (net > 0) {
          // A owes B
          simplifiedLedger[A][B] = net;
          simplifiedLedger[B][A] = -net;
        } else if (net < 0) {
          // B owes A
          simplifiedLedger[B][A] = Math.abs(net);
          simplifiedLedger[A][B] = -Math.abs(net);
        } else {
          simplifiedLedger[A][B] = 0;
          simplifiedLedger[B][A] = 0;
        }
      }
    }

    return simplifiedLedger;
  }

  // 2. getIndividualBalanceSummary
  public async getIndividualBalanceSummary(groupId: number, userId: number, asOfDate?: Date) {
    const ledger = await this.computeGroupBalances(groupId, asOfDate);
    const userLedger = ledger[userId] || {};

    let totalOwedToUser = 0;
    let totalUserOwes = 0;

    const breakdown = [];

    const userIds = Object.keys(userLedger).map(id => parseInt(id));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } }
    });
    const userMap = users.reduce((acc, u) => { acc[u.id] = u.name; return acc; }, {} as Record<number, string>);

    for (const [otherIdStr, amountOwedByMe] of Object.entries(userLedger)) {
      const otherUserId = parseInt(otherIdStr);
      if (amountOwedByMe === 0) continue;

      // userLedger[otherUserId] = amount this user owes otherUserId.
      // If positive, this user owes otherUser.
      // If negative, this user is owed BY otherUser.
      // Requested output: positive = otherUser owes this user, negative = this user owes otherUser.
      const displayAmount = -amountOwedByMe;

      if (displayAmount > 0) {
        totalOwedToUser += displayAmount;
      } else {
        totalUserOwes += Math.abs(displayAmount);
      }

      breakdown.push({
        otherUserId,
        otherUserName: userMap[otherUserId] || 'Unknown',
        netAmount: displayAmount
      });
    }

    return {
      userId,
      totalOwedToUser: roundToTwoDecimals(totalOwedToUser),
      totalUserOwes: roundToTwoDecimals(totalUserOwes),
      breakdown
    };
  }

  // 3. getExpenseBreakdownForUser
  public async getExpenseBreakdownForUser(groupId: number, userId: number, counterpartId?: number) {
    const expenses = await prisma.expense.findMany({
      where: {
        group_id: groupId,
        deleted_at: null,
        OR: [
          { paid_by_id: userId },
          { splits: { some: { user_id: userId } } }
        ]
      },
      include: {
        splits: true,
        paid_by: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });

    const breakdown = [];

    for (const exp of expenses) {
      if (!exp.paid_by) continue;

      if (counterpartId) {
        // If counterpartId is specified, only include expenses where the counterpart is involved 
        // AND the user is also involved.
        const involvesCounterpart = exp.paid_by_id === counterpartId || exp.splits.some(s => s.user_id === counterpartId);
        if (!involvesCounterpart) continue;
      }

      const userSplit = exp.splits.find(s => s.user_id === userId);
      const userPaid = exp.paid_by_id === userId;
      
      const role = userPaid ? 'PAID' : 'OWED';
      const shareAmount = userSplit ? userSplit.share_amount.toNumber() : 0;

      breakdown.push({
        expenseId: exp.id,
        description: exp.description,
        date: exp.date,
        totalAmount: exp.amount_inr.toNumber(),
        userShareAmount: shareAmount,
        role: role,
        paidBy: exp.paid_by.name
      });
    }

    return breakdown;
  }

  // 4. getGroupWiseBalances
  public async getGroupWiseBalances(groupId: number) {
    const ledger = await this.computeGroupBalances(groupId);

    // Cross-reference checking
    const expenses = await prisma.expense.findMany({
      where: { group_id: groupId, deleted_at: null },
      include: { splits: true }
    });

    const memberships = await prisma.groupMembership.findMany({
      where: { group_id: groupId }
    });

    for (const exp of expenses) {
      for (const split of exp.splits) {
        // DECISION POINT: Check active membership bounds
        // WHY: Ensure our data integrity hasn't been breached by manual DB inserts or bugs in import.
        // If user wasn't a member, log a warning but DO NOT crash, to preserve uptime.
        const validMembership = memberships.find(m => 
          m.user_id === split.user_id &&
          m.joined_at <= exp.date &&
          (m.left_at === null || m.left_at > exp.date)
        );

        if (!validMembership) {
          // This could trigger for Dev (who is intentionally not a member but is in splits).
          // We can check if the user is Dev and skip, but the prompt says to log a warning if non-member-on-that-date.
          console.warn(`[BUG/WARNING DETECTED] User ${split.user_id} was included in expense ${exp.id} on ${exp.date.toISOString()} but was not an active member of group ${groupId}.`);
        }
      }
    }

    const balances = [];
    const processedPairs = new Set<string>();

    for (const [fromIdStr, targets] of Object.entries(ledger)) {
      const fromId = parseInt(fromIdStr);
      for (const [toIdStr, amount] of Object.entries(targets)) {
        const toId = parseInt(toIdStr);
        if (amount > 0) { // fromId owes toId
          const pairKey = fromId < toId ? `${fromId}-${toId}` : `${toId}-${fromId}`;
          if (!processedPairs.has(pairKey)) {
             processedPairs.add(pairKey);
             balances.push({
               fromUserId: fromId,
               toUserId: toId,
               amount
             });
          }
        }
      }
    }

    return balances;
  }
}
