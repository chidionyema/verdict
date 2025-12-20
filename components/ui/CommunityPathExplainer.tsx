'use client';

import { useState } from 'react';
import { Heart, ArrowRight, Clock, Star, Users, Sparkles, CheckCircle } from 'lucide-react';

interface CommunityPathExplainerProps {
  isOpen: boolean;
  onClose: () => void;
  onChoosePath: (path: 'judge_first' | 'submit_first') => void;
  creditsNeeded: number;
}

export function CommunityPathExplainer({ 
  isOpen, 
  onClose, 
  onChoosePath, 
  creditsNeeded 
}: CommunityPathExplainerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 rounded-full p-2">
              <Heart className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Community Path - Free Feedback!</h2>
          </div>
          <p className="text-green-100">
            Get honest feedback without paying. You need <strong>{creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''}</strong> to submit your request.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Choose Your Path - Both Are Free!
            </h3>
            <p className="text-gray-600">
              You can earn credits by judging others, or submit now and judge later.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Judge First Path */}
            <button
              onClick={() => onChoosePath('judge_first')}
              className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-100 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 rounded-full p-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Judge {creditsNeeded} Request{creditsNeeded > 1 ? 's' : ''} First</h4>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Takes ~{creditsNeeded * 2} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Earn {creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Then submit your request</span>
                </div>
              </div>

              <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Best Choice</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  See how feedback works first, give better requests
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">Start Judging →</span>
                <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Submit First Path */}
            <button
              onClick={() => onChoosePath('submit_first')}
              className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 hover:border-purple-300 hover:bg-purple-100 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 rounded-full p-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Submit Now, Judge Later</h4>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Submit your request instantly</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Get in the review queue</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>See results after judging {creditsNeeded}</span>
                </div>
              </div>

              <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Quick Start</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Submit while inspired, judge when you have time
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700">Submit Request →</span>
                <ArrowRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* How it works */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">How Community Feedback Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-indigo-600">1</span>
                </div>
                <p className="font-medium text-gray-900">Judge Others</p>
                <p className="text-gray-600">Give honest feedback on {creditsNeeded} request{creditsNeeded > 1 ? 's' : ''}</p>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-indigo-600">2</span>
                </div>
                <p className="font-medium text-gray-900">Earn Credits</p>
                <p className="text-gray-600">Get {creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''} for quality feedback</p>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-indigo-600">3</span>
                </div>
                <p className="font-medium text-gray-900">Get Feedback</p>
                <p className="text-gray-600">Receive honest opinions on your request</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-green-600">100% Free</span> · No payment required
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}