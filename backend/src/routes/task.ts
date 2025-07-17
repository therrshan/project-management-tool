import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  moveTask,
  addComment,
  getComments,
  updateComment,
  deleteComment
} from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);

router.post('/', asyncHandler(createTask));
router.get('/board/:boardId', asyncHandler(getTasks));
router.get('/:id', asyncHandler(getTask));
router.put('/:id', asyncHandler(updateTask));
router.delete('/:id', asyncHandler(deleteTask));
router.put('/:id/move', asyncHandler(moveTask));

router.post('/comments', asyncHandler(addComment));
router.get('/:taskId/comments', asyncHandler(getComments));
router.put('/comments/:id', asyncHandler(updateComment));
router.delete('/comments/:id', asyncHandler(deleteComment));

export { router as taskRoutes };