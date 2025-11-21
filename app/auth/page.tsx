'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

export default function AuthPage() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);
  const setCurrentRequest = useStore((state) => state.setCurrentRequest);
  const addAvailableRequest = useStore((state) => state.addAvailableRequest);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickAuth = async (method: string) => {
    setLoading(true);

    // Simulate auth delay
    setTimeout(() => {
      // Create user
      const user = {
        id: uuidv4(),
        email: method === 'email' ? email : `${method}@example.com`,
        credits: 3,
        role: 'seeker' as const,
      };
      setUser(user);

      // Create request from stored data
      let pendingData = {};
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('pendingRequest');
        if (stored) {
          pendingData = JSON.parse(stored);
        }
      }

      const request = {
        id: uuidv4(),
        mediaUrl: '',
        mediaType: 'image' as const,
        category: 'appearance',
        context: '',
        ...pendingData,
        status: 'pending' as const,
        verdicts: [],
        createdAt: new Date(),
      };

      setCurrentRequest(request);

      // Also add to available requests for demo judge view
      addAvailableRequest(request);

      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingRequest');
      }

      // Navigate to waiting room
      router.push('/waiting');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create your account to see results
          </h2>
          <p className="text-gray-600 mb-8">
            Your first 3 verdicts are free. No credit card required.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleQuickAuth('google')}
              disabled={loading}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleQuickAuth('apple')}
              disabled={loading}
              className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition cursor-pointer disabled:opacity-50"
            >
              Continue with Apple
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />

            <button
              onClick={() => handleQuickAuth('email')}
              disabled={loading || !email}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-300 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Continue with Email'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
