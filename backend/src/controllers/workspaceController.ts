import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { workspaceSchema, inviteUserSchema, updateUserRoleSchema } from '../utils/validation';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export const createWorkspace = async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = workspaceSchema.parse(req.body);
  const { name, description } = validatedData;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      description,
      createdBy: userId,
      members: {
        create: {
          userId,
          role: 'ADMIN'
        }
      }
    },
    include: {
      members: {
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
      },
      _count: {
        select: {
          projects: true
        }
      }
    }
  });

  res.status(201).json({
    message: 'Workspace created successfully',
    workspace
  });
};

export const getWorkspaces = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      members: {
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
      },
      _count: {
        select: {
          projects: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json({
    workspaces
  });
};

export const getWorkspace = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: {
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
      },
      projects: {
        include: {
          _count: {
            select: {
              boards: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!workspace) {
    throw createError('Workspace not found', 404);
  }

  const userMembership = workspace.members.find(member => member.userId === userId);
  if (!userMembership) {
    throw createError('Access denied', 403);
  }

  res.json({
    workspace,
    userRole: userMembership.role
  });
};

export const updateWorkspace = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validatedData = workspaceSchema.parse(req.body);
  const { name, description } = validatedData;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: {
        where: {
          userId,
          role: 'ADMIN'
        }
      }
    }
  });

  if (!workspace) {
    throw createError('Workspace not found', 404);
  }

  if (workspace.members.length === 0) {
    throw createError('Only workspace admins can update workspace', 403);
  }

  const updatedWorkspace = await prisma.workspace.update({
    where: { id },
    data: {
      name,
      description
    },
    include: {
      members: {
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
      }
    }
  });

  res.json({
    message: 'Workspace updated successfully',
    workspace: updatedWorkspace
  });
};

export const deleteWorkspace = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: {
      createdBy: true
    }
  });

  if (!workspace) {
    throw createError('Workspace not found', 404);
  }

  if (workspace.createdBy !== userId) {
    throw createError('Only workspace creator can delete workspace', 403);
  }

  await prisma.workspace.delete({
    where: { id }
  });

  res.json({
    message: 'Workspace deleted successfully'
  });
};

export const inviteUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validatedData = inviteUserSchema.parse(req.body);
  const { email, role } = validatedData;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: {
        where: {
          userId,
          role: 'ADMIN'
        }
      }
    }
  });

  if (!workspace) {
    throw createError('Workspace not found', 404);
  }

  if (workspace.members.length === 0) {
    throw createError('Only workspace admins can invite users', 403);
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email }
  });

  if (!invitedUser) {
    throw createError('User not found', 404);
  }

  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: id,
        userId: invitedUser.id
      }
    }
  });

  if (existingMember) {
    throw createError('User is already a member of this workspace', 409);
  }

  const member = await prisma.workspaceMember.create({
    data: {
      workspaceId: id,
      userId: invitedUser.id,
      role
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

  res.status(201).json({
    message: 'User invited successfully',
    member
  });
};

export const removeUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id, userId: targetUserId } = req.params;
  const currentUserId = req.user!.id;

  console.log('Remove user request:');
  console.log('- Workspace ID:', id);
  console.log('- Target User ID:', targetUserId);
  console.log('- Current User ID:', currentUserId);

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: {
        where: {
          userId: currentUserId,
          role: 'ADMIN'
        }
      }
    }
  });

  if (!workspace) {
    throw createError('Workspace not found', 404);
  }

  if (workspace.members.length === 0) {
    throw createError('Only workspace admins can remove users', 403);
  }

  if (workspace.createdBy === targetUserId) {
    throw createError('Cannot remove workspace creator', 400);
  }

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: id,
        userId: targetUserId
      }
    }
  });

  console.log('Member found:', member ? 'Yes' : 'No');
  if (member) {
    console.log('Member details:', JSON.stringify(member, null, 2));
  }

  // Let's also check all members in this workspace
  const allMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: id },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  console.log('All workspace members:', JSON.stringify(allMembers, null, 2));

  if (!member) {
    throw createError('User is not a member of this workspace', 404);
  }

  await prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: {
        workspaceId: id,
        userId: targetUserId
      }
    }
  });

  res.json({
    message: 'User removed successfully'
  });
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validatedData = updateUserRoleSchema.parse(req.body);
  const { userId: targetUserId, role } = validatedData;
  const currentUserId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: {
        where: {
          userId: currentUserId,
          role: 'ADMIN'
        }
      }
    }
  });

  if (!workspace) {
    throw createError('Workspace not found', 404);
  }

  if (workspace.members.length === 0) {
    throw createError('Only workspace admins can update user roles', 403);
  }

  if (workspace.createdBy === targetUserId && role !== 'ADMIN') {
    throw createError('Cannot change workspace creator role', 400);
  }

  const updatedMember = await prisma.workspaceMember.update({
    where: {
      workspaceId_userId: {
        workspaceId: id,
        userId: targetUserId
      }
    },
    data: { role },
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

  res.json({
    message: 'User role updated successfully',
    member: updatedMember
  });
};