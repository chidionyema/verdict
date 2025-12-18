'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Filter, Search, Calendar, BarChart3, Move, Folder as FolderIcon } from 'lucide-react';
import FolderManager from '@/components/folders/FolderManager';
import Link from 'next/link';

interface Request {
  id: string;
  category: string;
  subcategory?: string;
  media_type: string;
  text_content?: string;
  context: string;
  status: string;
  request_tier: string;
  created_at: string;
  updated_at: string;
  verdict_count: number;
  avg_rating?: number;
  folder_id?: string;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export const dynamic = 'force-dynamic';

export default function DecisionsPage() {
  const [view, setView] = useState<'folders' | 'requests'>('folders');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'completed' | 'cancelled'>('all');
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);

  useEffect(() => {
    if (selectedFolderId !== null) {
      fetchFolderRequests(selectedFolderId);
    }
  }, [selectedFolderId]);

  const fetchFolderRequests = async (folderId: string | null) => {
    setLoading(true);
    try {
      let url = '/api/folders/';
      if (folderId === null) {
        // Fetch unorganized requests
        url = '/api/requests?unorganized=true';
      } else {
        url = `/api/folders/${folderId}/requests`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch requests');
      
      const data = await response.json();
      
      if (folderId === null) {
        setRequests(data.requests || []);
        setSelectedFolder(null);
      } else {
        setRequests(data.requests || []);
        setSelectedFolder(data.folder || null);
      }
    } catch (error) {
      console.error('Error fetching folder requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      
      const data = await response.json();
      setAvailableFolders(data.folders || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setView('requests');
    setSelectedRequests(new Set());
  };

  const handleBackToFolders = () => {
    setView('folders');
    setSelectedFolderId(null);
    setSelectedFolder(null);
    setSelectedRequests(new Set());
  };

  const handleRequestSelect = (requestId: string, isSelected: boolean) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(requestId);
      } else {
        newSet.delete(requestId);
      }
      return newSet;
    });
  };

  const handleMoveRequests = async (targetFolderId: string) => {
    if (selectedRequests.size === 0) return;

    try {
      const response = await fetch(`/api/folders/${targetFolderId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_ids: Array.from(selectedRequests) }),
      });

      if (!response.ok) throw new Error('Failed to move requests');

      // Refresh the current view
      if (selectedFolderId !== null) {
        fetchFolderRequests(selectedFolderId);
      }
      
      setSelectedRequests(new Set());
      setShowMoveModal(false);
    } catch (error) {
      console.error('Error moving requests:', error);
      alert('Failed to move requests');
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (view === 'folders') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Decisions</h1>
                <p className="text-gray-600 mt-2">
                  Organize and track your decision requests with folders
                </p>
              </div>
              <Link
                href="/my-requests"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View old format →
              </Link>
            </div>
          </div>

          <FolderManager 
            onFolderSelect={handleFolderSelect}
            selectedFolderId={selectedFolderId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleBackToFolders}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Folders
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                {selectedFolder ? (
                  <>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${selectedFolder.color}20` }}
                    >
                      <FolderIcon className="w-4 h-4" style={{ color: selectedFolder.color }} />
                    </div>
                    <span>{selectedFolder.name}</span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FolderIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span>Unorganized Requests</span>
                  </>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                {selectedRequests.size > 0 && ` (${selectedRequests.size} selected)`}
              </p>
            </div>

            {selectedRequests.size > 0 && (
              <button
                onClick={() => {
                  fetchAvailableFolders();
                  setShowMoveModal(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Move className="w-4 h-4 mr-2" />
                Move Selected
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {requests.length === 0 ? 'No requests yet' : 'No requests match your filters'}
            </h3>
            <p className="text-gray-600">
              {requests.length === 0 
                ? 'Start by creating your first request.'
                : 'Try adjusting your search terms or filters.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className={`bg-white rounded-lg border-2 transition-all ${
                  selectedRequests.has(request.id)
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <input
                          type="checkbox"
                          checked={selectedRequests.has(request.id)}
                          onChange={(e) => handleRequestSelect(request.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {request.category}
                          </span>
                          {request.subcategory && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600 capitalize">
                                {request.subcategory}
                              </span>
                            </>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {request.context}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(request.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>{request.verdict_count} verdict{request.verdict_count !== 1 ? 's' : ''}</span>
                        </div>
                        {request.avg_rating && (
                          <div className="flex items-center space-x-1">
                            <span>★</span>
                            <span>{request.avg_rating.toFixed(1)} avg</span>
                          </div>
                        )}
                        <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs">
                          {request.request_tier}
                        </span>
                      </div>
                    </div>
                    
                    <Link
                      href={`/requests/${request.id}`}
                      className="ml-4 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Move Modal */}
        {showMoveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Move {selectedRequests.size} request{selectedRequests.size !== 1 ? 's' : ''} to folder
                </h3>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableFolders
                    .filter(f => f.id !== selectedFolderId)
                    .map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleMoveRequests(folder.id)}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${folder.color}20` }}
                          >
                            <FolderIcon className="w-4 h-4" style={{ color: folder.color }} />
                          </div>
                          <span className="font-medium text-gray-900">{folder.name}</span>
                        </div>
                      </button>
                    ))}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowMoveModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}