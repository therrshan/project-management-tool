import { create } from 'zustand';
import apiService from '../utils/api';
import type { Workspace, CreateWorkspaceData, InviteUserData } from '../types';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  userRole: string | null;
  isLoading: boolean;
  error: string | null;
  
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (data: CreateWorkspaceData) => Promise<Workspace>;
  updateWorkspace: (id: string, data: CreateWorkspaceData) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  inviteUser: (workspaceId: string, data: InviteUserData) => Promise<void>;
  removeUser: (workspaceId: string, userId: string) => Promise<void>;
  updateUserRole: (workspaceId: string, userId: string, role: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  userRole: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getWorkspaces();
      set({
        workspaces: response.workspaces,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch workspaces';
      set({
        workspaces: [],
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  fetchWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getWorkspace(id);
      set({
        currentWorkspace: response.workspace,
        userRole: response.userRole,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch workspace';
      set({
        currentWorkspace: null,
        userRole: null,
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  createWorkspace: async (data: CreateWorkspaceData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.createWorkspace(data);
      const newWorkspace = response.workspace;
      
      set((state) => ({
        workspaces: [...state.workspaces, newWorkspace],
        isLoading: false,
        error: null
      }));
      
      return newWorkspace;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create workspace';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  updateWorkspace: async (id: string, data: CreateWorkspaceData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.updateWorkspace(id, data);
      const updatedWorkspace = response.workspace;
      
      set((state) => ({
        workspaces: state.workspaces.map(w => 
          w.id === id ? updatedWorkspace : w
        ),
        currentWorkspace: state.currentWorkspace?.id === id 
          ? updatedWorkspace 
          : state.currentWorkspace,
        isLoading: false,
        error: null
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update workspace';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  deleteWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.deleteWorkspace(id);
      
      set((state) => ({
        workspaces: state.workspaces.filter(w => w.id !== id),
        currentWorkspace: state.currentWorkspace?.id === id 
          ? null 
          : state.currentWorkspace,
        isLoading: false,
        error: null
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete workspace';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  inviteUser: async (workspaceId: string, data: InviteUserData) => {
    set({ isLoading: true, error: null });
    try {
      const { member } = await apiService.inviteUser(workspaceId, data);
      
      set((state) => {
        const updatedWorkspaces = state.workspaces.map(w => 
          w.id === workspaceId 
            ? { ...w, members: [...w.members, member] }
            : w
        );
        
        return {
          workspaces: updatedWorkspaces,
          currentWorkspace: state.currentWorkspace?.id === workspaceId
            ? { ...state.currentWorkspace, members: [...state.currentWorkspace.members, member] }
            : state.currentWorkspace,
          isLoading: false,
          error: null
        };
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to invite user';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  removeUser: async (workspaceId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.removeUser(workspaceId, userId);
      
      set((state) => {
        const updatedWorkspaces = state.workspaces.map(w => 
          w.id === workspaceId 
            ? { ...w, members: w.members.filter(m => m.user.id !== userId) }
            : w
        );
        
        return {
          workspaces: updatedWorkspaces,
          currentWorkspace: state.currentWorkspace?.id === workspaceId
            ? { ...state.currentWorkspace, members: state.currentWorkspace.members.filter(m => m.user.id !== userId) }
            : state.currentWorkspace,
          isLoading: false,
          error: null
        };
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to remove user';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  updateUserRole: async (workspaceId: string, userId: string, role: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.updateUserRole(workspaceId, { userId, role });
      
      set((state) => {
        const updatedWorkspaces = state.workspaces.map(w => 
          w.id === workspaceId 
            ? { 
                ...w, 
                members: w.members.map(m => 
                  m.user.id === userId 
                    ? { ...m, role: role as any }
                    : m
                )
              }
            : w
        );
        
        return {
          workspaces: updatedWorkspaces,
          currentWorkspace: state.currentWorkspace?.id === workspaceId
            ? { 
                ...state.currentWorkspace, 
                members: state.currentWorkspace.members.map(m => 
                  m.user.id === userId 
                    ? { ...m, role: role as any }
                    : m
                )
              }
            : state.currentWorkspace,
          isLoading: false,
          error: null
        };
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update user role';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  setCurrentWorkspace: (workspace: Workspace | null) => {
    set({ currentWorkspace: workspace });
  },

  clearError: () => {
    set({ error: null });
  }
}));