import { Router } from 'express';
import { createGroup, listGroups, getGroup, addMember, removeMember } from '../controllers/groupController';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.use(requireAuth);

router.post('/', createGroup);
router.get('/', listGroups);
router.get('/:id', getGroup);
router.post('/:id/members', addMember);
router.patch('/:id/members/:userId', removeMember);

export default router;
