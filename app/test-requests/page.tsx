'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestRequestsPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testDirectQuery();
  }, []);

  const testDirectQuery = async () => {
    const supabase = createClient();
    
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setResults({ error: 'Not authenticated', authError });
        setLoading(false);
        return;
      }

      console.log('Testing direct query for user:', user.id);

      // Direct database query
      const { data: requests, error, count } = await supabase
        .from('verdict_requests')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      console.log('Direct query result:', { requests, error, count });

      // Also query all requests to see if any exist
      const { data: allRequests, count: totalCount } = await supabase
        .from('verdict_requests')
        .select('user_id, id, created_at, category, context', { count: 'exact' })
        .limit(10);

      console.log('All requests in database:', { allRequests, totalCount });

      setResults({
        user: { id: user.id, email: user.email },
        myRequests: requests || [],
        myRequestsCount: count || 0,
        allRequests: allRequests || [],
        totalRequestsInDB: totalCount || 0,
        error: error
      });

    } catch (err) {
      console.error('Test error:', err);
      setResults({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Testing database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Database Test Results</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <pre className="text-xs whitespace-pre-wrap overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>

        <div className="mt-6">
          <button
            onClick={testDirectQuery}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Run Test Again
          </button>
        </div>
      </div>
    </div>
  );
}