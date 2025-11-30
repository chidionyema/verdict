'use client';

import { ArrowRight, TrendingUp, Star, Eye, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeAfterExample {
  category: 'dating' | 'career' | 'style';
  title: string;
  before: {
    rating: number;
    issue: string;
  };
  after: {
    rating: number;
    improvement: string;
  };
  testimonial: string;
  metric?: string;
}

const EXAMPLES: BeforeAfterExample[] = [
  {
    category: 'dating',
    title: 'Dating Profile Photo',
    before: {
      rating: 5.5,
      issue: 'Group photo, poor lighting, unclear face'
    },
    after: {
      rating: 8.5,
      improvement: 'Solo shot, better lighting, clear smile'
    },
    testimonial: 'Changed my main photo based on feedback. Got 3x more matches in the first week.',
    metric: '3x more matches'
  },
  {
    category: 'career',
    title: 'Resume Feedback',
    before: {
      rating: 6.0,
      issue: 'Too wordy, unclear achievements, generic summary'
    },
    after: {
      rating: 9.0,
      improvement: 'Concise bullet points, quantified results, targeted summary'
    },
    testimonial: 'The feedback helped me highlight my impact better. Got interviews at 2 of my top 3 companies.',
    metric: '2/3 interviews'
  },
  {
    category: 'style',
    title: 'Interview Outfit',
    before: {
      rating: 6.5,
      issue: 'Too casual, colors didn\'t match, wrong fit'
    },
    after: {
      rating: 9.5,
      improvement: 'Professional color combo, perfect fit, confident look'
    },
    testimonial: 'Realized my outfit was too casual. Got the job and felt much more confident.',
    metric: 'Got the job'
  }
];

export function BeforeAfterExamples() {
  return (
    <div className="py-16 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Real Results from Real Feedback
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how our feedback helps people make real improvements. These are anonymized examples from real users.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {EXAMPLES.map((example, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                {/* Category Badge */}
                <div className={`px-6 pt-6 pb-4 ${
                  example.category === 'dating' ? 'bg-pink-50' :
                  example.category === 'career' ? 'bg-blue-50' :
                  'bg-purple-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {example.category === 'dating' && <Camera className="w-5 h-5 text-pink-600" />}
                    {example.category === 'career' && <Star className="w-5 h-5 text-blue-600" />}
                    {example.category === 'style' && <Eye className="w-5 h-5 text-purple-600" />}
                    <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      {example.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{example.title}</h3>
                </div>

                <div className="p-6">
                  {/* Before/After Comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Before */}
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-xs font-semibold text-red-700 mb-2">Before</div>
                      <div className="text-2xl font-bold text-red-600 mb-2">
                        {example.before.rating}/10
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${example.before.rating * 10}%` }}
                        />
                      </div>
                      <p className="text-xs text-red-700 mt-2">{example.before.issue}</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>

                    {/* After */}
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 col-span-2">
                      <div className="text-xs font-semibold text-green-700 mb-2">After Feedback</div>
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {example.after.rating}/10
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${example.after.rating * 10}%` }}
                        />
                      </div>
                      <p className="text-xs text-green-700 mt-2">{example.after.improvement}</p>
                    </div>
                  </div>

                  {/* Improvement Metric */}
                  {example.metric && (
                    <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm font-bold text-indigo-900">{example.metric}</span>
                      </div>
                    </div>
                  )}

                  {/* Testimonial */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 italic">
                      "{example.testimonial}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            These examples are anonymized and based on real user feedback. Individual results may vary.
          </p>
        </div>
      </div>
    </div>
  );
}

