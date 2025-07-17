import { Calendar, MessageSquare, Paperclip, User, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
  canDrag: boolean;
}

export const TaskCard = ({ 
  task, 
  onDragStart, 
  onDragEnd, 
  isDragging, 
  canDrag 
}: TaskCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertCircle className="h-3 w-3" />;
      case 'HIGH': return <Clock className="h-3 w-3" />;
      case 'MEDIUM': return <Clock className="h-3 w-3" />;
      case 'LOW': return <CheckCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isDueSoon = task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <div
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={`
        bg-white rounded-lg border border-gray-200 p-4 shadow-sm
        transition-all duration-200 group
        ${canDrag ? 'cursor-grab hover:shadow-md' : 'cursor-default'}
        ${isDragging ? 'rotate-3 scale-105 shadow-lg' : ''}
        ${isOverdue ? 'border-red-300 bg-red-50' : ''}
      `}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`
          inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border
          ${getPriorityColor(task.priority)}
        `}>
          {getPriorityIcon(task.priority)}
          <span>{task.priority}</span>
        </div>
        {task.assignee && (
          <img
            src={task.assignee.avatar || `https://ui-avatars.com/api/?name=${task.assignee.name}&background=3b82f6&color=ffffff`}
            alt={task.assignee.name}
            className="h-6 w-6 rounded-full"
            title={task.assignee.name}
          />
        )}
      </div>

      {/* Task Title */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <div className={`
          flex items-center space-x-1 mb-3 text-xs
          ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-500'}
        `}>
          <Calendar className="h-3 w-3" />
          <span>
            Due {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Comments Count */}
          {task._count && task._count.comments > 0 && (
            <div className="flex items-center space-x-1 text-gray-500">
              <MessageSquare className="h-3 w-3" />
              <span className="text-xs">{task._count.comments}</span>
            </div>
          )}

          {/* Attachments Count */}
          {task._count && task._count.attachments > 0 && (
            <div className="flex items-center space-x-1 text-gray-500">
              <Paperclip className="h-3 w-3" />
              <span className="text-xs">{task._count.attachments}</span>
            </div>
          )}
        </div>

        {/* Assignee (if no avatar in header) */}
        {!task.assignee && (
          <div className="flex items-center space-x-1 text-gray-500">
            <User className="h-3 w-3" />
            <span className="text-xs">Unassigned</span>
          </div>
        )}
      </div>

      {/* Drag Handle */}
      {canDrag && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};