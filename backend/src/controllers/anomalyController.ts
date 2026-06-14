import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/requireAuth';

const prisma = new PrismaClient();

export const getGroupAnomalies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'Invalid group ID' });
      return;
    }

    const anomalies = await prisma.importAnomaly.findMany({
      where: {
        // Find anomalies linked to expenses in this group
        linked_expense: { group_id: groupId }
      },
      include: {
        linked_expense: true,
        linked_duplicate_expense: true,
        resolved_by: { select: { name: true } }
      },
      orderBy: { csv_row_number: 'asc' }
    });

    res.json(anomalies);
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
};

export const resolveAnomaly = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const groupId = parseInt(req.params.id as string);
    const anomalyId = parseInt(req.params.anomalyId as string);
    if (isNaN(groupId) || isNaN(anomalyId)) {
      res.status(400).json({ error: 'Invalid group or anomaly ID' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { action, paid_by_id } = req.body;
    if (!action) {
      res.status(400).json({ error: 'Missing action' });
      return;
    }

    const anomaly = await prisma.importAnomaly.findUnique({
      where: { id: anomalyId },
      include: { linked_expense: true }
    });

    if (!anomaly) {
      res.status(404).json({ error: 'Anomaly not found' });
      return;
    }

    if (anomaly.status === 'AUTO_RESOLVED' || anomaly.resolved_at) {
      res.status(400).json({ error: 'Anomaly already resolved' });
      return;
    }

    if (action === 'ASSIGN_PAYER') {
      if (!paid_by_id) {
        res.status(400).json({ error: 'paid_by_id is required to assign payer' });
        return;
      }
      if (!anomaly.linked_expense_id) {
        res.status(400).json({ error: 'No linked expense to assign payer to' });
        return;
      }

      await prisma.$transaction([
        prisma.expense.update({
          where: { id: anomaly.linked_expense_id },
          data: { paid_by_id: parseInt(paid_by_id) }
        }),
        prisma.importAnomaly.update({
          where: { id: anomalyId },
          data: {
            status: 'AUTO_RESOLVED',
            action_taken: 'Manually assigned payer',
            resolved_by_id: req.user.userId,
            resolved_at: new Date()
          }
        })
      ]);
    } else if (action === 'CONFIRM_DUPLICATE') {
      // Ensure the linked_duplicate_expense is soft deleted (should already be, but confirm)
      if (anomaly.linked_duplicate_expense_id) {
        await prisma.$transaction([
          prisma.expense.update({
            where: { id: anomaly.linked_duplicate_expense_id },
            data: { deleted_at: new Date() } // Keep it quarantined
          }),
          prisma.importAnomaly.update({
            where: { id: anomalyId },
            data: {
              status: 'AUTO_RESOLVED',
              action_taken: 'Confirmed as duplicate (kept soft-deleted)',
              resolved_by_id: req.user.userId,
              resolved_at: new Date()
            }
          })
        ]);
      }
    } else if (action === 'KEEP_BOTH') {
      // The duplicate is not actually a duplicate, so un-soft-delete it to enter ledger
      if (anomaly.linked_duplicate_expense_id) {
        await prisma.$transaction([
          prisma.expense.update({
            where: { id: anomaly.linked_duplicate_expense_id },
            data: { deleted_at: null } // Lift quarantine
          }),
          prisma.importAnomaly.update({
            where: { id: anomalyId },
            data: {
              status: 'AUTO_RESOLVED',
              action_taken: 'Confirmed not a duplicate (lifted quarantine)',
              resolved_by_id: req.user.userId,
              resolved_at: new Date()
            }
          })
        ]);
      }
    } else {
      res.status(400).json({ error: 'Invalid action' });
      return;
    }

    res.json({ message: 'Anomaly resolved successfully' });
  } catch (error) {
    console.error('Error resolving anomaly:', error);
    res.status(500).json({ error: 'Failed to resolve anomaly' });
  }
};
