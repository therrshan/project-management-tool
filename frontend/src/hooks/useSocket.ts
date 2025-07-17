import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      
      if (token && !socketRef.current) {
        socketRef.current = io(SOCKET_URL, {
          auth: {
            token
          }
        });

        socketRef.current.on('connect', () => {
          console.log('Connected to server');
        });

        socketRef.current.on('disconnect', () => {
          console.log('Disconnected from server');
        });

        socketRef.current.on('error', (error) => {
          console.error('Socket error:', error);
        });
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const emit = (event: string, data?: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  };

  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  };

  const joinBoard = (boardId: string) => {
    emit('join-board', boardId);
  };

  const leaveBoard = (boardId: string) => {
    emit('leave-board', boardId);
  };

  const joinWorkspace = (workspaceId: string) => {
    emit('join-workspace', workspaceId);
  };

  const leaveWorkspace = (workspaceId: string) => {
    emit('leave-workspace', workspaceId);
  };

  const startTyping = (taskId: string, boardId: string) => {
    emit('typing-start', { taskId, boardId });
  };

  const stopTyping = (taskId: string, boardId: string) => {
    emit('typing-stop', { taskId, boardId });
  };

  const moveCursor = (boardId: string, position: { x: number; y: number }) => {
    emit('cursor-move', { boardId, position });
  };

  const focusTask = (taskId: string, boardId: string) => {
    emit('task-focus', { taskId, boardId });
  };

  const unfocusTask = (taskId: string, boardId: string) => {
    emit('task-unfocus', { taskId, boardId });
  };

  const getOnlineUsers = (boardId: string) => {
    emit('get-online-users', boardId);
  };

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    joinBoard,
    leaveBoard,
    joinWorkspace,
    leaveWorkspace,
    startTyping,
    stopTyping,
    moveCursor,
    focusTask,
    unfocusTask,
    getOnlineUsers,
    isConnected: socketRef.current?.connected || false
  };
};