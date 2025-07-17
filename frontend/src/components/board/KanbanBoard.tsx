import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, BoardColumn } from '../../types';

interface KanbanBoardProps {
  columns: BoardColumn[];
  tasks: Task[];
  onTaskMove: (taskId: string, newColumnId: string, newPosition: number) => void;
  onCreateTask?: (columnId: string) => void;
  userRole: string | null;
}

export const KanbanBoard = ({ 
  columns, 
  tasks, 
  onTaskMove, 
  onCreateTask, 
  userRole 
}: KanbanBoardProps) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const getTasksByColumn = (columnId: string) => {
    return tasks
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (userRole === 'VIEWER') return;
    
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', (e.currentTarget as HTMLElement).outerHTML);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedTask(null);
    setDragOverColumn(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.columnId === columnId) {
      return;
    }

    const columnTasks = getTasksByColumn(columnId);
    const newPosition = columnTasks.length;

    onTaskMove(draggedTask.id, columnId, newPosition);
    setDraggedTask(null);
  };

  const canManageTasks = userRole === 'ADMIN' || userRole === 'MEMBER';

  return (
    <div className="flex space-x-6 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTasks = getTasksByColumn(column.id);
        const isDropTarget = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            className={`
              flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4 transition-colors
              ${isDropTarget ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}
            `}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              {canManageTasks && onCreateTask && (
                <button
                  onClick={() => onCreateTask(column.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Tasks */}
            <div className="space-y-3 min-h-[200px]">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedTask?.id === task.id}
                  canDrag={canManageTasks}
                />
              ))}
              
              {/* Drop Zone */}
              {isDropTarget && (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center text-blue-500">
                  Drop task here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};