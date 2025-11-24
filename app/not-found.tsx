import Link from 'next/link';
import { Home, Search, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* 404 */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          Looks like you've wandered off the path. The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all"
          >
            <Search className="w-4 h-4" />
            View Dashboard
          </Link>
        </div>

        {/* Help text */}
        <p className="mt-8 text-sm text-gray-500">
          Need help?{' '}
          <Link href="/start" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Submit a request
          </Link>{' '}
          or check your{' '}
          <Link href="/account" className="text-indigo-600 hover:text-indigo-700 font-medium">
            account
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
