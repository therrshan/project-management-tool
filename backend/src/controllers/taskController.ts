import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { taskSchema, updateTaskSchema, commentSchema } from '../utils/validation';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { io } from '../server';

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = taskSchema.parse(req.body);
  const { title, description, boardId, columnId, assignedTo, priority, dueDate, position } = validatedData;
  const userId = req.user!.id;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
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
  });

  if (!board) {
    throw createError('Board not found', 404);
  }

  if (board.project.workspace.members.length === 0) {
    throw createError('Access denied - insufficient permissions', 403);
  }

  if (assignedTo) {
    const assignee = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.project.workspaceId,
          userId: assignedTo
        }
      }
    });

    if (!assignee) {
      throw createError('Assigned user is not a member of this workspace', 400);
    }
  }

  const maxPosition = await prisma.task.findFirst({
    where: {
      boardId,
      columnId
    },
    orderBy: {
      position: 'desc'
    }
  });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      boardId,
      columnId,
      assignedTo,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      position: position || (maxPosition ? maxPosition.position + 1 : 0)
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      attachments: true,
      _count: {
        select: {
          comments: true,
          attachments: true
        }
      }
    }
  });

  io.to(`board-${boardId}`).emit('taskCreated', task);

  res.status(201).json({
    message: 'Task created successfully',
    task
  });
};

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  const { boardId } = req.params;
  const userId = req.user!.id;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
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
  });

  if (!board) {
    throw createError('Board not found', 404);
  }

  if (board.project.workspace.members.length === 0) {
    throw createError('Access denied', 403);
  }

  const tasks = await prisma.task.findMany({
    where: { boardId },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      _count: {
        select: {
          comments: true,
          attachments: true
        }
      }
    },
    orderBy: {
      position: 'asc'
    }
  });

  res.json({
    tasks
  });
};

export const getTask = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const task = await prisma.task.findUnique({
    where: { id },
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
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      attachments: {
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
          createdAt: 'asc'
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

  res.json({
    task
  });
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTaskSchema.parse(req.body);
  const userId = req.user!.id;

  const task = await prisma.task.findUnique({
    where: { id },
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
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  if (task.board.project.workspace.members.length === 0) {
    throw createError('Access denied - insufficient permissions', 403);
  }

  if (validatedData.assignedTo) {
    const assignee = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.board.project.workspaceId,
          userId: validatedData.assignedTo
        }
      }
    });

    if (!assignee) {
      throw createError('Assigned user is not a member of this workspace', 400);
    }
  }

  const updateData: any = {};
  if (validatedData.title !== undefined) updateData.title = validatedData.title;
  if (validatedData.description !== undefined) updateData.description = validatedData.description;
  if (validatedData.columnId !== undefined) updateData.columnId = validatedData.columnId;
  if (validatedData.assignedTo !== undefined) updateData.assignedTo = validatedData.assignedTo;
  if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
  if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
  if (validatedData.position !== undefined) updateData.position = validatedData.position;

  const updatedTask = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      _count: {
        select: {
          comments: true,
          attachments: true
        }
      }
    }
  });

  io.to(`board-${task.boardId}`).emit('taskUpdated', updatedTask);

  res.json({
    message: 'Task updated successfully',
    task: updatedTask
  });
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const task = await prisma.task.findUnique({
    where: { id },
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
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  if (task.board.project.workspace.members.length === 0) {
    throw createError('Access denied - insufficient permissions', 403);
  }

  await prisma.task.delete({
    where: { id }
  });

  io.to(`board-${task.boardId}`).emit('taskDeleted', { taskId: id });

  res.json({
    message: 'Task deleted successfully'
  });
};

export const moveTask = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { columnId, position } = req.body;
  const userId = req.user!.id;

  const task = await prisma.task.findUnique({
    where: { id },
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
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  if (task.board.project.workspace.members.length === 0) {
    throw createError('Access denied - insufficient permissions', 403);
  }

  const tasksToUpdate = await prisma.task.findMany({
    where: {
      boardId: task.boardId,
      columnId,
      position: {
        gte: position
      }
    },
    orderBy: {
      position: 'asc'
    }
  });

  await prisma.$transaction(async (tx) => {
    for (const taskToUpdate of tasksToUpdate) {
      await tx.task.update({
        where: { id: taskToUpdate.id },
        data: { position: taskToUpdate.position + 1 }
      });
    }

    await tx.task.update({
      where: { id },
      data: {
        columnId,
        position
      }
    });
  });

  const updatedTask = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      _count: {
        select: {
          comments: true,
          attachments: true
        }
      }
    }
  });

  io.to(`board-${task.boardId}`).emit('taskMoved', updatedTask);

  res.json({
    message: 'Task moved successfully',
    task: updatedTask
  });
};

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = commentSchema.parse(req.body);
  const { content, taskId } = validatedData;
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

  const comment = await prisma.comment.create({
    data: {
      content,
      taskId,
      userId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }
    }
  });

  io.to(`board-${task.boardId}`).emit('commentAdded', comment);

  res.status(201).json({
    message: 'Comment added successfully',
    comment
  });
};

export const getComments = async (req: AuthenticatedRequest, res: Response) => {
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

  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  res.json({
    comments
  });
};

export const updateComment = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user!.id;

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      task: {
        include: {
          board: true
        }
      }
    }
  });

  if (!comment) {
    throw createError('Comment not found', 404);
  }

  if (comment.userId !== userId) {
    throw createError('Access denied - can only edit your own comments', 403);
  }

  const updatedComment = await prisma.comment.update({
    where: { id },
    data: { content },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }
    }
  });

  io.to(`board-${comment.task.boardId}`).emit('commentUpdated', updatedComment);

  res.json({
    message: 'Comment updated successfully',
    comment: updatedComment
  });
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      task: {
        include: {
          board: true
        }
      }
    }
  });

  if (!comment) {
    throw createError('Comment not found', 404);
  }

  if (comment.userId !== userId) {
    throw createError('Access denied - can only delete your own comments', 403);
  }

  await prisma.comment.delete({
    where: { id }
  });

  io.to(`board-${comment.task.boardId}`).emit('commentDeleted', { commentId: id });

  res.json({
    message: 'Comment deleted successfully'
  });
};