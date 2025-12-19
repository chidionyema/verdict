'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, SortAsc, Grid, List, FolderOpen } from 'lucide-react';
import FolderCard from './FolderCard';
import CreateFolderModal from './CreateFolderModal';
import { toast } from '@/components/ui/toast';

interface Folder {
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
  sort_order: number;
}

interface FolderManagerProps {
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId?: string | null;
  className?: string;
}

export default function FolderManager({
  onFolderSelect,
  selectedFolderId,
  className = ''
}: FolderManagerProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [unorganizedCount, setUnorganizedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'requests'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/folders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }
      
      const data = await response.json();
      setFolders(data.folders || []);
      setUnorganizedCount(data.unorganized_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (folderData: {
    name: string;
    description?: string;
    color: string;
    icon: string;
  }) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }

      const { folder } = await response.json();
      setFolders(prev => [...prev, folder].sort((a, b) => a.sort_order - b.sort_order));
      setShowCreateModal(false);
    } catch (err) {
      throw err; // Let the modal handle the error
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${folder.name}"? ${
        folder.request_count > 0 
          ? `${folder.request_count} requests will be moved to unorganized.` 
          : ''
      }`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete folder');
      }

      const { requests_moved } = await response.json();
      setFolders(prev => prev.filter(f => f.id !== folderId));
      setUnorganizedCount(prev => prev + requests_moved);
      
      if (selectedFolderId === folderId) {
        onFolderSelect(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete folder');
    }
  };

  const handleEditFolder = (folderId: string) => {
    // TODO: Implement edit modal
  };

  const filteredFolders = folders
    .filter(folder => 
      folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (folder.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'requests':
          return b.request_count - a.request_count;
        default:
          return a.sort_order - b.sort_order;
      }
    });

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Decision Folders</h2>
          <p className="text-sm text-gray-600">
            Organize your requests into folders for better tracking
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Folder
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="name">Sort by Name</option>
          <option value="created">Sort by Created</option>
          <option value="requests">Sort by Requests</option>
        </select>

        {/* View Mode */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${
              viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 border-l border-gray-300 ${
              viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Unorganized Requests */}
      {unorganizedCount > 0 && (
        <div
          onClick={() => onFolderSelect(null)}
          className={`
            p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all
            ${selectedFolderId === null 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Unorganized Requests</h3>
              <p className="text-sm text-gray-600">
                {unorganizedCount} request{unorganizedCount !== 1 ? 's' : ''} not in any folder
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Folders Grid/List */}
      {filteredFolders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {folders.length === 0 ? 'No folders yet' : 'No folders match your search'}
          </h3>
          <p className="text-gray-600 mb-4">
            {folders.length === 0 
              ? 'Create your first folder to organize your decision requests.'
              : 'Try adjusting your search terms.'
            }
          </p>
          {folders.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Folder
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredFolders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onSelect={onFolderSelect}
              onEdit={handleEditFolder}
              onDelete={handleDeleteFolder}
              isSelected={selectedFolderId === folder.id}
              className={viewMode === 'list' ? 'max-w-none' : ''}
            />
          ))}
        </div>
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateFolder}
        isLoading={isCreating}
      />
    </div>
  );
}