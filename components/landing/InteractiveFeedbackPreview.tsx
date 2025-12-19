'use client';

import { useState } from 'react';
import { Star, Eye, Play, CheckCircle, Clock, Users } from 'lucide-react';
import { APP_CONFIG, COMPUTED_CONFIG } from '@/lib/app-config';
import { useLocalizedPricing } from '@/hooks/use-pricing';

interface FeedbackSample {
  id: string;
  category: string;
  question: string;
  rating: number;
  feedback: string;
  improvements: string[];
}

// Example feedback to show the quality - clearly labeled as samples
const SAMPLE_FEEDBACK: FeedbackSample[] = [
  {
    id: '1',
    category: 'Dating Profile',
    question: 'Does this dating app photo make a good first impression?',
    rating: 8.3,
    feedback: "Strong photo! Your genuine smile is immediately engaging, and the natural lighting works perfectly. The background shows you're active without being distracting. Only suggestion: try a slightly closer crop to make you the clear focal point. This would definitely get matches!",
    improvements: ['Crop slightly closer', 'Natural lighting works great', 'Shows personality well']
  },
  {
    id: '2',
    category: 'Interview Outfit',
    question: 'Is this outfit appropriate for a tech startup interview?',
    rating: 9.1,
    feedback: "Perfect balance for a startup! The blazer shows professionalism while the jeans keep it approachable - exactly what tech companies want. The shoes tie it together nicely. You'll fit right in with the culture while showing you take the role seriously. Confident choice!",
    improvements: ['Great culture fit', 'Professional yet approachable', 'Shows good judgment']
  },
  {
    id: '3',
    category: 'Writing Sample',
    question: 'How does this email sound for reaching out to potential clients?',
    rating: 7.6,
    feedback: "Good foundation with a clear value proposition. Your opening hooks attention and the benefits are concrete. To improve: shorten the first paragraph (people skim emails) and add a specific next step instead of 'let me know your thoughts.' Maybe suggest a 15-min call? Overall, professional and compelling.",
    improvements: ['Shorten opening paragraph', 'Add specific call-to-action', 'Value proposition is clear']
  }
];

export function InteractiveFeedbackPreview() {
  const [selectedSample, setSelectedSample] = useState<FeedbackSample>(SAMPLE_FEEDBACK[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const pricing = useLocalizedPricing();

  const handlePreview = (sample: FeedbackSample) => {
    setSelectedSample(sample);
    setIsPlaying(true);
    
    // Simulate live feedback arrival
    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Play className="h-4 w-4" />
            Interactive Demo
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            See Exactly What You'll Get
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Example feedback to show you the quality and depth of insights. Click any example to explore.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sample Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Try These Examples:</h3>
            {SAMPLE_FEEDBACK.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handlePreview(sample)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                  selectedSample.id === sample.id
                    ? 'border-indigo-200 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-indigo-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {sample.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-bold text-sm">{sample.rating}/10</span>
                  </div>
                </div>
                <p className="font-medium text-gray-900 text-sm line-clamp-2">
                  {sample.question}
                </p>
                <p className="text-xs text-indigo-600 mt-2 font-medium">
                  Click to see example feedback →
                </p>
              </button>
            ))}
          </div>

          {/* Preview Display */}
          <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 transition-all duration-500 ${
            isPlaying ? 'scale-105 shadow-2xl' : ''
          }`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                  {selectedSample.category}
                </span>
                {isPlaying && (
                  <div className="flex items-center gap-2 text-indigo-600">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Loading example...</span>
                  </div>
                )}
                {!isPlaying && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    Example
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                {selectedSample.question}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-bold">{selectedSample.rating}/10</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span>{APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION} reviews per submission</span>
                </div>
              </div>
            </div>

            {/* Feedback Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Detailed Feedback</h4>
                  <p className={`text-gray-700 leading-relaxed transition-all duration-1000 ${
                    isPlaying ? 'opacity-50' : 'opacity-100'
                  }`}>
                    {selectedSample.feedback}
                  </p>
                </div>

                {/* Key Improvements */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Key Takeaways
                  </h4>
                  <ul className="space-y-2">
                    {selectedSample.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Feedback quality score</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${selectedSample.rating * 10}%` }}
                    ></div>
                  </div>
                  <span className="font-medium">{(selectedSample.rating * 10).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-3">
              Ready for Your Own Feedback?
            </h3>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              {COMPUTED_CONFIG.FEEDBACK_GUARANTEE_TEXT} with this same level of detail and insight.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <button
                onClick={() => window.location.href = '/feed'}
                className="flex-1 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Eye className="h-5 w-5" />
                {COMPUTED_CONFIG.JUDGE_EARNING_TEXT}
              </button>
              <button
                onClick={() => window.location.href = '/start'}
                className="flex-1 bg-indigo-800 border-2 border-white/30 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-900 transition-all duration-300"
              >
                Submit Privately ({pricing.privatePrice})
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}