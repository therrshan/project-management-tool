import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { projectSchema, boardSchema } from '../utils/validation';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = projectSchema.parse(req.body);
  const { name, description, workspaceId } = validatedData;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
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
  });

  if (!workspace) {
    throw createError('Workspace not found', 404);
  }

  if (workspace.members.length === 0) {
    throw createError('Access denied - insufficient permissions', 403);
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      workspaceId,
      createdBy: userId,
      boards: {
        create: {
          name: 'Main Board'
        }
      }
    },
    include: {
      boards: {
        include: {
          _count: {
            select: {
              tasks: true
            }
          }
        }
      },
      creator: {
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
    message: 'Project created successfully',
    project
  });
};

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId }
      }
    }
  });

  if (!workspace) {
    throw createError('Workspace not found', 404);
  }

  if (workspace.members.length === 0) {
    throw createError('Access denied', 403);
  }

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    include: {
      boards: {
        include: {
          _count: {
            select: {
              tasks: true
            }
          }
        }
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      _count: {
        select: {
          boards: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json({
    projects
  });
};

export const getProject = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId }
          }
        }
      },
      boards: {
        include: {
          tasks: {
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
          }
        }
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }
    }
  });

  if (!project) {
    throw createError('Project not found', 404);
  }

  if (project.workspace.members.length === 0) {
    throw createError('Access denied', 403);
  }

  const userRole = project.workspace.members[0].role;

  res.json({
    project,
    userRole
  });
};

export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user!.id;

  const project = await prisma.project.findUnique({
    where: { id },
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
  });

  if (!project) {
    throw createError('Project not found', 404);
  }

  if (project.workspace.members.length === 0) {
    throw createError('Access denied - insufficient permissions', 403);
  }

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      name,
      description
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }
    }
  });

  res.json({
    message: 'Project updated successfully',
    project: updatedProject
  });
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      workspace: {
        include: {
          members: {
            where: {
              userId,
              role: 'ADMIN'
            }
          }
        }
      }
    }
  });

  if (!project) {
    throw createError('Project not found', 404);
  }

  if (project.workspace.members.length === 0 && project.createdBy !== userId) {
    throw createError('Access denied - only admins or project creator can delete', 403);
  }

  await prisma.project.delete({
    where: { id }
  });

  res.json({
    message: 'Project deleted successfully'
  });
};

export const createBoard = async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = boardSchema.parse(req.body);
  const { name, projectId } = validatedData;
  const userId = req.user!.id;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
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
  });

  if (!project) {
    throw createError('Project not found', 404);
  }

  if (project.workspace.members.length === 0) {
    throw createError('Access denied - insufficient permissions', 403);
  }

  const board = await prisma.board.create({
    data: {
      name,
      projectId
    },
    include: {
      _count: {
        select: {
          tasks: true
        }
      }
    }
  });

  res.status(201).json({
    message: 'Board created successfully',
    board
  });
};

export const getBoards = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.params;
  const userId = req.user!.id;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId }
          }
        }
      }
    }
  });

  if (!project) {
    throw createError('Project not found', 404);
  }

  if (project.workspace.members.length === 0) {
    throw createError('Access denied', 403);
  }

  const boards = await prisma.board.findMany({
    where: { projectId },
    include: {
      _count: {
        select: {
          tasks: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  res.json({
    boards
  });
};

export const updateBoard = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, columns } = req.body;
  const userId = req.user!.id;

  const board = await prisma.board.findUnique({
    where: { id },
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

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (columns !== undefined) updateData.columns = columns;

  const updatedBoard = await prisma.board.update({
    where: { id },
    data: updateData
  });

  res.json({
    message: 'Board updated successfully',
    board: updatedBoard
  });
};

export const deleteBoard = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const board = await prisma.board.findUnique({
    where: { id },
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

  await prisma.board.delete({
    where: { id }
  });

  res.json({
    message: 'Board deleted successfully'
  });
};