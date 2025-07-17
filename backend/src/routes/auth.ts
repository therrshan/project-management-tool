import { Router } from 'express';
import { register, login, refreshToken, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refreshToken));
router.get('/profile', authenticateToken, asyncHandler(getProfile));

export { router as authRoutes };