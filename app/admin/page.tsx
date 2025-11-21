'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Flag, Eye, Trash2 } from 'lucide-react';

interface FlaggedItem {
  id: string;
  type: 'request' | 'response';
  created_at: string;
  flagged_reason: string | null;
  category?: string;
  feedback?: string;
  context?: string;
}

export default function AdminPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          setIsAdmin(true);
          await fetchFlaggedItems();
        }
      }
    } catch (error) {
      console.error('Error checking admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlaggedItems = async () => {
    try {
      // Fetch flagged requests
      const { data: requests } = await supabase
        .from('verdict_requests')
        .select('id, created_at, flagged_reason, category, context')
        .eq('is_flagged', true)
        .order('created_at', { ascending: false });

      // Fetch flagged responses
      const { data: responses } = await supabase
        .from('verdict_responses')
        .select('id, created_at, flagged_reason, feedback')
        .eq('is_flagged', true)
        .order('created_at', { ascending: false });

      const items: FlaggedItem[] = [
        ...(requests || []).map((r) => ({ ...r, type: 'request' as const })),
        ...(responses || []).map((r) => ({ ...r, type: 'response' as const })),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFlaggedItems(items);
    } catch (error) {
      console.error('Error fetching flagged items:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Flagged Items */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <Flag className="h-5 w-5 text-red-500 mr-2" />
              <h2 className="text-xl font-semibold">Flagged Content</h2>
            </div>
          </div>
          <div className="p-6">
            {flaggedItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No flagged content to review.
              </p>
            ) : (
              <div className="space-y-4">
                {flaggedItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.type === 'request'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {item.type === 'request' ? 'Request' : 'Response'}
                        </span>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {item.flagged_reason && (
                      <p className="text-sm text-red-600 mt-2">
                        Reason: {item.flagged_reason}
                      </p>
                    )}
                    <p className="text-gray-700 mt-2 line-clamp-2">
                      {item.context || item.feedback || '-'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
