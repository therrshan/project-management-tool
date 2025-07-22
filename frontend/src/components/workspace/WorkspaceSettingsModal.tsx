import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Settings, Trash2, AlertTriangle } from 'lucide-react';
import { LoadingButton } from '../common/LoadingSpinner';
import apiService from '../../utils/api';
import type { Workspace } from '../../types';

const workspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional()
});

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  currentUserId: string;
  userRole: string;
  onWorkspaceUpdated: (workspace: Workspace) => void;
  onWorkspaceDeleted: () => void;
}

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

export const WorkspaceSettingsModal = ({
  isOpen,
  onClose,
  workspace,
  currentUserId,
  userRole,
  onWorkspaceUpdated,
  onWorkspaceDeleted
}: WorkspaceSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<'general' | 'danger'>('general');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isCreator = workspace.createdBy === currentUserId;
  const isAdmin = userRole === 'ADMIN';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description || ''
    }
  });

  const handleUpdateWorkspace = async (data: WorkspaceFormData) => {
    try {
      setError(null);
      setIsUpdating(true);
      const response = await apiService.updateWorkspace(workspace.id, data);
      onWorkspaceUpdated(response.workspace);
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update workspace');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (deleteConfirmText !== workspace.name) {
      setError('Please type the workspace name exactly to confirm deletion');
      return;
    }

    try {
      setError(null);
      setIsDeleting(true);
      await apiService.deleteWorkspace(workspace.id);
      onWorkspaceDeleted();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete workspace');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    setActiveTab('general');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Workspace Settings</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              General
            </button>
            {isCreator && (
              <button
                onClick={() => setActiveTab('danger')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'danger'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Danger Zone
              </button>
            )}
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {activeTab === 'general' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                
                <form onSubmit={handleSubmit(handleUpdateWorkspace)} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Workspace Name
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      disabled={!isAdmin}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !isAdmin ? 'bg-gray-50 cursor-not-allowed' : ''
                      } ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter workspace name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      disabled={!isAdmin}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !isAdmin ? 'bg-gray-50 cursor-not-allowed' : ''
                      } ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter workspace description"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Workspace Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(workspace.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Members:</span>
                        <span>{workspace.members.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projects:</span>
                        <span>{workspace.projects?.length || workspace._count?.projects || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Your Role:</span>
                        <span className="capitalize">{userRole.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex justify-end">
                      <LoadingButton
                        type="submit"
                        isLoading={isUpdating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </LoadingButton>
                    </div>
                  )}

                  {!isAdmin && (
                    <div className="text-sm text-gray-500 italic">
                      Only workspace administrators can modify these settings.
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'danger' && isCreator && (
              <div>
                <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                
                <div className="border border-red-200 rounded-md p-4 bg-red-50">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        Delete Workspace
                      </h4>
                      <p className="text-sm text-red-700 mb-4">
                        Once you delete a workspace, there is no going back. This will permanently 
                        delete the workspace, all its projects, boards, tasks, and remove all members.
                      </p>
                      
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="inline-flex items-center space-x-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Workspace</span>
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-red-800 mb-2">
                              Type <strong>{workspace.name}</strong> to confirm deletion:
                            </label>
                            <input
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                              placeholder={workspace.name}
                            />
                          </div>
                          
                          <div className="flex space-x-3">
                            <LoadingButton
                              onClick={handleDeleteWorkspace}
                              isLoading={isDeleting}
                              disabled={deleteConfirmText !== workspace.name}
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              I understand, delete this workspace
                            </LoadingButton>
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteConfirmText('');
                                setError(null);
                              }}
                              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end p-6 border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};