'use client';

import { useRouter } from 'next/navigation';
import { Award, ArrowRight } from 'lucide-react';

export function NotQualifiedScreen() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg">
        <div className="bg-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <Award className="h-10 w-10 text-indigo-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Become a Qualified Judge</h2>
        <p className="text-gray-600 mb-6">
          To maintain quality standards, all judges must complete a brief qualification process.
          This ensures you understand our guidelines and can provide valuable feedback.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">What's included:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Learn quality feedback guidelines</li>
            <li>• Quick 4-question quiz (75% to pass)</li>
            <li>• Takes about 5 minutes</li>
            <li>• Start earning immediately after</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/judge/qualify')}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center"
          >
            Start Qualification
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
