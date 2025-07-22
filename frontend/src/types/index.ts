export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  members: WorkspaceMember[];
  projects?: Project[];
  _count: {
    projects: number;
  };
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;  // Add this line
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  boards: Board[];
  creator: User;
  _count?: {
    boards: number;
  };
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  columns: BoardColumn[];
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  _count?: {
    tasks: number;
  };
}

export interface BoardColumn {
  id: string;
  title: string;
  position?: number;
}

export interface CreateBoardColumn {
  title: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  boardId: string;
  columnId: string;
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  comments?: Comment[];
  attachments?: Attachment[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  taskId: string;
  uploadedBy: string;
  createdAt: string;
  uploader: User;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  workspaceId: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  boardId: string;
  columnId: string;
  assignedTo?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  position?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  columnId?: string;
  assignedTo?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  position?: number;
}

export interface MoveTaskData {
  columnId: string;
  position: number;
}

export interface CreateCommentData {
  content: string;
  taskId: string;
}

export interface InviteUserData {
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface SocketEvents {
  taskCreated: (task: Task) => void;
  taskUpdated: (task: Task) => void;
  taskDeleted: (data: { taskId: string }) => void;
  taskMoved: (task: Task) => void;
  commentAdded: (comment: Comment) => void;
  commentUpdated: (comment: Comment) => void;
  commentDeleted: (data: { commentId: string }) => void;
  userJoined: (data: { user: User; boardId: string }) => void;
  userLeft: (data: { user: User; boardId: string }) => void;
  userTyping: (data: { user: User; taskId: string; typing: boolean }) => void;
  cursorUpdate: (data: { user: User; position: { x: number; y: number } }) => void;
  onlineUsers: (data: { boardId: string; users: User[] }) => void;
  error: (data: { message: string }) => void;
}