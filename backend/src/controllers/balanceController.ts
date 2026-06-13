import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/requireAuth';
import { BalanceEngine } from '../services/balanceEngine';

const balanceEngine = new BalanceEngine();

// GET /api/groups/:id/balances
export const getGroupBalances = async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  if (isNaN(groupId)) { res.status(400).json({ error: 'Invalid group ID' }); return; }

  try {
    const balances = await balanceEngine.getGroupWiseBalances(groupId);
    res.json({ balances });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/groups/:id/balances/me
export const getMyBalanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  if (isNaN(groupId)) { res.status(400).json({ error: 'Invalid group ID' }); return; }
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const summary = await balanceEngine.getIndividualBalanceSummary(groupId, req.user.userId);
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/groups/:id/balances/me/breakdown
export const getMyExpenseBreakdown = async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  const withUserId = req.query.with ? parseInt(req.query.with as string) : undefined;
  
  if (isNaN(groupId)) { res.status(400).json({ error: 'Invalid group ID' }); return; }
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const breakdown = await balanceEngine.getExpenseBreakdownForUser(groupId, req.user.userId, withUserId);
    res.json({ breakdown });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
