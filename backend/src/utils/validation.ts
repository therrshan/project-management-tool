import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const workspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional()
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  workspaceId: z.string().cuid('Invalid workspace ID')
});

export const boardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(100, 'Name too long'),
  projectId: z.string().cuid('Invalid project ID')
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  boardId: z.string().cuid('Invalid board ID'),
  columnId: z.string().min(1, 'Column ID is required'),
  assignedTo: z.string().cuid('Invalid user ID').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  position: z.number().int().min(0).default(0)
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  columnId: z.string().min(1, 'Column ID is required').optional(),
  assignedTo: z.string().cuid('Invalid user ID').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional(),
  position: z.number().int().min(0).optional()
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
  taskId: z.string().cuid('Invalid task ID')
});

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')
});

export const updateUserRoleSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'])
});

export const boardColumnsSchema = z.object({
  columns: z.array(z.object({
    id: z.string().min(1, 'Column ID is required'),
    title: z.string().min(1, 'Column title is required'),
    position: z.number().int().min(0).optional()
  })).min(1, 'At least one column is required')
});

export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default(10),
  search: z.string().optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type BoardInput = z.infer<typeof boardSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type BoardColumnsInput = z.infer<typeof boardColumnsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;