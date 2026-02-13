'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';

const EDIT_WINDOW_MINUTES = 5;

const CATEGORIES = [
  { id: 'appearance', label: 'Appearance', icon: '👔' },
  { id: 'profile', label: 'Profile', icon: '💼' },
  { id: 'writing', label: 'Writing', icon: '✍️' },
  { id: 'decision', label: 'Decision', icon: '🤔' },
];

interface VerdictRequest {
  id: string;
  created_at: string;
  status: string;
  received_verdict_count: number;
  context?: string;
  category?: string;
  media_type?: string;
  media_url?: string;
}

export default function EditRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [request, setRequest] = useState<VerdictRequest | null>(null);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState({ canEdit: false, minutes: 0, seconds: 0 });

  // Form state
  const [context, setContext] = useState('');
  const [category, setCategory] = useState('');

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Request not found');
        } else if (res.status === 403) {
          setError('You do not have permission to edit this request');
        } else {
          setError('Failed to load request');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      const req = data.request;

      // Check if request can be edited
      if (req.status === 'closed' || req.status === 'cancelled') {
        setError('This request cannot be edited');
        setLoading(false);
        return;
      }

      if (req.received_verdict_count > 0) {
        setError('Cannot edit: verdicts have already been received');
        setLoading(false);
        return;
      }

      // Check edit window
      const created = new Date(req.created_at).getTime();
      const now = Date.now();
      const elapsedMs = now - created;
      const windowMs = EDIT_WINDOW_MINUTES * 60 * 1000;

      if (elapsedMs > windowMs) {
        setError('Edit window has expired (5 minutes from creation)');
        setLoading(false);
        return;
      }

      setRequest(req);
      setContext(req.context || '');
      setCategory(req.category || '');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching request:', err);
      setError('Failed to load request');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  // Update time remaining every second
  useEffect(() => {
    if (!request) return;

    const updateTime = () => {
      const created = new Date(request.created_at).getTime();
      const now = Date.now();
      const elapsedMs = now - created;
      const windowMs = EDIT_WINDOW_MINUTES * 60 * 1000;
      const remainingMs = Math.max(0, windowMs - elapsedMs);

      setTimeRemaining({
        canEdit: remainingMs > 0,
        minutes: Math.floor(remainingMs / 60000),
        seconds: Math.floor((remainingMs % 60000) / 1000),
      });

      // Redirect if time expired
      if (remainingMs <= 0) {
        toast.warning('Edit window has expired');
        router.push(`/requests/${id}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [request, id, router]);

  const handleSave = async () => {
    if (!context.trim()) {
      toast.error('Context is required');
      return;
    }

    if (!category) {
      toast.error('Category is required');
      return;
    }

    setSaving(true);
    try {
      // Update request via API
      const res = await fetch(`/api/requests/${id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: context.trim(),
          category,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save changes');
      }

      toast.success('Request updated successfully');
      router.push(`/requests/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-red-900 mb-2">Cannot Edit Request</h1>
            <p className="text-red-700 mb-6">{error}</p>
            <Link
              href={`/requests/${id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Request
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/requests/${id}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Request
          </Link>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Edit Request</h1>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              <Clock className="h-4 w-4" />
              {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')} left
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            You can edit your request within 5 minutes of creation, before any verdicts are received.
          </p>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition ${
                    category === cat.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="font-medium text-gray-900">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question / Context
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={5}
              maxLength={5000}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder="What would you like feedback on?"
            />
            <p className="mt-1 text-sm text-gray-500">
              {context.length}/5000 characters
            </p>
          </div>

          {/* Media preview (read-only) */}
          {request?.media_type === 'photo' && request?.media_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media (cannot be changed)
              </label>
              <div className="relative max-w-xs">
                <Image
                  src={request.media_url}
                  alt="Submission"
                  width={320}
                  height={240}
                  className="w-full rounded-xl border border-gray-200 opacity-75"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-3 py-1 bg-gray-900/75 text-white text-sm rounded-full">
                    Cannot edit media
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">What you can edit:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Question/context text</li>
                <li>Category selection</li>
              </ul>
              <p className="mt-2 text-blue-600">
                Media (photos/text submissions) cannot be changed after upload.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Link
              href={`/requests/${id}`}
              className="flex-1 px-4 py-3 text-center text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition min-h-[48px] flex items-center justify-center"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !context.trim() || !category}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
