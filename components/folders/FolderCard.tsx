'use client';

import { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Move,
  BarChart3,
  Calendar
} from 'lucide-react';

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    description?: string;
    color: string;
    icon: string;
    request_count: number;
    completed_count: number;
    completion_rate: number;
    created_at: string;
    updated_at: string;
  };
  onSelect: (folderId: string) => void;
  onEdit: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  onMove?: (folderId: string) => void;
  isSelected?: boolean;
  isDragging?: boolean;
  className?: string;
}

const FOLDER_ICONS = {
  folder: Folder,
  briefcase: BarChart3,
  heart: Calendar,
} as const;

export default function FolderCard({
  folder,
  onSelect,
  onEdit,
  onDelete,
  onMove,
  isSelected = false,
  isDragging = false,
  className = ''
}: FolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const IconComponent = FOLDER_ICONS[folder.icon as keyof typeof FOLDER_ICONS] || Folder;
  
  const handleCardClick = () => {
    onSelect(folder.id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(folder.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(folder.id);
  };

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onMove?.(folder.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="relative">
      <div
        className={`
          group relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer
          ${isSelected 
            ? `border-[${folder.color}] shadow-lg shadow-[${folder.color}]/20` 
            : 'border-gray-200 hover:border-gray-300'
          }
          ${isDragging ? 'opacity-50 rotate-2 scale-105' : 'hover:shadow-md'}
          ${className}
        `}
        style={{
          borderColor: isSelected ? folder.color : undefined,
          boxShadow: isSelected ? `0 10px 25px -5px ${folder.color}20` : undefined
        }}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${folder.color}20` }}
              >
                <IconComponent 
                  className="w-5 h-5" 
                  style={{ color: folder.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {folder.name}
                </h3>
                {folder.description && (
                  <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                    {folder.description}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleMenuClick}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {folder.request_count}
              </div>
              <div className="text-xs text-gray-500">Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {folder.completed_count}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
          </div>

          {/* Progress Bar */}
          {folder.request_count > 0 && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Completion Rate</span>
                <span className="text-xs font-medium text-gray-900">
                  {Math.round(folder.completion_rate)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: folder.color,
                    width: `${folder.completion_rate}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="text-xs text-gray-400 text-center">
            Created {formatDate(folder.created_at)}
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div 
            className="absolute top-2 right-2 w-3 h-3 rounded-full"
            style={{ backgroundColor: folder.color }}
          />
        )}
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute top-12 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[140px]">
          <button
            onClick={handleEdit}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          {onMove && (
            <button
              onClick={handleMove}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
            >
              <Move className="w-4 h-4" />
              <span>Move</span>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Overlay to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}