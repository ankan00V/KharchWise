import { Router } from 'express';
import { getGroupExpenses, createExpense } from '../controllers/expenseController';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', getGroupExpenses);
router.post('/', createExpense);

export default router;
