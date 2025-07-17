import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

router.use(authenticateToken);

router.post('/task/:taskId', upload.single('file'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.id;
  const file = req.file;

  if (!file) {
    throw createError('No file uploaded', 400);
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      board: {
        include: {
          project: {
            include: {
              workspace: {
                include: {
                  members: {
                    where: { userId }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  if (task.board.project.workspace.members.length === 0) {
    throw createError('Access denied', 403);
  }

  const attachment = await prisma.attachment.create({
    data: {
      filename: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
      taskId,
      uploadedBy: userId
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }
    }
  });

  res.status(201).json({
    message: 'File uploaded successfully',
    attachment
  });
}));

router.post('/avatar', upload.single('avatar'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const file = req.file;

  if (!file) {
    throw createError('No file uploaded', 400);
  }

  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedImageTypes.includes(file.mimetype)) {
    throw createError('Invalid file type. Only images are allowed for avatars.', 400);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      avatar: `/uploads/${file.filename}`
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true
    }
  });

  res.json({
    message: 'Avatar updated successfully',
    user
  });
}));

router.get('/task/:taskId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.id;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      board: {
        include: {
          project: {
            include: {
              workspace: {
                include: {
                  members: {
                    where: { userId }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  if (task.board.project.workspace.members.length === 0) {
    throw createError('Access denied', 403);
  }

  const attachments = await prisma.attachment.findMany({
    where: { taskId },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json({
    attachments
  });
}));

router.delete('/attachment/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      task: {
        include: {
          board: {
            include: {
              project: {
                include: {
                  workspace: {
                    include: {
                      members: {
                        where: {
                          userId,
                          role: {
                            in: ['ADMIN', 'MEMBER']
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!attachment) {
    throw createError('Attachment not found', 404);
  }

  if (attachment.task.board.project.workspace.members.length === 0 && attachment.uploadedBy !== userId) {
    throw createError('Access denied - can only delete your own attachments or be workspace admin/member', 403);
  }

  await prisma.attachment.delete({
    where: { id }
  });

  res.json({
    message: 'Attachment deleted successfully'
  });
}));

export { router as uploadRoutes };