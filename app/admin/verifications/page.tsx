'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  Linkedin,
  Globe,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { ExpertBadge } from '@/components/experts/ExpertBadge';

interface VerificationRequest {
  id: string;
  user_id: string;
  verification_type: 'linkedin' | 'portfolio' | 'manual';
  linkedin_url: string | null;
  portfolio_url: string | null;
  job_title: string | null;
  company: string | null;
  industry: string | null;
  years_experience: number | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  profiles?: {
    email: string;
    display_name: string | null;
  };
  user_credits?: {
    reputation_score: number;
    total_reviews: number;
  };
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    loadVerifications();
  }, [filter]);

  async function loadVerifications() {
    try {
      let query = supabase
        .from('expert_verifications')
        .select(`
          *,
          profiles!inner(email, display_name),
          user_credits!inner(reputation_score, total_reviews)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('verification_status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(verification: VerificationRequest) {
    setProcessing(true);
    
    try {
      // Update verification status
      const { error: updateError } = await (supabase as any)
        .from('expert_verifications')
        .update({
          verification_status: 'verified' as const,
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', verification.id);

      if (updateError) throw updateError;

      toast.success(`Approved ${verification.profiles?.display_name || 'User'} as verified expert`);
      await loadVerifications();
      setSelectedVerification(null);
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject(verification: VerificationRequest) {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    
    try {
      const { error: updateError } = await (supabase as any)
        .from('expert_verifications')
        .update({
          verification_status: 'rejected' as const,
          rejection_reason: rejectionReason,
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', verification.id);

      if (updateError) throw updateError;

      toast.success('Verification rejected');
      await loadVerifications();
      setSelectedVerification(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setProcessing(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle className="h-3 w-3" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expert Verifications</h1>
          <p className="text-gray-600">Review and approve expert verification requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{verifications.length}</p>
              </div>
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {verifications.filter(v => v.verification_status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Verified</p>
                <p className="text-2xl font-bold text-green-900">
                  {verifications.filter(v => v.verification_status === 'verified').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Rejected</p>
                <p className="text-2xl font-bold text-red-900">
                  {verifications.filter(v => v.verification_status === 'rejected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex gap-2">
              {(['all', 'pending', 'verified', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === status
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200'
                      : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Verifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professional Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reputation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Links
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {verifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {verification.profiles?.display_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {verification.profiles?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {verification.job_title || 'No title'}
                      </div>
                      <div className="text-gray-500">
                        {verification.company} • {verification.industry}
                      </div>
                      {verification.years_experience && (
                        <div className="text-gray-400 text-xs">
                          {verification.years_experience} years exp.
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">
                          {verification.user_credits?.reputation_score.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {verification.user_credits?.total_reviews || 0} reviews
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {verification.linkedin_url && (
                        <a
                          href={verification.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                      {verification.portfolio_url && (
                        <a
                          href={verification.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Globe className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(verification.verification_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {verification.verification_status === 'pending' && (
                      <button
                        onClick={() => setSelectedVerification(verification)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Review
                      </button>
                    )}
                    {verification.verification_status === 'rejected' && verification.rejection_reason && (
                      <div className="text-xs text-red-600" title={verification.rejection_reason}>
                        {verification.rejection_reason.substring(0, 30)}...
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {verifications.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No verifications found</p>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Review Verification Request
                </h2>
                
                {/* Preview how it will look */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">This will be displayed as:</p>
                  <ExpertBadge
                    isVerified={true}
                    jobTitle={selectedVerification.job_title}
                    industry={selectedVerification.industry}
                    showDetails={true}
                    size="lg"
                  />
                </div>

                {/* Details */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700">User</label>
                    <p className="text-gray-900">
                      {selectedVerification.profiles?.display_name} ({selectedVerification.profiles?.email})
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Professional Details</label>
                    <p className="text-gray-900">
                      {selectedVerification.job_title} at {selectedVerification.company}
                    </p>
                    <p className="text-gray-600">
                      {selectedVerification.industry} • {selectedVerification.years_experience} years
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Verification Links</label>
                    <div className="flex gap-4 mt-1">
                      {selectedVerification.linkedin_url && (
                        <a
                          href={selectedVerification.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <Linkedin className="h-5 w-5" />
                          View LinkedIn
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {selectedVerification.portfolio_url && (
                        <a
                          href={selectedVerification.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                        >
                          <Globe className="h-5 w-5" />
                          View Portfolio
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Reputation Score</label>
                    <p className="text-gray-900">
                      {selectedVerification.user_credits?.reputation_score.toFixed(1)}/5.0
                      ({selectedVerification.user_credits?.total_reviews || 0} reviews)
                    </p>
                  </div>
                </div>

                {/* Rejection Reason */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedVerification(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedVerification)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-300"
                    disabled={processing || !rejectionReason.trim()}
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedVerification)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300"
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Approve'}
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