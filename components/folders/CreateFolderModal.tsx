'use client';

import { useState, useEffect } from 'react';
import { X, Folder, Briefcase, Heart, Calendar, Star, Target, Trophy } from 'lucide-react';

interface EditingFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
}

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (folder: {
    name: string;
    description?: string;
    color: string;
    icon: string;
  }) => Promise<void>;
  isLoading?: boolean;
  editingFolder?: EditingFolder | null;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#6b7280', // Gray
];

const PRESET_ICONS = [
  { name: 'folder', icon: Folder, label: 'Folder' },
  { name: 'briefcase', icon: Briefcase, label: 'Work' },
  { name: 'heart', icon: Heart, label: 'Personal' },
  { name: 'calendar', icon: Calendar, label: 'Planning' },
  { name: 'star', icon: Star, label: 'Important' },
  { name: 'target', icon: Target, label: 'Goals' },
  { name: 'trophy', icon: Trophy, label: 'Achievements' },
];

const PRESET_TEMPLATES = [
  {
    name: 'Career Decisions',
    description: 'Job changes, promotions, and career moves',
    color: '#10b981',
    icon: 'briefcase'
  },
  {
    name: 'Personal Life',
    description: 'Relationships, lifestyle, and personal choices',
    color: '#f59e0b',
    icon: 'heart'
  },
  {
    name: 'Financial Planning',
    description: 'Investments, purchases, and money decisions',
    color: '#06b6d4',
    icon: 'target'
  },
  {
    name: 'Health & Wellness',
    description: 'Fitness, diet, and wellbeing decisions',
    color: '#84cc16',
    icon: 'star'
  },
];

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
  editingFolder = null
}: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [error, setError] = useState('');

  const isEditMode = !!editingFolder;

  // Initialize form with editing folder data
  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setDescription(editingFolder.description || '');
      setSelectedColor(editingFolder.color);
      setSelectedIcon(editingFolder.icon);
    } else {
      resetForm();
    }
  }, [editingFolder]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedColor(PRESET_COLORS[0]);
    setSelectedIcon('folder');
    setError('');
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  // Escape key to close modal (WCAG accessibility)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    if (name.trim().length > 100) {
      setError('Folder name must be 100 characters or less');
      return;
    }

    if (description.length > 500) {
      setError('Description must be 500 characters or less');
      return;
    }

    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        icon: selectedIcon
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleTemplateSelect = (template: typeof PRESET_TEMPLATES[0]) => {
    setName(template.name);
    setDescription(template.description);
    setSelectedColor(template.color);
    setSelectedIcon(template.icon);
  };

  const SelectedIconComponent = PRESET_ICONS.find(i => i.name === selectedIcon)?.icon || Folder;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{isEditMode ? 'Edit Folder' : 'Create New Folder'}</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Start Templates
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_TEMPLATES.map((template) => {
                const IconComp = PRESET_ICONS.find(i => i.name === template.icon)?.icon || Folder;
                return (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div 
                        className="w-6 h-6 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: `${template.color}20` }}
                      >
                        <IconComp className="w-3.5 h-3.5" style={{ color: template.color }} />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{template.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-3 text-sm text-gray-500">or customize</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Folder Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Career Decisions"
              maxLength={100}
              disabled={isLoading}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {name.length}/100
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of what goes in this folder"
              rows={3}
              maxLength={500}
              disabled={isLoading}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {description.length}/500
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_ICONS.map((iconItem) => {
                const IconComp = iconItem.icon;
                return (
                  <button
                    key={iconItem.name}
                    type="button"
                    onClick={() => setSelectedIcon(iconItem.name)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedIcon === iconItem.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={isLoading}
                  >
                    <IconComp className={`w-5 h-5 mx-auto ${
                      selectedIcon === iconItem.name ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <div className={`text-xs mt-1 ${
                      selectedIcon === iconItem.name ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {iconItem.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    selectedColor === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={isLoading}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preview
            </label>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${selectedColor}20` }}
                >
                  <SelectedIconComponent
                    className="w-5 h-5"
                    style={{ color: selectedColor }}
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {name || 'Folder Name'}
                  </div>
                  {description && (
                    <div className="text-sm text-gray-600">{description}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isLoading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Folder')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}