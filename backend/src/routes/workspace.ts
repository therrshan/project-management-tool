import { Router } from 'express';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteUser,
  removeUser,
  updateUserRole
} from '../controllers/workspaceController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);

router.post('/', asyncHandler(createWorkspace));
router.get('/', asyncHandler(getWorkspaces));
router.get('/:id', asyncHandler(getWorkspace));
router.put('/:id', asyncHandler(updateWorkspace));
router.delete('/:id', asyncHandler(deleteWorkspace));

router.post('/:id/members', asyncHandler(inviteUser));
router.delete('/:id/members/:userId', asyncHandler(removeUser));
router.put('/:id/members', asyncHandler(updateUserRole));

export { router as workspaceRoutes };