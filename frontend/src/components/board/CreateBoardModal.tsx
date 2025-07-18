import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { LoadingButton } from '../common/LoadingSpinner';
import apiService from '../../utils/api';
import type { BoardColumn, Task } from '../../types';

const columnSchema = z.object({
  id: z.string().min(1, 'Column ID is required'),
  title: z.string().min(1, 'Column title is required'),
  position: z.number().optional()
});

const boardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(100, 'Name is too long'),
  columns: z.array(columnSchema).min(1, 'At least one column is required')
});

type BoardFormData = z.infer<typeof boardSchema>;

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  // projectId: string;
  onBoardCreated: (board: any) => void;
  existingBoard: {
    id: string;
    name: string;
    columns: BoardColumn[];
  };
  tasksByColumnId : Record<string, Task[]>;
}

export const CreateBoardModal = ({ 
  isOpen, 
  onClose, 
  // projectId, 
  onBoardCreated,
  existingBoard, 
  tasksByColumnId
}: CreateBoardModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const defaultColumns = [
    { id: 'todo', title: 'To Do', position: 0 },
    { id: 'in-progress', title: 'In Progress', position: 1 },
    { id: 'done', title: 'Done', position: 2 }
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch, 
    getValues
  } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: existingBoard?.name || 'Main Board',
      columns: existingBoard?.columns || defaultColumns
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'columns'
  });

  const onSubmit = async (data: BoardFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.updateBoard(existingBoard.id, {
        name: data.name,
        columns: data.columns
      });
      onBoardCreated(response.board);
      
      reset();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error || `Failed to update board`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const addColumn = () => {
    const newColumn = {
      id: `col-${Date.now()}`,
      title: 'New Column',
      position: fields.length
    };
    append(newColumn);
  };

  const removeColumn = (index: number) => {
    const columnId = getValues(`columns.${index}.id`);
    const tasksInColumn = tasksByColumnId[columnId] || [];
    if (tasksInColumn.length > 0) {
      setError(`Cannot delete column "${fields[index].title}" because it has ${tasksInColumn.length} task(s).`);
      setTimeout(() => {
        setError(null);
      }, 2500);
      return;
    }

    if (fields.length > 1) {
      remove(index);
    }
  };

  const generateColumnId = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  if (!isOpen) return null;

  return(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Edit Board
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Columns */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Columns *
                </label>
                <button
                  type="button"
                  onClick={addColumn}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Column</span>
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center space-x-3"
                  >

                    <div className="flex-1">
                      <input
                        {...register(`columns.${index}.title`)}
                        type="text"
                        className={`
                          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                          ${errors.columns?.[index]?.title ? 'border-red-300' : 'border-gray-300'}
                        `}
                        placeholder="Column title"
                        onChange={(e) => {
                          const newId = generateColumnId(e.target.value);
                          register(`columns.${index}.id`).onChange({
                            target: { value: newId },
                          });
                        }}
                      />
                      {errors.columns?.[index]?.title && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.columns[index]?.title?.message}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 w-20">
                      ID:{' '}
                      {watch(`columns.${index}.title`)
                        ? generateColumnId(watch(`columns.${index}.title`))
                        : field.id}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeColumn(index)}
                      disabled={fields.length <= 1}
                      className={`
                        p-1 rounded transition-colors
                        ${
                          fields.length <= 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                        }
                      `}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {errors.columns && (
                <p className="mt-1 text-sm text-red-600">{errors.columns.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
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
                Update Board
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
    );
};