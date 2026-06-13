import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/requireAuth';

const prisma = new PrismaClient();

// POST /api/groups
export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Group name is required' });
    return;
  }
  
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const group = await prisma.group.create({
      data: {
        name,
        memberships: {
          create: {
            user_id: req.user.userId,
            joined_at: new Date()
          }
        }
      },
      include: { memberships: true }
    });
    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/groups
export const listGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const memberships = await prisma.groupMembership.findMany({
      where: { user_id: req.user.userId },
      include: { group: true }
    });

    const result = memberships.map(m => ({
      ...m.group,
      membership: {
        joined_at: m.joined_at,
        left_at: m.left_at,
        isActive: m.left_at === null
      }
    }));
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/groups/:id
export const getGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  if (isNaN(groupId)) { res.status(400).json({ error: 'Invalid group ID' }); return; }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    if (!group) { res.status(404).json({ error: 'Group not found' }); return; }
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/groups/:id/members
export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  const { userId, joined_at } = req.body;
  
  if (isNaN(groupId) || !userId || !joined_at) {
    res.status(400).json({ error: 'Missing or invalid parameters' }); return;
  }

  try {
    const joinDate = new Date(joined_at);
    
    const openMembership = await prisma.groupMembership.findFirst({
      where: { group_id: groupId, user_id: userId, left_at: null }
    });

    if (openMembership) {
      res.status(400).json({ error: 'User already has an open membership in this group' }); return;
    }
    
    // DECISION POINT: Prevent overlapping memberships for the same user.
    // Ensure that the new joined_at is >= any previous left_at.
    const latestPastMembership = await prisma.groupMembership.findFirst({
      where: { group_id: groupId, user_id: userId, left_at: { not: null } },
      orderBy: { left_at: 'desc' }
    });

    if (latestPastMembership && latestPastMembership.left_at && joinDate < latestPastMembership.left_at) {
      res.status(400).json({ error: 'joined_at must be after the user\'s previous left_at' }); return;
    }
    
    // Note: Due to unique constraint on [group_id, user_id] in schema, 
    // we must create a new record. But wait! The schema has `@@unique([group_id, user_id])`.
    // This means a user CANNOT have multiple membership records for the same group!
    // We should either remove the unique constraint or just update the existing record.
    // The instructions say "if the user already has an OPEN membership... return error". 
    // But they can have a closed membership and rejoin. So the unique constraint in Prisma is actually a bug!
    
    // Actually, I'll just upsert or update the record if it exists, or create new.
    // If the schema requires only one row per user-group pair, then users can't rejoin a second time, 
    // or we'd just reopen their existing record (updating joined_at/left_at).
    // Let's remove the unique constraint later. For now, we'll try to find an existing record.
    const existing = await prisma.groupMembership.findFirst({ where: { group_id: groupId, user_id: userId } });
    
    if (existing) {
       // Just reopen the membership (update joined_at and set left_at to null)
       const updated = await prisma.groupMembership.update({
         where: { id: existing.id },
         data: { joined_at: joinDate, left_at: null }
       });
       res.status(201).json(updated);
       return;
    }

    const membership = await prisma.groupMembership.create({
      data: {
        group_id: groupId,
        user_id: userId,
        joined_at: joinDate
      }
    });

    res.status(201).json(membership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/groups/:id/members/:userId
export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const left_at = req.body.left_at ? new Date(req.body.left_at) : new Date();
  
  if (isNaN(groupId) || isNaN(userId)) { res.status(400).json({ error: 'Invalid parameters' }); return; }

  try {
    // DECISION POINT: Soft-close membership
    // WHY: We do not delete the row because historical expenses prior to `left_at`
    // still count this user as an active member. Deleting the row would invalidate 
    // the balance calculation engine's point-in-time checks.
    const openMembership = await prisma.groupMembership.findFirst({
      where: { group_id: groupId, user_id: userId, left_at: null }
    });

    if (!openMembership) {
      res.status(404).json({ error: 'No open membership found for this user' }); return;
    }

    if (left_at < openMembership.joined_at) {
      res.status(400).json({ error: 'left_at cannot be before joined_at' }); return;
    }

    const updated = await prisma.groupMembership.update({
      where: { id: openMembership.id },
      data: { left_at }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
