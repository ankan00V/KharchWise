import { Router } from 'express';
import { resolveAnomaly, getGroupAnomalies } from '../controllers/anomalyController';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', getGroupAnomalies);
router.post('/:anomalyId/resolve', resolveAnomaly);

export default router;
