'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Flag, 
  Clock, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  UserX,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface ContentReport {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  description: string;
  reported_by: string;
  created_at: string;
  status: string;
  reported_by_profile: { email: string };
  content_details: { context: string };
}

interface StuckRequest {
  id: string;
  category: string;
  context: string;
  status: string;
  created_at: string;
  received_verdict_count: number;
  target_verdict_count: number;
  credit_cost: number;
  user_profile: { email: string };
}

interface HiddenContent {
  id: string;
  category: string;
  context: string;
  auto_hidden: boolean;
  moderation_reason: string;
  created_at: string;
  user_profile: { email: string };
}

interface ModerationData {
  reports?: ContentReport[];
  stuckRequests?: StuckRequest[];
  hiddenContent?: HiddenContent[];
}


export default function AdminModerationPage() {
  const [data, setData] = useState<ModerationData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'stuck' | 'hidden'>('reports');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/moderation?type=all');
      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
          return;
        }
        throw new Error('Failed to fetch moderation data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const takeAction = async (action: string, type: string, id: string, reason?: string) => {
    try {
      setActionLoading(id);
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, type, id, reason })
      });

      if (!response.ok) {
        throw new Error('Action failed');
      }

      const result = await response.json();
      
      // Refresh data after action
      await fetchModerationData();

      toast.success(result.message || 'Action completed successfully');

    } catch (err) {
      console.error('Action failed:', err);
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { 
      id: 'reports' as const, 
      label: 'Pending Reports', 
      count: data.reports?.length || 0,
      icon: Flag 
    },
    { 
      id: 'stuck' as const, 
      label: 'Stuck Requests', 
      count: data.stuckRequests?.length || 0,
      icon: Clock 
    },
    { 
      id: 'hidden' as const, 
      label: 'Hidden Content', 
      count: data.hiddenContent?.length || 0,
      icon: EyeOff 
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading moderation data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin" className="text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Moderation</h1>
              <p className="text-gray-600">Review reported content and manage platform safety</p>
            </div>
            
            <button
              onClick={fetchModerationData}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg">
          {activeTab === 'reports' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Pending Content Reports</h2>
              
              {!data.reports || data.reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Flag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending reports</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.reports.map((report) => (
                    <div key={report.id} className="border border-yellow-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {report.content_type.charAt(0).toUpperCase() + report.content_type.slice(1)} Report
                          </h3>
                          <p className="text-sm text-gray-600">
                            Reported by: {report.reported_by_profile?.email || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(report.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          {report.reason}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Content:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {report.content_details?.context?.slice(0, 200) || 'No context available'}
                          {(report.content_details?.context?.length || 0) > 200 && '...'}
                        </p>
                      </div>

                      {report.description && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Reporter's comment:</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {report.description}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <button
                          onClick={() => takeAction('approve_report', report.content_type, report.id)}
                          disabled={actionLoading === report.id}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Dismiss Report
                        </button>
                        <button
                          onClick={() => takeAction('ban_content', report.content_type, report.content_id, 'Policy violation')}
                          disabled={actionLoading === report.id}
                          className="flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Ban Content
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stuck' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Stuck Requests</h2>
              
              {!data.stuckRequests || data.stuckRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No stuck requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.stuckRequests.map((request) => (
                    <div key={request.id} className="border border-orange-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{request.category}</h3>
                          <p className="text-sm text-gray-600">
                            User: {request.user_profile?.email || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(request.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Progress: {request.received_verdict_count}/{request.target_verdict_count} verdicts
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {request.status}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {request.credit_cost} credits
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Request:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {request.context?.slice(0, 200) || 'No context available'}
                          {(request.context?.length || 0) > 200 && '...'}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => takeAction('refund_stuck', 'request', request.id, 'Insufficient judge availability')}
                          disabled={actionLoading === request.id}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Refund & Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'hidden' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Auto-Hidden Content</h2>
              
              {!data.hiddenContent || data.hiddenContent.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <EyeOff className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hidden content</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.hiddenContent.map((content) => (
                    <div key={content.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{content.category}</h3>
                          <p className="text-sm text-gray-600">
                            User: {content.user_profile?.email || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Hidden: {new Date(content.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          Hidden
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Content:</p>
                        <p className="text-sm text-gray-600 bg-white p-2 rounded">
                          {content.context?.slice(0, 200) || 'No context available'}
                          {(content.context?.length || 0) > 200 && '...'}
                        </p>
                      </div>

                      {content.moderation_reason && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                          <p className="text-sm text-red-600 bg-red-100 p-2 rounded">
                            {content.moderation_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Moderation data last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}