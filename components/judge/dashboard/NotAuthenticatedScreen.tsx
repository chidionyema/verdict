'use client';

import { useRouter } from 'next/navigation';

interface NotAuthenticatedScreenProps {
  redirectPath: string;
}

export function NotAuthenticatedScreen({ redirectPath }: NotAuthenticatedScreenProps) {
  const router = useRouter();

  const handleSignUp = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('verdict_redirect_to', redirectPath);
    }
    router.push(`/auth/signup?redirect=${encodeURIComponent(redirectPath)}`);
  };

  const handleSignIn = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('verdict_redirect_to', redirectPath);
    }
    router.push(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Become a Judge</h2>
        <p className="text-gray-600 mb-6">
          Sign in or create an account to start judging and earning credits.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleSignUp}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Sign Up to Judge
          </button>
          <button
            onClick={handleSignIn}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
