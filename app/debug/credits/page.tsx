'use client';

import { useState, useEffect } from 'react';
import { TouchButton } from '@/components/ui/touch-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugCreditsPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/debug/credits');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Failed to fetch debug info:', error);
      setDebugInfo({ error: 'Failed to fetch debug info' });
    } finally {
      setLoading(false);
    }
  };

  const fixCredits = async () => {
    setFixing(true);
    try {
      const response = await fetch('/api/debug/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credits: 3 }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Credits fixed! You now have 3 credits.');
        fetchDebugInfo(); // Refresh
      } else {
        alert('❌ Failed to fix credits: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Error: ' + error);
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Loading debug info...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔧 Credits Debug Page</h1>
      
      <div className="space-y-6">
        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debugInfo?.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800"><strong>❌ Error:</strong> {debugInfo.error}</p>
                  {debugInfo.details && (
                    <p className="text-red-600 text-sm mt-2">{JSON.stringify(debugInfo.details)}</p>
                  )}
                </div>
              ) : debugInfo?.currentUser ? (
                <>
                  <p><strong>User ID:</strong> {debugInfo.currentUser.id || 'Not logged in'}</p>
                  <p><strong>Email:</strong> {debugInfo.currentUser.email || 'Not available'}</p>
                  <p><strong>Has Profile:</strong> {debugInfo.currentUser.hasProfile ? '✅ Yes' : '❌ No'}</p>
                  
                  {debugInfo.currentUser.profile ? (
                    <>
                      <p><strong>Credits:</strong> 
                        <span className={`ml-2 font-bold ${
                          debugInfo.currentUser.profile.credits >= 1 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {debugInfo.currentUser.profile.credits}
                        </span>
                      </p>
                      <p><strong>Profile Created:</strong> {new Date(debugInfo.currentUser.profile.created_at).toLocaleString()}</p>
                    </>
                  ) : (
                    <p className="text-red-600"><strong>❌ No profile found! This is the issue.</strong></p>
                  )}
                </>
              ) : (
                <p className="text-red-600">❌ No user data available. You may not be logged in.</p>
              )}
            </div>

            <div className="mt-4 flex gap-4">
              <TouchButton 
                onClick={fixCredits} 
                disabled={fixing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {fixing ? 'Fixing...' : '🔧 Give Me 3 Free Credits'}
              </TouchButton>
              
              <TouchButton 
                onClick={fetchDebugInfo} 
                variant="outline"
              >
                🔄 Refresh
              </TouchButton>
            </div>
          </CardContent>
        </Card>

        {/* All Users Debug */}
        {debugInfo && debugInfo.allRecentUsers && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Users (Debug)</CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.allRecentUsers.length === 0 ? (
                <p>No users found in database.</p>
              ) : (
                <div className="space-y-2">
                  {debugInfo.allRecentUsers.map((user: any) => (
                    <div key={user.id} className="p-2 border rounded text-sm">
                      <span className="font-mono">{user.email}</span> - 
                      <span className={`ml-2 font-bold ${
                        user.credits >= 1 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {user.credits} credits
                      </span>
                      <span className="text-gray-500 ml-2">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 How to Fix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Issue:</strong> New users aren't getting their 3 free credits automatically.</p>
              <p><strong>Quick Fix:</strong> Click "Give Me 3 Free Credits" above.</p>
              <p><strong>Long-term Fix:</strong> Run the SQL migration to fix the database trigger.</p>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-semibold">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Click the fix button above to get your 3 credits</li>
                  <li>Go back to the upload page and try creating a request</li>
                  <li>It should work now!</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}