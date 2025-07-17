import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { LoadingButton } from '../common/LoadingSpinner';
import type { CreateWorkspaceData } from '../../types';

const workspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional()
});

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkspaceModal = ({ isOpen, onClose }: CreateWorkspaceModalProps) => {
  const { createWorkspace, isLoading, error, clearError } = useWorkspaceStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateWorkspaceData>({
    resolver: zodResolver(workspaceSchema)
  });

  const onSubmit = async (data: CreateWorkspaceData) => {
    try {
      clearError();
      await createWorkspace(data);
      reset();
      onClose();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleClose = () => {
    reset();
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Create New Workspace</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={`
                    w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                    ${errors.name ? 'border-red-300' : 'border-gray-300'}
                  `}
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
                  rows={3}
                  className={`
                    w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                    ${errors.description ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="Enter workspace description (optional)"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Create Workspace
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};