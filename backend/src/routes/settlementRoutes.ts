import { Router } from 'express';
import { createSettlement, listSettlements } from '../controllers/settlementController';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/', createSettlement);
router.get('/', listSettlements);

export default router;
