'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, Users, Target, Trophy } from 'lucide-react';
import { usePrivatePrice } from '@/hooks/use-pricing';

export default function EarnCreditsPage() {
  const router = useRouter();
  const privatePrice = usePrivatePrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="h-10 w-10 text-yellow-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Earn Credits to Submit
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Judge 3 submissions from the community to earn 1 credit for your own submission
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Progress</h2>
            <p className="text-gray-600">Judge others to unlock your submission</p>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Judgments Made</span>
              <span>0 / 3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500" style={{width: '0%'}}></div>
            </div>
          </div>
          
          {/* Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Users className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Judge Others</div>
              <div className="text-xs text-gray-600">Give honest feedback</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Reach 5 Judgments</div>
              <div className="text-xs text-gray-600">Build your reputation</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Trophy className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Earn 1 Credit</div>
              <div className="text-xs text-gray-600">Unlock free submission</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            How Community Judging Works
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">What You'll See</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Real people's dating profiles, outfits, career decisions</li>
                <li>• Anonymous submissions from the community</li>
                <li>• Photos, text, and questions needing honest feedback</li>
                <li>• Various categories: dating, career, style, decisions</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">What You'll Do</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Give honest thumbs up/down verdicts</li>
                <li>• Write helpful feedback (optional)</li>
                <li>• Rate on a scale of 1-10</li>
                <li>• Help others make better decisions</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-800 text-center">
              <strong>Quality matters!</strong> Thoughtful judgments help build your reputation as a trusted community member.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/feed')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 hover:from-indigo-700 hover:to-purple-700"
          >
            Start Judging Community
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Alternative Option */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Don't Want to Judge? Go Private
            </h3>
            <p className="text-purple-700 mb-4">
              Skip the judging requirement and submit privately for {privatePrice}
            </p>
            
            <button
              onClick={() => router.push('/start-simple?visibility=private')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Submit Privately
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom Help */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Questions? Check our{' '}
            <a href="/help" className="text-indigo-600 hover:text-indigo-700">
              help center
            </a>{' '}
            or learn more about{' '}
            <a href="/help" className="text-indigo-600 hover:text-indigo-700">
              how credits work
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}