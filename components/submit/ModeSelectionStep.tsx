'use client';

import { Coins, CheckCircle, Eye, Lock, Zap, ArrowRight } from 'lucide-react';

interface ModeSelectionStepProps {
  userCredits: number;
  privatePrice: string;
  onSelect: (mode: 'community' | 'private') => void;
}

export function ModeSelectionStep({ userCredits, privatePrice, onSelect }: ModeSelectionStepProps) {
  const hasCredits = userCredits > 0;

  return (
    <div className="p-8">
      {/* Credits Banner */}
      {hasCredits && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Coins className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-900">
                  You have {userCredits} free submission{userCredits !== 1 ? 's' : ''}!
                </h3>
                <p className="text-amber-700">Each credit = 1 submission with 3 feedback reports</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-amber-600">{userCredits}</div>
              <div className="text-xs text-amber-600 font-medium">CREDITS</div>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        {hasCredits ? 'Use your credit or pay instead?' : 'How would you like to get feedback?'}
      </h2>
      <p className="text-gray-600 mb-8">
        Both options get you 3 detailed feedback reports from real people.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Use Credit Option */}
        <div
          className={`border-2 rounded-2xl p-6 hover:shadow-lg transition-all relative ${
            hasCredits
              ? 'border-green-400 bg-green-50/50 ring-2 ring-green-200'
              : 'border-gray-200'
          }`}
        >
          {hasCredits && (
            <div className="absolute -top-3 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              RECOMMENDED
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                hasCredits ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Coins className={`h-6 w-6 ${hasCredits ? 'text-green-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {hasCredits ? 'Use 1 Credit' : 'Use Credits'}
              </h3>
              <p className={hasCredits ? 'text-green-600 font-medium' : 'text-gray-500'}>
                {hasCredits ? 'Free - no payment needed' : 'Earn credits first'}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                {hasCredits
                  ? `Uses 1 of your ${userCredits} credits`
                  : 'Judge 3 submissions to earn 1 credit'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Get 3 honest feedback reports</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>Visible in community feed</span>
            </div>
          </div>

          <button
            onClick={() => onSelect('community')}
            className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              hasCredits
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {hasCredits ? (
              <>
                Use My Credit
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Earn Credits First
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {hasCredits && (
            <p className="text-center text-xs text-green-600 mt-3 font-medium">
              You'll have {userCredits - 1} credit{userCredits - 1 !== 1 ? 's' : ''} left after
              this
            </p>
          )}
        </div>

        {/* Pay Option */}
        <div className="border-2 border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Lock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Pay {privatePrice}</h3>
              <p className="text-purple-600">Private & priority</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Completely private submission</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Get 3 honest feedback reports</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-purple-600" />
              <span>Priority queue - faster results</span>
            </div>
          </div>

          <button
            onClick={() => onSelect('private')}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Pay {privatePrice}
            <ArrowRight className="h-4 w-4" />
          </button>

          {hasCredits && (
            <p className="text-center text-xs text-gray-500 mt-3">Save your credits for later</p>
          )}
        </div>
      </div>

      {/* Explainer */}
      {hasCredits && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            <span className="font-medium">How credits work:</span> You got {userCredits} credits
            when you signed up. Each credit = 1 free submission. Earn more by helping others
            with their decisions.
          </p>
        </div>
      )}
    </div>
  );
}
