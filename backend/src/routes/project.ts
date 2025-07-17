import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  createBoard,
  getBoards,
  updateBoard,
  deleteBoard
} from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);

router.post('/', asyncHandler(createProject));
router.get('/workspace/:workspaceId', asyncHandler(getProjects));
router.get('/:id', asyncHandler(getProject));
router.put('/:id', asyncHandler(updateProject));
router.delete('/:id', asyncHandler(deleteProject));


router.post('/boards', asyncHandler(createBoard));
router.get('/:projectId/boards', asyncHandler(getBoards));
router.put('/boards/:id', asyncHandler(updateBoard));
router.delete('/boards/:id', asyncHandler(deleteBoard));

export { router as projectRoutes };