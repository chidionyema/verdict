'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Star, User, MapPin } from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const currentRequest = useStore((state) => state.currentRequest);
  const user = useStore((state) => state.user);
  const [selectedVerdict, setSelectedVerdict] = useState(0);

  useEffect(() => {
    if (!currentRequest || !user) {
      router.push('/');
    }
  }, [currentRequest, user, router]);

  if (!currentRequest || !user) {
    return null;
  }

  const averageRating =
    currentRequest.verdicts.length > 0
      ? currentRequest.verdicts.reduce((sum, v) => sum + (v.rating || 0), 0) /
        currentRequest.verdicts.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Your Verdict Results
          </h1>
          <div className="flex items-center justify-center space-x-6 text-gray-600">
            <span>Average Rating: {averageRating.toFixed(1)}/10</span>
            <span>-</span>
            <span>{currentRequest.verdicts.length} Judges</span>
            <span>-</span>
            <span>Credits remaining: {user.credits - 1}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Media Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="font-semibold mb-4">Your Submission</h3>
              {currentRequest.mediaType === 'image' ? (
                <img
                  src={currentRequest.mediaUrl}
                  alt="Your submission"
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm">{currentRequest.mediaUrl}</p>
                </div>
              )}
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Category:</strong> {currentRequest.category}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Context:</strong> {currentRequest.context}
                </p>
              </div>
            </div>
          </div>

          {/* Verdicts List */}
          <div className="lg:col-span-2 space-y-4">
            {currentRequest.verdicts.map((verdict, index) => (
              <div
                key={verdict.id}
                className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer transition ${
                  selectedVerdict === index ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => setSelectedVerdict(index)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 rounded-full p-3">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Anonymous Judge #{index + 1}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                        <span>{verdict.demographics.ageRange}</span>
                        <span>-</span>
                        <span>{verdict.demographics.gender}</span>
                        <span>-</span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {verdict.demographics.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  {verdict.rating && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        {verdict.rating}/10
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < verdict.rating! / 2
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 mb-4">{verdict.feedback}</p>

                <div className="flex items-center justify-between text-sm">
                  <span
                    className={`px-3 py-1 rounded-full ${
                      verdict.tone === 'encouraging'
                        ? 'bg-green-100 text-green-700'
                        : verdict.tone === 'honest'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {verdict.tone}
                  </span>

                  <button className="text-gray-500 hover:text-indigo-600 cursor-pointer">
                    Rate helpfulness
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 text-center">
          <button
            onClick={() => router.push('/upload')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition mr-4 cursor-pointer"
          >
            Get Another Verdict
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition cursor-pointer"
          >
            Download Results
          </button>
        </div>
      </div>
    </div>
  );
}
