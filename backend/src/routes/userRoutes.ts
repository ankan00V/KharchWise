import { Router } from 'express';
import { searchUsers } from '../controllers/userController';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.use(requireAuth);
router.get('/search', searchUsers);

export default router;
