import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type { 
  AuthResponse, 
  LoginData, 
  RegisterData, 
  Workspace, 
  Project, 
  Task, 
  Comment,
  CreateWorkspaceData,
  CreateProjectData,
  CreateTaskData,
  UpdateTaskData,
  MoveTaskData,
  CreateCommentData,
  InviteUserData,
  Attachment
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                refreshToken,
              });

              const { accessToken, refreshToken: newRefreshToken } = response.data;
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', data);
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await this.api.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async getWorkspaces(): Promise<{ workspaces: Workspace[] }> {
    const response = await this.api.get('/workspaces');
    return response.data;
  }

  async getWorkspace(id: string): Promise<{ workspace: Workspace; userRole: string }> {
    const response = await this.api.get(`/workspaces/${id}`);
    return response.data;
  }

  async createWorkspace(data: CreateWorkspaceData): Promise<{ workspace: Workspace }> {
    const response = await this.api.post('/workspaces', data);
    return response.data;
  }

  async updateWorkspace(id: string, data: CreateWorkspaceData): Promise<{ workspace: Workspace }> {
    const response = await this.api.put(`/workspaces/${id}`, data);
    return response.data;
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.api.delete(`/workspaces/${id}`);
  }

  async inviteUser(workspaceId: string, data: InviteUserData) {
    const response = await this.api.post(`/workspaces/${workspaceId}/members`, data);
    return response.data;
  }

  async removeUser(workspaceId: string, userId: string): Promise<void> {
    await this.api.delete(`/workspaces/${workspaceId}/members/${userId}`);
  }

  async updateUserRole(workspaceId: string, data: { userId: string; role: string }) {
    const response = await this.api.put(`/workspaces/${workspaceId}/members`, data);
    return response.data;
  }

  async getProjects(workspaceId: string): Promise<{ projects: Project[] }> {
    const response = await this.api.get(`/projects/workspace/${workspaceId}`);
    return response.data;
  }

  async getProject(id: string): Promise<{ project: Project; userRole: string }> {
    const response = await this.api.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: CreateProjectData): Promise<{ project: Project }> {
    const response = await this.api.post('/projects', data);
    return response.data;
  }


  async updateProject(id: string, data: { name: string; description?: string }): Promise<{ project: Project }> {
    const response = await this.api.put(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.api.delete(`/projects/${id}`);
  }

  async createBoard(data: { name: string; projectId: string }) {
    const response = await this.api.post('/projects/boards', data);
    return response.data;
  }

  async createBoardColumn(data: { name: string;}) {
    const response = await this.api.post('/projects/boardcolumns', data);
    return response.data;
  }

  async getBoards(projectId: string) {
    const response = await this.api.get(`/projects/${projectId}/boards`);
    return response.data;
  }

  async updateBoard(id: string, data: { name: string }) {
    const response = await this.api.put(`/projects/boards/${id}`, data);
    return response.data;
  }

  async deleteBoard(id: string): Promise<void> {
    await this.api.delete(`/projects/boards/${id}`);
  }

  async getTasks(boardId: string): Promise<{ tasks: Task[] }> {
    const response = await this.api.get(`/tasks/board/${boardId}`);
    return response.data;
  }

  async getTask(id: string): Promise<{ task: Task }> {
    const response = await this.api.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(data: CreateTaskData): Promise<{ task: Task }> {
    const response = await this.api.post('/tasks', data);
    return response.data;
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<{ task: Task }> {
    const response = await this.api.put(`/tasks/${id}`, data);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.api.delete(`/tasks/${id}`);
  }

  async moveTask(id: string, data: MoveTaskData): Promise<{ task: Task }> {
    const response = await this.api.put(`/tasks/${id}/move`, data);
    return response.data;
  }

  async getComments(taskId: string): Promise<{ comments: Comment[] }> {
    const response = await this.api.get(`/tasks/${taskId}/comments`);
    return response.data;
  }

  async addComment(data: CreateCommentData): Promise<{ comment: Comment }> {
    const response = await this.api.post('/tasks/comments', data);
    return response.data;
  }

  async updateComment(id: string, data: { content: string }): Promise<{ comment: Comment }> {
    const response = await this.api.put(`/tasks/comments/${id}`, data);
    return response.data;
  }

  async deleteComment(id: string): Promise<void> {
    await this.api.delete(`/tasks/comments/${id}`);
  }

  async uploadTaskAttachment(taskId: string, file: File): Promise<{ attachment: Attachment }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.api.post(`/upload/task/${taskId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadAvatar(file: File): Promise<{ user: any }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await this.api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getTaskAttachments(taskId: string): Promise<{ attachments: Attachment[] }> {
    const response = await this.api.get(`/upload/task/${taskId}`);
    return response.data;
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.api.delete(`/upload/attachment/${id}`);
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}

export const apiService = new ApiService();
export default apiService;