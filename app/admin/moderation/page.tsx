'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, Clock, User, Flag } from 'lucide-react';

interface ContentReport {
  id: string;
  created_at: string;
  reporter_id: string;
  reported_content_type: 'verdict_request' | 'verdict_response';
  reported_content_id: string;
  report_reason: string;
  report_description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  moderator_id?: string;
  moderator_notes?: string;
  resolution?: string;
  resolved_at?: string;
  reporter_email?: string;
  content_preview?: string;
}

const REPORT_REASONS = {
  inappropriate_content: 'Inappropriate Content',
  harassment: 'Harassment or Bullying',
  spam: 'Spam',
  illegal_content: 'Illegal Content',
  personal_information: 'Personal Information',
  copyright_violation: 'Copyright Violation',
  other: 'Other',
};

const RESOLUTIONS = {
  content_removed: 'Content Removed',
  user_warned: 'User Warned',
  user_suspended: 'User Suspended',
  no_violation: 'No Violation Found',
  other: 'Other Action',
};

export default function ModerationPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing' | 'resolved'>('pending');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/admin/reports?status=${filter}`);
      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else {
          throw new Error('Failed to fetch reports');
        }
        return;
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = async (reportId: string, action: 'start_review' | 'resolve' | 'dismiss') => {
    if (action === 'resolve' && !resolution) {
      alert('Please select a resolution');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          moderator_notes: moderatorNotes.trim() || null,
          resolution: action === 'resolve' ? resolution : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      await fetchReports();
      setSelectedReport(null);
      setModeratorNotes('');
      setResolution('');

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update report');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const statusCounts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    resolved: reports.filter(r => r.status === 'resolved' || r.status === 'dismissed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading moderation queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Moderation</h1>
          <p className="text-gray-600">Review and manage reported content</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Reports', count: statusCounts.all },
                { key: 'pending', label: 'Pending', count: statusCounts.pending },
                { key: 'reviewing', label: 'In Review', count: statusCounts.reviewing },
                { key: 'resolved', label: 'Resolved', count: statusCounts.resolved },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white shadow rounded-lg">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reports to review</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : report.status === 'reviewing'
                              ? 'bg-blue-100 text-blue-800'
                              : report.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {report.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {REPORT_REASONS[report.report_reason as keyof typeof REPORT_REASONS] || report.report_reason}
                        </span>
                        <span className="text-sm text-gray-500">
                          {report.reported_content_type === 'verdict_request' ? 'Request' : 'Response'}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 font-medium mb-1">
                        Report #{report.id.slice(-8)}
                      </p>
                      
                      {report.report_description && (
                        <p className="text-gray-600 text-sm mb-2">
                          "{report.report_description}"
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Reported {new Date(report.created_at).toLocaleDateString()}</span>
                        {report.reporter_email && (
                          <span>by {report.reporter_email}</span>
                        )}
                        {report.resolved_at && (
                          <span>Resolved {new Date(report.resolved_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">Review Report #{selectedReport.id.slice(-8)}</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Report Details */}
                <div>
                  <h4 className="font-medium mb-3">Report Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Reason:</span>
                      <p className="font-medium">
                        {REPORT_REASONS[selectedReport.report_reason as keyof typeof REPORT_REASONS]}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Content Type:</span>
                      <p className="font-medium">
                        {selectedReport.reported_content_type === 'verdict_request' ? 'Request' : 'Response'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Reported:</span>
                      <p className="font-medium">
                        {new Date(selectedReport.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className="font-medium capitalize">{selectedReport.status}</p>
                    </div>
                  </div>
                  {selectedReport.report_description && (
                    <div className="mt-3">
                      <span className="text-gray-500">Description:</span>
                      <p className="mt-1 p-3 bg-gray-50 rounded text-sm">
                        {selectedReport.report_description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                {selectedReport.content_preview && (
                  <div>
                    <h4 className="font-medium mb-3">Reported Content</h4>
                    <div className="p-4 bg-gray-50 rounded border">
                      <p className="text-sm">{selectedReport.content_preview}</p>
                    </div>
                  </div>
                )}

                {/* Moderation Actions */}
                {selectedReport.status === 'pending' && (
                  <div>
                    <h4 className="font-medium mb-3">Take Action</h4>
                    <div className="space-y-4">
                      <button
                        onClick={() => handleReviewReport(selectedReport.id, 'start_review')}
                        disabled={submitting}
                        className="w-full flex items-center justify-center px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Start Review
                      </button>
                    </div>
                  </div>
                )}

                {selectedReport.status === 'reviewing' && (
                  <div>
                    <h4 className="font-medium mb-3">Resolve Report</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Resolution
                        </label>
                        <select
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select resolution...</option>
                          {Object.entries(RESOLUTIONS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Moderator Notes
                        </label>
                        <textarea
                          value={moderatorNotes}
                          onChange={(e) => setModeratorNotes(e.target.value)}
                          placeholder="Add notes about your decision..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          rows={3}
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleReviewReport(selectedReport.id, 'resolve')}
                          disabled={submitting || !resolution}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </button>
                        <button
                          onClick={() => handleReviewReport(selectedReport.id, 'dismiss')}
                          disabled={submitting}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Previous Resolution */}
                {selectedReport.status === 'resolved' && selectedReport.resolution && (
                  <div>
                    <h4 className="font-medium mb-3">Resolution</h4>
                    <div className="p-4 bg-green-50 rounded border border-green-200">
                      <p className="font-medium text-green-800">
                        {RESOLUTIONS[selectedReport.resolution as keyof typeof RESOLUTIONS]}
                      </p>
                      {selectedReport.moderator_notes && (
                        <p className="text-green-700 text-sm mt-2">
                          {selectedReport.moderator_notes}
                        </p>
                      )}
                      <p className="text-green-600 text-xs mt-2">
                        Resolved on {new Date(selectedReport.resolved_at!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}