'use client';

import { Zap, ArrowRight, CheckCircle, TrendingUp } from 'lucide-react';
import { SplitTestButton } from '@/components/features/SplitTestButton';

export function SplitTestPromotion() {
  return (
    <div className="py-16 bg-gradient-to-br from-violet-50 to-purple-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-8 left-1/4 w-32 h-32 bg-violet-400 rounded-full mix-blend-multiply filter blur-xl" />
        <div className="absolute bottom-8 right-1/4 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Zap className="h-4 w-4" />
            NEW FEATURE
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Can't decide between two photos?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload both and get expert feedback on which one works better. Perfect for dating profiles, 
            LinkedIn headshots, or any tough decision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Features */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 rounded-full p-3 flex-shrink-0">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Side-by-side comparison
                  </h3>
                  <p className="text-gray-600">
                    Judges see both photos at once and tell you which one performs better and why.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-purple-100 rounded-full p-3 flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Clear winner declared
                  </h3>
                  <p className="text-gray-600">
                    No more guessing. Get a definitive answer on which photo gets better results.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-purple-100 rounded-full p-3 flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Detailed improvement tips
                  </h3>
                  <p className="text-gray-600">
                    Learn exactly why one photo outperforms the other and how to improve both.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-purple-200 shadow-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Perfect for:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Dating profiles
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  LinkedIn headshots  
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Outfit choices
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Product photos
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Visual mockup */}
          <div className="relative">
            {/* Split test visual mockup */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Split Test Results</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-400">A</span>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    32%
                  </div>
                </div>
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-purple-600">B</span>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    68% ✓
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="font-semibold text-green-800 mb-1">Photo B wins!</div>
                  <p className="text-green-700">Better lighting and more confident pose</p>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="font-medium text-gray-800 mb-1">Key differences:</div>
                  <ul className="text-gray-600 text-xs space-y-1">
                    <li>• Better eye contact in Photo B</li>
                    <li>• More flattering angle</li>
                    <li>• Professional background</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              NEW
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white border border-purple-200 rounded-lg px-3 py-2 shadow-lg">
              <div className="text-xs text-gray-500">Results in</div>
              <div className="text-sm font-semibold text-purple-600">30 minutes</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <SplitTestButton 
            category="general"
            variant="default"
            className="text-lg px-8 py-4"
          />
          <p className="text-sm text-gray-500 mt-3">
            Only 1 credit • Same as regular feedback • 3x more decisive
          </p>
        </div>
      </div>
    </div>
  );
}