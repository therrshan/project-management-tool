import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, User, AlertCircle } from 'lucide-react';
import { LoadingButton } from '../common/LoadingSpinner';
import apiService from '../../utils/api';
import type { Task, CreateTaskData, CreateBoardColumn } from '../../types';

const boardSchema = z.object({
  title: z.string().min(1, 'Board title is required').max(200, 'Title is too long'),
});

type BoardFormData = z.infer<typeof boardSchema>;

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardCreated: (task: Task) => void;
}

export const CreateBoardModal = ({ 
  isOpen, 
  onClose
}: CreateBoardModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
  });

  const onSubmit = async (data: BoardFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const boardData: CreateBoardColumn = {
        title: data.title,
        
      };

    //   const response = await apiService.createBoardColumn(boardData);
    //         onTaskCreated(response.task);
    //         reset();
    //         onClose();

    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Create New Category</h2>
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
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Title *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className={`
                    w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                    ${errors.title ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="Enter category title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Create Task
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};