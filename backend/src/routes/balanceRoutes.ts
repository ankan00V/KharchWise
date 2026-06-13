import { Router } from 'express';
import { getGroupBalances, getMyBalanceSummary, getMyExpenseBreakdown } from '../controllers/balanceController';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', getGroupBalances);
router.get('/me', getMyBalanceSummary);
router.get('/me/breakdown', getMyExpenseBreakdown);

export default router;
