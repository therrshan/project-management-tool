import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { KanbanBoard } from '../components/board/KanbanBoard';
import { CreateTaskModal } from '../components/task/CreateTaskModal';
import { CreateBoardModal } from '../components/board/CreateBoardModal';
import { useSocket } from '../hooks/useSocket';
import apiService from '../utils/api';
import type { Project, Task } from '../types';
import { Plus } from 'lucide-react';

export const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('todo');
  
  const { user } = useAuthStore();
  const { joinBoard, leaveBoard, on, off } = useSocket();


  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    if (project?.boards?.[0]) {
      const boardId = project.boards[0].id;
      
      // Join board once
      joinBoard(boardId);
      loadTasks(boardId);

      // Cleanup function
      return () => {
        leaveBoard(boardId);
      };
    }
  }, [project?.boards?.[0]?.id]); // Only depend on boardId

  useEffect(() => {
    if (project?.boards?.[0]) {
      // Listen for real-time task updates
      const handleTaskCreated = (task: Task) => {
        setTasks(prev => [...prev, task]);
      };

      const handleTaskUpdated = (task: Task) => {
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      };

      const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      };

      const handleTaskMoved = (task: Task) => {
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      };

      on('taskCreated', handleTaskCreated);
      on('taskUpdated', handleTaskUpdated);
      on('taskDeleted', handleTaskDeleted);
      on('taskMoved', handleTaskMoved);

      return () => {
        off('taskCreated', handleTaskCreated);
        off('taskUpdated', handleTaskUpdated);
        off('taskDeleted', handleTaskDeleted);
        off('taskMoved', handleTaskMoved);
      };
    }
  }, [project?.boards?.[0]?.id, on, off]);

  const loadProject = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.getProject(projectId);
      setProject(response.project);
      setUserRole(response.userRole);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async (boardId: string) => {
    try {
      const response = await apiService.getTasks(boardId);
      setTasks(response.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleCreateTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowCreateTaskModal(true);
  };


  const handleBoardEdited = (newBoard: any) => {
    if (project) {
      const updatedProject = {
        ...project,
        boards: [newBoard]
      };
      setProject(updatedProject);
    }
  };

  const handleTaskMoved = async (taskId: string, newColumnId: string, newPosition: number) => {
    try {
      await apiService.moveTask(taskId, { columnId: newColumnId, position: newPosition });
      // Task will be updated via socket event
    } catch (error) {
      console.error('Failed to move task:', error);
      // Reload tasks on error
      if (project?.boards?.[0]) {
        loadTasks(project.boards[0].id);
      }
    }
  };

  const canManageTasks = userRole === 'ADMIN' || userRole === 'MEMBER';

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const board = project.boards?.[0];
  const columns = board?.columns || [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  const tasksByColumnId = tasks.reduce((acc, task) => {
    if (!acc[task.columnId]) acc[task.columnId] = [];
    acc[task.columnId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to={`/workspace/${project.workspaceId}`}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Workspace</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=3b82f6&color=ffffff`}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
              {project.description && (
                <p className="text-gray-600 mt-1">{project.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Created by {project.creator.name}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {board?.name || 'Main Board'}
              </h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{tasks.length} tasks</span>
                </div>
                {userRole === 'ADMIN' && (
                  <button
                    onClick={() => setShowCreateBoardModal(true)}
                    className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <KanbanBoard
              columns={columns}
              tasks={tasks}
              onTaskMove={handleTaskMoved}
              onCreateTask={canManageTasks ? handleCreateTask : undefined}
              userRole={userRole}
            />
          </div>
        </div>
      </main>

      {/* Create Task Modal */}
      {showCreateTaskModal && board && (
        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          boardId={board.id}
          columnId={selectedColumnId}
        />
      )}

      {/* Edit Board Modal */}
      {showCreateBoardModal && board && (
        <CreateBoardModal
          isOpen={showCreateBoardModal}
          onClose={() => setShowCreateBoardModal(false)}
          // projectId={project.id}
          onBoardCreated={handleBoardEdited}
          existingBoard={{
            id: board.id,
            name: board.name,
            columns: columns
          }}
          tasksByColumnId={tasksByColumnId}
        />
      )}
    </div>
  );
};