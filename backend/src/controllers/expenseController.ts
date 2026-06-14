import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { calculateSplits, SplitType } from '../utils/splits';

const prisma = new PrismaClient();

export const getGroupExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'Invalid group ID' });
      return;
    }

    const expenses = await prisma.expense.findMany({
      where: { group_id: groupId },
      orderBy: { date: 'desc' },
      include: {
        paid_by: {
          select: { id: true, canonical_name: true, name: true }
        },
        splits: {
          include: {
            user: { select: { id: true, canonical_name: true, name: true } }
          }
        },
        anomalies: true
      }
    });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'Invalid group ID' });
      return;
    }

    const { description, amount, date, paid_by_id, split_type, splits } = req.body;

    if (!description || !amount || !date || !paid_by_id || !split_type || !splits || !Array.isArray(splits)) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Recalculate precise splits on the backend using the split-pro-main algorithm
    const DecimalAmount = new Decimal(amount);
    
    // Map input to SplitInput
    const splitInputs = splits.map((s: any) => ({
      userId: s.user_id,
      shareValue: s.share_value // assuming frontend sends share_value (percentage, exact, units). For EQUAL it can be 1 or 0
    }));

    // If splitType is EQUAL and share_values are missing, default to 1
    if (split_type === SplitType.EQUAL) {
      splitInputs.forEach(si => {
        if (si.shareValue === undefined) si.shareValue = 1;
      });
    }

    const preciseSplits = calculateSplits(DecimalAmount, splitInputs, split_type as SplitType);

    const expense = await prisma.expense.create({
      data: {
        group_id: groupId,
        description,
        amount: DecimalAmount,
        amount_inr: DecimalAmount, // Assume INR for manual creations
        currency: 'INR',
        date: new Date(date),
        paid_by_id,
        split_type,
        splits: {
          create: preciseSplits.map((ps) => ({
            user_id: ps.userId,
            share_amount: ps.amount
          }))
        }
      },
      include: {
        paid_by: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } }
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

