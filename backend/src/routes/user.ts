import { Router } from 'express';
import { searchUsers } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);
router.get('/search', asyncHandler(searchUsers));

export { router as userRoutes };