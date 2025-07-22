import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const searchUsers = async (req: AuthenticatedRequest, res: Response) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string' || q.length < 2) {
    return res.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          name: {
            contains: q,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: q,
            mode: 'insensitive'
          }
        }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true
    },
    take: 10
  });

  res.json({ users });
};