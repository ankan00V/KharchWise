import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/requireAuth';
import { BalanceEngine } from '../services/balanceEngine';

const prisma = new PrismaClient();
const balanceEngine = new BalanceEngine();

// POST /api/groups/:id/settlements
export const createSettlement = async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  const { toUserId, amount, date } = req.body;
  
  if (isNaN(groupId) || !toUserId || !amount) {
    res.status(400).json({ error: 'Missing or invalid parameters' }); return;
  }
  
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const fromUserId = req.user.userId;

  try {
    const settlement = await prisma.settlement.create({
      data: {
        group_id: groupId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount,
        date: date ? new Date(date) : new Date(),
        // source_row_number is null by default, meaning it's a manual settlement
      }
    });

    // Recompute and return updated balance between fromUser and toUser
    const balances = await balanceEngine.getIndividualBalanceSummary(groupId, fromUserId);
    const counterpartBalance = balances.breakdown.find((b: any) => b.otherUserId === toUserId);

    res.status(201).json({
      settlement,
      updatedBalance: counterpartBalance || { otherUserId: toUserId, netAmount: 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/groups/:id/settlements
export const listSettlements = async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  if (isNaN(groupId)) { res.status(400).json({ error: 'Invalid group ID' }); return; }

  try {
    const settlements = await prisma.settlement.findMany({
      where: { group_id: groupId },
      include: {
        from_user: { select: { id: true, name: true } },
        to_user: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });

    const result = settlements.map(s => ({
      ...s,
      source: s.source_row_number === null ? 'manual' : 'import'
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
