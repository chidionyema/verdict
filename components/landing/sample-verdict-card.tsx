'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, CheckCircle, AlertCircle, Heart } from 'lucide-react';

interface VerdictExample {
  rating: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
  tone: 'encouraging' | 'honest' | 'constructive';
}

const SAMPLE_VERDICTS: VerdictExample[] = [
  {
    rating: 8.5,
    strengths: ['Professional color choice', 'Perfect fit', 'Confident posture'],
    improvements: ['Add a subtle accessory', 'Consider a slightly darker shade'],
    recommendation: 'This outfit is excellent for the interview. You will make a strong first impression.',
    tone: 'constructive'
  },
  {
    rating: 7.0,
    strengths: ['Good lighting', 'Clear facial features'],
    improvements: ['Group shot reduces focus on you', 'Second photo has better background'],
    recommendation: 'Use the second photo as your main profile picture. The solo shot makes you stand out better.',
    tone: 'honest'
  },
  {
    rating: 9.0,
    strengths: ['Clear and professional tone', 'Concise without being abrupt'],
    improvements: ['Could add one specific example'],
    recommendation: 'This email strikes the right balance. Send it with confidence!',
    tone: 'encouraging'
  }
];

export function SampleVerdictCard() {
  return (
    <div className="py-16 bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            See What You'll Get
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Every request receives 3 comprehensive feedback reports. Here's what they look like:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {SAMPLE_VERDICTS.map((verdict, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Reviewer {String.fromCharCode(65 + index)}</div>
                      <div className="text-xs text-gray-500">Verified • 4.8★</div>
                    </div>
                  </div>
                  <Badge className={`${
                    verdict.tone === 'encouraging' ? 'bg-green-100 text-green-800' :
                    verdict.tone === 'honest' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {verdict.tone}
                  </Badge>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-2xl font-bold text-gray-900">{verdict.rating}/10</span>
                    <span className="text-sm text-gray-500">Overall Rating</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${verdict.rating * 10}%` }}
                    />
                  </div>
                </div>

                {/* Strengths */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-900">Strengths</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {verdict.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-gray-700">• {strength}</li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">Could Improve</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {verdict.improvements.map((improvement, i) => (
                      <li key={i} className="text-sm text-gray-700">• {improvement}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommendation */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-800 italic">{verdict.recommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            ✨ Each report includes a rating, specific strengths, actionable improvements, and a clear recommendation.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            All feedback is anonymous and reviewed for quality before delivery.
          </p>
        </div>
      </div>
    </div>
  );
}

