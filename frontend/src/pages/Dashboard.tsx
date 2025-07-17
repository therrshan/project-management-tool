import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, FolderOpen, Calendar, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CreateWorkspaceModal } from '../components/workspace/CreateWorkspaceModal';

export const Dashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, logout } = useAuthStore();
  const { workspaces, isLoading, fetchWorkspaces } = useWorkspaceStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
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
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-gray-600">Manage your workspaces and stay organized with your team.</p>
        </div>

        {/* Create Workspace Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Workspace</span>
          </button>
        </div>

        {/* Workspaces Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first workspace to organize your projects.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Workspace</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                to={`/workspace/${workspace.id}`}
                className="group block bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {workspace.name}
                    </h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{workspace.members.length}</span>
                    </div>
                  </div>
                  
                  {workspace.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {workspace.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FolderOpen className="h-4 w-4" />
                        <span>{workspace._count.projects} projects</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(workspace.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex -space-x-2">
                    {workspace.members.slice(0, 3).map((member) => (
                      <img
                        key={member.id}
                        src={member.user.avatar || `https://ui-avatars.com/api/?name=${member.user.name}&background=3b82f6&color=ffffff`}
                        alt={member.user.name}
                        className="h-8 w-8 rounded-full border-2 border-white"
                        title={member.user.name}
                      />
                    ))}
                    {workspace.members.length > 3 && (
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{workspace.members.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Team Collaboration</h3>
            </div>
            <p className="text-sm text-gray-600">
              Invite team members to your workspaces and collaborate on projects in real-time.
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FolderOpen className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Project Management</h3>
            </div>
            <p className="text-sm text-gray-600">
              Organize your work with projects and track progress with Kanban boards.
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">Customization</h3>
            </div>
            <p className="text-sm text-gray-600">
              Customize your workspace settings and manage team permissions.
            </p>
          </div>
        </div>
      </main>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <CreateWorkspaceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};