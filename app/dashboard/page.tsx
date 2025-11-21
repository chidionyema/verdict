'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Image, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { VerdictRequest, Profile } from '@/lib/database.types';

export default function DashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<VerdictRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }

      // Fetch requests
      const res = await fetch('/api/requests');
      if (res.ok) {
        const { requests: requestsData } = await res.json();
        setRequests(requestsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Waiting for verdicts';
      case 'closed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Verdicts</h1>
            <p className="text-gray-600 mt-1">
              {profile?.credits || 0} credits remaining
            </p>
          </div>
          <Link
            href="/start"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Request
          </Link>
        </div>

        {/* Requests Grid */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No requests yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first verdict request to get honest feedback
            </p>
            <Link
              href="/start"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Create Request
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {request.media_type === 'photo' && request.media_url ? (
                    <img
                      src={request.media_url}
                      alt="Request"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-4 text-center">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 line-clamp-3">
                        {request.text_content}
                      </p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-indigo-600 capitalize">
                      {request.category}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{getStatusLabel(request.status)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {request.context}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {request.received_verdict_count}/{request.target_verdict_count} verdicts
                    </span>
                    <span className="text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
