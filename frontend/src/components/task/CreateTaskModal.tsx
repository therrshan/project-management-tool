import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, User, AlertCircle } from 'lucide-react';
import { LoadingButton } from '../common/LoadingSpinner';
import apiService from '../../utils/api';
import type { Task, CreateTaskData } from '../../types';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional()
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  columnId: string;
  onTaskCreated: (task: Task) => void;
}

export const CreateTaskModal = ({ 
  isOpen, 
  onClose, 
  boardId, 
  columnId, 
  onTaskCreated 
}: CreateTaskModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'MEDIUM'
    }
  });

  const priority = watch('priority');

  const onSubmit = async (data: TaskFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const taskData: CreateTaskData = {
        title: data.title,
        description: data.description,
        boardId,
        columnId,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        assignedTo: data.assignedTo || undefined
      };
      
      const response = await apiService.createTask(taskData);
      onTaskCreated(response.task);
      reset();
      onClose();
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
            <h2 className="text-lg font-semibold text-gray-900">Create New Task</h2>
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
                  Task Title *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className={`
                    w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                    ${errors.title ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="Enter task title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
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
                  placeholder="Enter task description (optional)"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <div className="flex items-center space-x-1">
                  <select
                    {...register('priority')}
                    className={`
                      flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                      ${errors.priority ? 'border-red-300' : 'border-gray-300'}
                    `}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  <div className={`
                    px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1
                    ${getPriorityColor(priority)}
                  `}>
                    <AlertCircle className="h-3 w-3" />
                    <span>{priority}</span>
                  </div>
                </div>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('dueDate')}
                    type="datetime-local"
                    className={`
                      w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                      ${errors.dueDate ? 'border-red-300' : 'border-gray-300'}
                    `}
                  />
                </div>
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
                )}
              </div>

              {/* Assignee */}
              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('assignedTo')}
                    type="text"
                    className={`
                      w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                      ${errors.assignedTo ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="Enter user ID or email (optional)"
                  />
                </div>
                {errors.assignedTo && (
                  <p className="mt-1 text-sm text-red-600">{errors.assignedTo.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for unassigned task
                </p>
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