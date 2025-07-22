import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Settings, Trash2, AlertTriangle } from 'lucide-react';
import { LoadingButton } from '../common/LoadingSpinner';
import apiService from '../../utils/api';
import type { Project } from '../../types';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional()
});

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentUserId: string;
  userRole: string;
  workspaceCreatorId: string;
  onProjectUpdated: (project: Project) => void;
  onProjectDeleted: () => void;
}

type ProjectFormData = z.infer<typeof projectSchema>;

export const ProjectSettingsModal = ({
  isOpen,
  onClose,
  project,
  currentUserId,
  userRole,
  workspaceCreatorId,
  onProjectUpdated,
  onProjectDeleted
}: ProjectSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<'general' | 'danger'>('general');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isProjectCreator = project.createdBy === currentUserId;
  const isWorkspaceAdmin = userRole === 'ADMIN';
  const isWorkspaceCreator = workspaceCreatorId === currentUserId;
  const canEdit = isWorkspaceAdmin || isProjectCreator;
  const canDelete = isWorkspaceAdmin || isProjectCreator || isWorkspaceCreator;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || ''
    }
  });

  const handleUpdateProject = async (data: ProjectFormData) => {
    try {
      setError(null);
      setIsUpdating(true);
      const response = await apiService.updateProject(project.id, data);
      onProjectUpdated(response.project);
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update project');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText !== project.name) {
      setError('Please type the project name exactly to confirm deletion');
      return;
    }

    try {
      setError(null);
      setIsDeleting(true);
      await apiService.deleteProject(project.id);
      onProjectDeleted();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete project');
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
              <h2 className="text-lg font-semibold text-gray-900">Project Settings</h2>
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
            {canDelete && (
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
                
                <form onSubmit={handleSubmit(handleUpdateProject)} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      disabled={!canEdit}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !canEdit ? 'bg-gray-50 cursor-not-allowed' : ''
                      } ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter project name"
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
                      disabled={!canEdit}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !canEdit ? 'bg-gray-50 cursor-not-allowed' : ''
                      } ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter project description"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Project Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Creator:</span>
                        <span>{project.creator.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Boards:</span>
                        <span>{project.boards?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Your Role:</span>
                        <span className="capitalize">{userRole.toLowerCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Your Access:</span>
                        <span>
                          {isProjectCreator && 'Project Creator'}
                          {!isProjectCreator && isWorkspaceAdmin && 'Workspace Admin'}
                          {!isProjectCreator && !isWorkspaceAdmin && 'Member'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canEdit && (
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

                  {!canEdit && (
                    <div className="text-sm text-gray-500 italic">
                      Only project creators and workspace administrators can modify these settings.
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'danger' && canDelete && (
              <div>
                <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                
                <div className="border border-red-200 rounded-md p-4 bg-red-50">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        Delete Project
                      </h4>
                      <p className="text-sm text-red-700 mb-4">
                        Once you delete a project, there is no going back. This will permanently 
                        delete the project, all its boards, tasks, and all associated data.
                      </p>
                      
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="inline-flex items-center space-x-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Project</span>
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-red-800 mb-2">
                              Type <strong>{project.name}</strong> to confirm deletion:
                            </label>
                            <input
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                              placeholder={project.name}
                            />
                          </div>
                          
                          <div className="flex space-x-3">
                            <LoadingButton
                              onClick={handleDeleteProject}
                              isLoading={isDeleting}
                              disabled={deleteConfirmText !== project.name}
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              I understand, delete this project
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