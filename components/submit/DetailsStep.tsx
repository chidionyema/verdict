'use client';

import { ArrowRight, Type, Upload, Zap, Scale, CheckCircle, Coins } from 'lucide-react';
import { ComparisonButton } from '@/components/comparison/ComparisonButton';
import { CATEGORIES, type SubmissionData } from './types';

interface DetailsStepProps {
  submissionData: SubmissionData;
  setSubmissionData: (data: SubmissionData) => void;
  onNext: () => void;
  userCredits: number;
}

export function DetailsStep({
  submissionData,
  setSubmissionData,
  onNext,
  userCredits,
}: DetailsStepProps) {
  const isDisabled =
    !submissionData.category ||
    !submissionData.question.trim() ||
    submissionData.question.trim().length < 10 ||
    !submissionData.context.trim() ||
    submissionData.context.trim().length < 20;

  return (
    <div className="p-8">
      {/* Credit Balance */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">What would you like feedback on?</h2>
          <p className="text-gray-600 mt-1">
            Tell us about your situation and we'll get you honest opinions from real people.
          </p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <div
            className={`px-4 py-2 rounded-xl ${
              userCredits > 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Coins
                className={`h-5 w-5 ${userCredits > 0 ? 'text-green-600' : 'text-amber-600'}`}
              />
              <span
                className={`font-bold ${userCredits > 0 ? 'text-green-700' : 'text-amber-700'}`}
              >
                {userCredits}
              </span>
              <span
                className={`text-sm ${userCredits > 0 ? 'text-green-600' : 'text-amber-600'}`}
              >
                credit{userCredits !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">1 credit = 1 submission</p>
          </div>
        </div>
      </div>

      {/* Category Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSubmissionData({ ...submissionData, category: category.id })}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                submissionData.category === category.id
                  ? `border-transparent shadow-xl scale-105 ${category.bgColor}`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg bg-white'
              }`}
            >
              {submissionData.category === category.id && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-5`}
                />
              )}

              <div
                className={`relative w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all ${
                  submissionData.category === category.id
                    ? `bg-gradient-to-br ${category.gradient} shadow-lg`
                    : 'bg-gray-100 group-hover:bg-gray-200'
                }`}
              >
                <span
                  className={`text-xl ${
                    submissionData.category === category.id ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {category.icon}
                </span>
              </div>

              <div className="relative">
                <h3
                  className={`font-bold text-lg mb-2 transition-colors ${
                    submissionData.category === category.id
                      ? category.iconColor
                      : 'text-gray-900 group-hover:text-gray-700'
                  }`}
                >
                  {category.name}
                </h3>
                <p
                  className={`text-sm transition-colors ${
                    submissionData.category === category.id
                      ? 'text-gray-700'
                      : 'text-gray-500 group-hover:text-gray-600'
                  }`}
                >
                  {category.description}
                </p>
              </div>

              {submissionData.category === category.id && (
                <div
                  className={`absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}
                >
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Question *</label>
        <input
          type="text"
          value={submissionData.question}
          onChange={(e) => setSubmissionData({ ...submissionData, question: e.target.value })}
          placeholder="What specific question do you want answered?"
          className={`w-full px-4 py-4 min-h-[48px] border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
            submissionData.question && submissionData.question.trim().length < 10
              ? 'border-amber-300 bg-amber-50'
              : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between mt-1">
          <span
            className={`text-xs ${
              submissionData.question && submissionData.question.trim().length < 10
                ? 'text-amber-600'
                : 'text-gray-500'
            }`}
          >
            {submissionData.question.trim().length < 10
              ? `${10 - submissionData.question.trim().length} more characters needed`
              : '✓ Good length'}
          </span>
          <span className="text-xs text-gray-400">{submissionData.question.length}/200</span>
        </div>
      </div>

      {/* Context */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Context *</label>
        <textarea
          value={submissionData.context}
          onChange={(e) => setSubmissionData({ ...submissionData, context: e.target.value })}
          placeholder="Provide any relevant background information..."
          rows={4}
          className={`w-full px-4 py-4 min-h-[120px] border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
            submissionData.context && submissionData.context.trim().length < 20
              ? 'border-amber-300 bg-amber-50'
              : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between mt-1">
          <span
            className={`text-xs ${
              submissionData.context && submissionData.context.trim().length < 20
                ? 'text-amber-600'
                : 'text-gray-500'
            }`}
          >
            {submissionData.context.trim().length < 20
              ? `${20 - submissionData.context.trim().length} more characters needed`
              : '✓ Good length'}
          </span>
          <span className="text-xs text-gray-400">{submissionData.context.length}/1000</span>
        </div>
      </div>

      {/* Media Type */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">Submission Type</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setSubmissionData({ ...submissionData, mediaType: 'text' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              submissionData.mediaType === 'text'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Type className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
            <div className="font-medium">Text Only</div>
            <div className="text-xs text-gray-500 mt-1">Written content</div>
          </button>
          <button
            onClick={() => setSubmissionData({ ...submissionData, mediaType: 'photo' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              submissionData.mediaType === 'photo'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
            <div className="font-medium">Single Photo</div>
            <div className="text-xs text-gray-500 mt-1">One image to review</div>
          </button>
          <button
            onClick={() => setSubmissionData({ ...submissionData, mediaType: 'split_test' })}
            className={`p-4 rounded-lg border-2 transition-all relative overflow-hidden ${
              submissionData.mediaType === 'split_test'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {submissionData.mediaType !== 'split_test' && (
              <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                NEW
              </div>
            )}
            <Zap
              className={`h-6 w-6 mx-auto mb-2 ${
                submissionData.mediaType === 'split_test' ? 'text-purple-600' : 'text-indigo-600'
              }`}
            />
            <div className="font-medium">Split Test</div>
            <div className="text-xs text-gray-500 mt-1">Compare 2 photos</div>
          </button>
          <button
            onClick={() => setSubmissionData({ ...submissionData, mediaType: 'comparison' })}
            className={`p-4 rounded-lg border-2 transition-all relative overflow-hidden ${
              submissionData.mediaType === 'comparison'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {submissionData.mediaType !== 'comparison' && (
              <div className="absolute top-2 right-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                PRO
              </div>
            )}
            <Scale
              className={`h-6 w-6 mx-auto mb-2 ${
                submissionData.mediaType === 'comparison' ? 'text-indigo-600' : 'text-gray-600'
              }`}
            />
            <div className="font-medium">Decision Comparison</div>
            <div className="text-xs text-gray-500 mt-1">A/B decision analysis</div>
          </button>
        </div>
      </div>

      {submissionData.mediaType === 'comparison' ? (
        <div className="space-y-3">
          <ComparisonButton
            category={submissionData.category}
            variant="default"
            className="w-full py-4 text-lg"
            initialQuestion={submissionData.question}
            initialContext={submissionData.context}
          />
          <p className="text-sm text-center text-gray-500">
            Click above to open the comparison wizard where you'll define your two options
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={onNext}
            disabled={isDisabled}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </button>
          {isDisabled && (
            <p className="text-xs text-amber-600 text-center">
              {!submissionData.category
                ? 'Select a category above to continue'
                : submissionData.question.trim().length < 10
                  ? 'Your question needs at least 10 characters'
                  : submissionData.context.trim().length < 20
                    ? 'Please add more context (at least 20 characters)'
                    : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
