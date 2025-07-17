import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const setupSocketHandlers = (io: Server) => {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.name} connected`);

    socket.on('join-board', async (boardId: string) => {
      try {
        const board = await prisma.board.findUnique({
          where: { id: boardId },
          include: {
            project: {
              include: {
                workspace: {
                  include: {
                    members: {
                      where: {
                        userId: socket.user!.id
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        if (board.project.workspace.members.length === 0) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`board-${boardId}`);
        
        socket.to(`board-${boardId}`).emit('user-joined', {
          user: socket.user,
          boardId
        });

        socket.emit('joined-board', { boardId });
        
        console.log(`User ${socket.user?.name} joined board ${boardId}`);
      } catch (error) {
        console.error('Error joining board:', error);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    socket.on('leave-board', (boardId: string) => {
      socket.leave(`board-${boardId}`);
      
      socket.to(`board-${boardId}`).emit('user-left', {
        user: socket.user,
        boardId
      });

      console.log(`User ${socket.user?.name} left board ${boardId}`);
    });

    socket.on('join-workspace', async (workspaceId: string) => {
      try {
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          include: {
            members: {
              where: {
                userId: socket.user!.id
              }
            }
          }
        });

        if (!workspace) {
          socket.emit('error', { message: 'Workspace not found' });
          return;
        }

        if (workspace.members.length === 0) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`workspace-${workspaceId}`);
        
        socket.to(`workspace-${workspaceId}`).emit('user-joined-workspace', {
          user: socket.user,
          workspaceId
        });

        socket.emit('joined-workspace', { workspaceId });
        
        console.log(`User ${socket.user?.name} joined workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error joining workspace:', error);
        socket.emit('error', { message: 'Failed to join workspace' });
      }
    });

    socket.on('leave-workspace', (workspaceId: string) => {
      socket.leave(`workspace-${workspaceId}`);
      
      socket.to(`workspace-${workspaceId}`).emit('user-left-workspace', {
        user: socket.user,
        workspaceId
      });

      console.log(`User ${socket.user?.name} left workspace ${workspaceId}`);
    });

    socket.on('typing-start', ({ taskId, boardId }) => {
      socket.to(`board-${boardId}`).emit('user-typing', {
        user: socket.user,
        taskId,
        typing: true
      });
    });

    socket.on('typing-stop', ({ taskId, boardId }) => {
      socket.to(`board-${boardId}`).emit('user-typing', {
        user: socket.user,
        taskId,
        typing: false
      });
    });

    socket.on('cursor-move', ({ boardId, position }) => {
      socket.to(`board-${boardId}`).emit('cursor-update', {
        user: socket.user,
        position
      });
    });

    socket.on('task-focus', ({ taskId, boardId }) => {
      socket.to(`board-${boardId}`).emit('task-focused', {
        user: socket.user,
        taskId
      });
    });

    socket.on('task-unfocus', ({ taskId, boardId }) => {
      socket.to(`board-${boardId}`).emit('task-unfocused', {
        user: socket.user,
        taskId
      });
    });

    socket.on('get-online-users', (boardId: string) => {
      const room = io.sockets.adapter.rooms.get(`board-${boardId}`);
      const onlineUsers: any[] = [];
      
      if (room) {
        room.forEach((socketId) => {
          const clientSocket = io.sockets.sockets.get(socketId) as AuthenticatedSocket;
          if (clientSocket && clientSocket.user) {
            onlineUsers.push(clientSocket.user);
          }
        });
      }
      
      socket.emit('online-users', { boardId, users: onlineUsers });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.name} disconnected`);
      
      socket.rooms.forEach((room) => {
        if (room.startsWith('board-')) {
          socket.to(room).emit('user-left', {
            user: socket.user,
            boardId: room.replace('board-', '')
          });
        } else if (room.startsWith('workspace-')) {
          socket.to(room).emit('user-left-workspace', {
            user: socket.user,
            workspaceId: room.replace('workspace-', '')
          });
        }
      });
    });
  });
};