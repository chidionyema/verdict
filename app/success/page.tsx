'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Clock, Star, TrendingUp } from 'lucide-react';
import OutcomePrediction from '@/components/OutcomePrediction';
import ViralGrowthHub from '@/components/ViralGrowthHub';
import QualityScoring from '@/components/QualityScoring';
import { RealTimeWaitingStatus } from '@/components/request/RealTimeWaitingStatus';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [requestData, setRequestData] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    // Get request data from URL params or localStorage
    const category = searchParams.get('category') || 'appearance';
    const mediaType = searchParams.get('mediaType') || 'photo';
    const context = searchParams.get('context') || '';
    const requestId = searchParams.get('requestId') || 'req_' + Date.now();

    setRequestData({
      category,
      mediaType,
      context,
      requestId,
      estimatedRating: 8.5
    });

    // Show analytics after a brief moment
    setTimeout(() => setShowAnalytics(true), 2000);
  }, [searchParams]);

  const handleRequestComplete = () => {
    // Redirect to request detail page when complete
    if (requestData?.requestId) {
      router.push(`/requests/${requestData.requestId}`);
    }
  };

  if (!requestData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Request submitted successfully!
          </h1>
          <p className="text-lg text-gray-600">
            Your {requestData.category} request is now in our expert queue
          </p>
        </div>

        {/* Real-Time Waiting Status */}
        <RealTimeWaitingStatus
          requestId={requestData.requestId}
          targetCount={3}
          initialCount={0}
          onComplete={handleRequestComplete}
          className="mb-8"
        />

        {/* Analytics Section - Shows after delay */}
        {showAnalytics && (
          <div className="space-y-6">
            {/* Outcome Prediction */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Outcome Analysis</h3>
                <button 
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {showAnalytics ? 'Hide' : 'Show'} details
                </button>
              </div>
              <OutcomePrediction
                category={requestData.category}
                mediaType={requestData.mediaType}
                context={requestData.context}
                contextLength={requestData.context.length}
                hasGoodLighting={true}
              />
            </div>

            {/* Quality Analysis */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Quality Analysis</h3>
              <QualityScoring
                mediaType={requestData.mediaType}
                content={requestData.mediaType === 'text' ? requestData.context : null}
                context={requestData.context}
                category={requestData.category}
              />
            </div>

            {/* Viral Growth Hub */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Journey</h3>
              <ViralGrowthHub
                requestId={requestData.requestId}
                verdictRating={requestData.estimatedRating}
                category={requestData.category}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/my-requests"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-center"
          >
            View all my requests
          </a>
          <a
            href="/start"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-center"
          >
            Submit another request
          </a>
        </div>

        {/* Improvement Tips */}
        <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-purple-900 mb-2">
              Keep improving!
            </h4>
            <p className="text-purple-700 mb-4">
              The more specific context you provide, the better feedback you'll receive.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-800">
              <div className="bg-white/50 rounded-lg p-3">
                <p className="font-medium">💡 Be specific</p>
                <p>Include your goal, timeline, and audience</p>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <p className="font-medium">📸 Good lighting</p>
                <p>Natural light gives the best feedback</p>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <p className="font-medium">🎯 Clear questions</p>
                <p>Ask what you really want to know</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}