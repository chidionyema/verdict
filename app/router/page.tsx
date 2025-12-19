'use client';

/**
 * Smart Router Testing Interface
 * 
 * This page allows testing the smart routing logic in development.
 * Accessible at /router - provides a UI to test different routing scenarios.
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getDestination, type RoutingDecision, type UserProfile } from '@/lib/routing';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ArrowRight, User as UserIcon, Settings, TestTube } from 'lucide-react';

const testScenarios = [
  { path: '/', label: 'Home Page' },
  { path: '/start', label: 'Start Page' },
  { path: '/submit', label: 'Submit Page' },
  { path: '/judge', label: 'Judge Page' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/my-requests', label: 'My Requests' },
  { path: '/feed', label: 'Feed' },
  { path: '/admin', label: 'Admin (requires admin role)' },
];

const mockUserProfiles: { [key: string]: Partial<UserProfile> } = {
  new_user: {
    onboarding_completed: false,
    credits: 0,
    total_submissions: 0,
    total_judgments: 0,
    has_completed_tutorial: false,
  },
  returning_user: {
    onboarding_completed: true,
    credits: 2,
    total_submissions: 3,
    total_judgments: 8,
    preferred_path: 'community',
  },
  premium_user: {
    onboarding_completed: true,
    credits: 0,
    total_submissions: 15,
    total_judgments: 5,
    preferred_path: 'private',
    pricing_tier: 'premium',
  },
  judge_user: {
    onboarding_completed: true,
    credits: 5,
    total_submissions: 2,
    total_judgments: 50,
    judge_verified: true,
    role: 'judge',
  },
  admin_user: {
    onboarding_completed: true,
    credits: 10,
    total_submissions: 1,
    total_judgments: 20,
    role: 'admin',
  },
};

export default function RouterTestPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>('new_user');
  const [testResults, setTestResults] = useState<{ [key: string]: RoutingDecision }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [supabase]);

  const runSingleTest = async (path: string) => {
    setIsLoading(true);
    try {
      const mockProfile = mockUserProfiles[selectedProfile] as UserProfile;
      const decision = await getDestination(
        path,
        selectedProfile === 'unauthenticated' ? null : (currentUser || { id: 'test-user' } as User),
        selectedProfile === 'unauthenticated' ? null : mockProfile
      );
      
      setTestResults(prev => ({
        ...prev,
        [path]: decision
      }));
    } catch (error) {
      console.error('Test error:', error);
    }
    setIsLoading(false);
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults({});
    
    for (const scenario of testScenarios) {
      await runSingleTest(scenario.path);
    }
    setIsLoading(false);
  };

  const getResultColor = (reason: string) => {
    if (reason.includes('redirect') || reason.includes('authentication_required')) {
      return 'text-blue-600 bg-blue-50';
    }
    if (reason.includes('onboarding')) {
      return 'text-yellow-600 bg-yellow-50';
    }
    if (reason.includes('error') || reason.includes('missing')) {
      return 'text-red-600 bg-red-50';
    }
    return 'text-green-600 bg-green-50';
  };

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Router Test Page</h1>
          <p className="text-gray-600">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <TestTube className="h-8 w-8 text-indigo-600" />
            Smart Router Testing
          </h1>
          <p className="text-gray-600">
            Test the smart routing logic with different user profiles and scenarios.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Test User Profile
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={() => setSelectedProfile('unauthenticated')}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  selectedProfile === 'unauthenticated'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Unauthenticated</div>
                <div className="text-sm text-gray-500">No login, public access only</div>
              </button>

              {Object.entries(mockUserProfiles).map(([key, profile]) => (
                <button
                  key={key}
                  onClick={() => setSelectedProfile(key)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedProfile === key
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium capitalize">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {profile.credits} credits • {profile.total_submissions} submissions • {profile.total_judgments} judgments
                    {profile.role && ` • ${profile.role}`}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={runAllTests}
              disabled={isLoading}
              className="w-full mt-6 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {isLoading ? 'Testing...' : 'Run All Tests'}
            </button>
          </div>

          {/* Test Scenarios */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Test Scenarios</h2>
            
            <div className="space-y-4">
              {testScenarios.map((scenario) => {
                const result = testResults[scenario.path];
                
                return (
                  <div key={scenario.path} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{scenario.label}</span>
                        <span className="text-sm text-gray-500 ml-2">({scenario.path})</span>
                      </div>
                      <button
                        onClick={() => runSingleTest(scenario.path)}
                        disabled={isLoading}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                      >
                        Test
                      </button>
                    </div>
                    
                    {result && (
                      <div className="mt-3 p-3 rounded-lg border-l-4 border-l-indigo-500 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRight className="h-4 w-4 text-indigo-600" />
                          <span className="font-medium">→ {result.destination}</span>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getResultColor(result.reason)}`}>
                          {result.reason}
                        </div>
                        {result.params && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Params:</strong> {JSON.stringify(result.params)}
                          </div>
                        )}
                        {result.onboardingStep && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Onboarding Step:</strong> {result.onboardingStep}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current User Info */}
        {currentUser && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Current Session</h2>
            <div className="text-sm text-gray-600">
              <p><strong>User ID:</strong> {currentUser.id}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Profile:</strong> Testing with "{selectedProfile}" profile</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              Back to App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}