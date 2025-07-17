import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Users, Settings, ArrowLeft, FolderOpen, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CreateProjectModal } from '../components/project/CreateProjectModal';
import apiService from '../utils/api';
import type { Project } from '../types';

export const WorkspacePage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { user } = useAuthStore();
  const { currentWorkspace, userRole, fetchWorkspace, isLoading } = useWorkspaceStore();

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace(workspaceId);
      loadProjects();
    }
  }, [workspaceId, fetchWorkspace]);

  const loadProjects = async () => {
    if (!workspaceId) return;
    
    try {
      setIsLoadingProjects(true);
      const response = await apiService.getProjects(workspaceId);
      setProjects(response.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
    setShowCreateModal(false);
  };

  const canCreateProject = userRole === 'ADMIN' || userRole === 'MEMBER';

  if (isLoading || !currentWorkspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">{currentWorkspace.name}</h1>
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
              
              {(userRole === 'ADMIN' || userRole === 'MEMBER') && (
                <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workspace Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentWorkspace.name}</h2>
              {currentWorkspace.description && (
                <p className="text-gray-600 mt-1">{currentWorkspace.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{currentWorkspace.members.length} members</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(currentWorkspace.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Team:</span>
            <div className="flex -space-x-2">
              {currentWorkspace.members.slice(0, 8).map((member) => (
                <img
                  key={member.id}
                  src={member.user.avatar || `https://ui-avatars.com/api/?name=${member.user.name}&background=3b82f6&color=ffffff`}
                  alt={member.user.name}
                  className="h-8 w-8 rounded-full border-2 border-white"
                  title={`${member.user.name} (${member.role})`}
                />
              ))}
              {currentWorkspace.members.length > 8 && (
                <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{currentWorkspace.members.length - 8}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Project Button */}
        {canCreateProject && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Project</span>
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {isLoadingProjects ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first project to start organizing your work.</p>
            {canCreateProject && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Project</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="group block bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <FolderOpen className="h-4 w-4" />
                      <span>{project.boards?.length || 0}</span>
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={project.creator.avatar || `https://ui-avatars.com/api/?name=${project.creator.name}&background=3b82f6&color=ffffff`}
                        alt={project.creator.name}
                        className="h-6 w-6 rounded-full"
                      />
                      <span className="text-sm text-gray-600">{project.creator.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          workspaceId={workspaceId!}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};