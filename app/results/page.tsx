'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Star, User, MapPin, ArrowLeft, Share2, CheckCircle } from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const currentRequest = useStore((state) => state.currentRequest);
  const user = useStore((state) => state.user);
  const [selectedVerdict, setSelectedVerdict] = useState(0);
  const [copied, setCopied] = useState(false);

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
        {/* Header / summary strip */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push('/my-requests')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to My Requests
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Your Verdict Results
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              3 expert judges reviewed your submission. Here&apos;s what they said.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm px-5 py-3 flex items-center gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Average rating
              </p>
              <p className="text-xl font-semibold text-indigo-600 flex items-center gap-1">
                {averageRating.toFixed(1)}
                <span className="text-xs text-gray-500">/10</span>
              </p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Verdicts received
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {currentRequest.verdicts.length} judge
                {currentRequest.verdicts.length !== 1 ? 's' : ''}
              </p>
            </div>
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
                  selectedVerdict === index ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'
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

                <p className="text-gray-700 mb-4 whitespace-pre-line leading-relaxed">
                  {verdict.feedback}
                </p>

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

        {/* Next actions / share */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/start')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition cursor-pointer flex items-center gap-2"
            >
              Get Another Verdict
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition cursor-pointer flex items-center gap-2"
            >
              Download as PDF
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                } catch {
                  // ignore
                }
              }}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Copy share link</span>
            </button>
            {copied && (
              <span className="inline-flex items-center text-xs text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Link copied
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
