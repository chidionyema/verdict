'use client';

import { useState } from 'react';

export default function RLSDebugPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/debug/rls-test', { method: 'POST' });
      const data = await res.json();
      setResults(data);
    } catch (error) {
      setResults({ error: 'Failed to run test' });
    }
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">RLS Debug Test</h1>
        
        <div className="mb-6">
          <button
            onClick={runTest}
            disabled={testing}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Run RLS Test'}
          </button>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Test Results</h2>
            
            {results.error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                Error: {results.error}
              </div>
            )}

            {results.results && (
              <>
                <div className="mb-4">
                  <strong>User:</strong> {results.results.user.email}
                </div>

                <div className="space-y-4 mb-6">
                  {results.results.tests.map((test: any, i: number) => (
                    <div key={i} className={`p-3 rounded ${test.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="font-semibold flex items-center">
                        <span className={test.success ? 'text-green-600' : 'text-red-600'}>
                          {test.success ? '✓' : '✗'}
                        </span>
                        <span className="ml-2">{test.test}</span>
                      </div>
                      
                      {test.error && (
                        <div className="text-red-600 text-sm mt-1">
                          Error: {test.error}
                        </div>
                      )}
                      
                      {test.sql && (
                        <div className="text-gray-600 text-sm mt-1 font-mono">
                          SQL: {test.sql}
                        </div>
                      )}
                      
                      {test.data && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer">View Data</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(test.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>

                {results.summary && (
                  <div className="bg-blue-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <div className="text-sm space-y-1">
                      <div>Profile Exists: {results.summary.profileExists ? 'Yes' : 'No'}</div>
                      <div>Has Credits: {results.summary.hasCredits ? 'Yes' : 'No'}</div>
                      <div>Can Update Profile: {results.summary.canUpdateProfile ? 'Yes' : 'No'}</div>
                      <div>Policy Count: {results.summary.policyCount}</div>
                    </div>
                    <div className="mt-3 font-medium">
                      {results.summary.recommendation}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}