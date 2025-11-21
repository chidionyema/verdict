'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { DollarSign, TrendingUp, Clock, Award, ArrowRight } from 'lucide-react';

export default function JudgeDashboard() {
  const router = useRouter();
  const availableRequests = useStore((state) => state.availableRequests);
  const [earnings] = useState(47.5);
  const [qualityScore] = useState(4.6);
  const [totalVerdicts] = useState(95);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Judge Dashboard</h1>
          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Online
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today&apos;s Earnings</p>
                <p className="text-2xl font-bold">${earnings.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold">{qualityScore}/5.0</p>
              </div>
              <Award className="h-8 w-8 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Verdicts</p>
                <p className="text-2xl font-bold">{totalVerdicts}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">47s</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Available Requests */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Available Requests</h2>
            <p className="text-sm text-gray-500 mt-1">
              Click on a request to submit your verdict
            </p>
          </div>
          <div className="p-6">
            {availableRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No requests available right now.</p>
                <p className="text-gray-400 text-sm mt-2">
                  New requests come in every few seconds. Stay online!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:border-indigo-500 cursor-pointer transition group"
                    onClick={() => router.push(`/judge/verdict/${request.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold capitalize">
                            {request.category}
                          </p>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {request.mediaType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {request.context}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Claim window expires in 4:32
                        </p>
                      </div>
                      <div className="text-right flex items-center space-x-4">
                        <div>
                          <p className="text-lg font-semibold text-green-600">
                            $0.75
                          </p>
                          <p className="text-xs text-gray-500">
                            Potential earnings
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-indigo-50 rounded-lg p-6">
          <h3 className="font-semibold text-indigo-900 mb-3">Tips for Quality Verdicts</h3>
          <ul className="space-y-2 text-sm text-indigo-800">
            <li>- Be specific and constructive in your feedback</li>
            <li>- Consider the context provided by the seeker</li>
            <li>- Respond quickly to earn speed bonuses</li>
            <li>- Maintain a quality score above 4.0 for priority access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
