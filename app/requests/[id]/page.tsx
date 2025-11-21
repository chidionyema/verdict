'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, User, MapPin, Flag, ArrowLeft, RefreshCw } from 'lucide-react';
import type { VerdictRequest, VerdictResponse } from '@/lib/database.types';

interface VerdictWithNumber extends VerdictResponse {
  judge_number: number;
}

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [request, setRequest] = useState<VerdictRequest | null>(null);
  const [verdicts, setVerdicts] = useState<VerdictWithNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequest();

    // Poll for new verdicts if still open
    const interval = setInterval(() => {
      if (request?.status === 'open') {
        fetchRequest();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, request?.status]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Request not found');
        } else if (res.status === 403) {
          setError('You do not have access to this request');
        } else {
          setError('Failed to load request');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setRequest(data.request);
      setVerdicts(data.verdicts || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load request');
      setLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!confirm('Are you sure you want to flag this request?')) return;

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flag', reason: 'User flagged' }),
      });

      if (res.ok) {
        fetchRequest();
      }
    } catch (err) {
      console.error('Flag error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard" className="text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const averageRating =
    verdicts.length > 0
      ? verdicts.reduce((sum, v) => sum + (v.rating || 0), 0) / verdicts.filter(v => v.rating).length
      : 0;

  const progress = (request.received_verdict_count / request.target_verdict_count) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center space-x-4">
            {request.status === 'open' && (
              <button
                onClick={fetchRequest}
                className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            )}
            <button
              onClick={handleFlag}
              className="flex items-center text-gray-500 hover:text-red-600 cursor-pointer"
            >
              <Flag className="h-4 w-4 mr-1" />
              Flag
            </button>
          </div>
        </div>

        {/* Progress */}
        {request.status === 'open' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                {request.received_verdict_count} of {request.target_verdict_count} verdicts received
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              New verdicts will appear automatically
            </p>
          </div>
        )}

        {/* Summary */}
        {verdicts.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-600">
                  {averageRating.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">Average Rating</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {verdicts.length}
                </p>
                <p className="text-sm text-gray-500">Verdicts</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 capitalize">
                  {request.category}
                </p>
                <p className="text-sm text-gray-500">Category</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Media Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="font-semibold mb-4">Your Submission</h3>
              {request.media_type === 'photo' && request.media_url ? (
                <img
                  src={request.media_url}
                  alt="Your submission"
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm">{request.text_content}</p>
                </div>
              )}
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Category:</strong> {request.category}
                </p>
                {request.subcategory && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Type:</strong> {request.subcategory}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Context:</strong> {request.context}
                </p>
              </div>
            </div>
          </div>

          {/* Verdicts List */}
          <div className="lg:col-span-2 space-y-4">
            {verdicts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <p className="text-gray-500">
                  Waiting for judges to submit their verdicts...
                </p>
              </div>
            ) : (
              verdicts.map((verdict) => (
                <div
                  key={verdict.id}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 rounded-full p-3">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          Anonymous Judge #{verdict.judge_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(verdict.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {verdict.rating && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">
                          {verdict.rating}/10
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < verdict.rating! / 2
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4">{verdict.feedback}</p>

                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`px-3 py-1 rounded-full ${
                        verdict.tone === 'encouraging'
                          ? 'bg-green-100 text-green-700'
                          : verdict.tone === 'honest'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {verdict.tone}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 text-center">
          <Link
            href="/start"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition mr-4"
          >
            Get Another Verdict
          </Link>
        </div>
      </div>
    </div>
  );
}
