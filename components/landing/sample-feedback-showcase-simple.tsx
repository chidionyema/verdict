'use client';

import { useState } from 'react';
import { 
  Star, 
  Clock, 
  CheckCircle, 
  Eye,
  Heart,
  Briefcase,
  Shirt,
  Users,
  Award,
  ArrowRight,
  Lock,
  Zap
} from 'lucide-react';
import { usePrivatePrice } from '@/hooks/use-pricing';

interface SampleFeedback {
  id: string;
  category: 'appearance' | 'dating';
  question: string;
  context: string;
  reviews: {
    reviewerId: string;
    rating: number;
    feedback: string;
    reviewer: {
      rating: number;
      totalReviews: number;
      isVerified: boolean;
      expertise: string[];
    };
  }[];
  summary: {
    overallRating: number;
    keyTakeaways: string[];
  };
}

const SAMPLE_FEEDBACK: SampleFeedback = {
  id: '1',
  category: 'appearance',
  question: 'Is this outfit appropriate for a tech startup interview?',
  context: 'I want to look professional but not too formal. The company culture seems relaxed.',
  reviews: [
    {
      reviewerId: 'r1234',
      rating: 8,
      feedback: "Perfect balance! The outfit strikes exactly the right note for a tech startup. The blazer adds professionalism while the jeans keep it relaxed. I'd suggest swapping the sneakers for loafers to elevate it slightly. The color combination shows you understand the culture. You'll make a great first impression!",
      reviewer: {
        rating: 4.9,
        totalReviews: 234,
        isVerified: true,
        expertise: ['Style', 'Professional']
      }
    },
    {
      reviewerId: 'r5678',
      rating: 7,
      feedback: "Good foundation but needs tweaking. The blazer-jeans combo works, but those sneakers are too casual even for a startup. Consider adding a belt that matches your shoes. Overall vibe is right, just polish the details for maximum impact.",
      reviewer: {
        rating: 4.8,
        totalReviews: 189,
        isVerified: false,
        expertise: ['Fashion', 'Career']
      }
    },
    {
      reviewerId: 'r9012',
      rating: 9,
      feedback: "You nailed the startup interview look! As someone who's hired at tech companies, this shows you've done your homework. The smart-casual balance is perfect. Ensure your grooming is on point and your confidence will seal the deal. Good luck!",
      reviewer: {
        rating: 4.7,
        totalReviews: 156,
        isVerified: true,
        expertise: ['Tech Industry', 'Hiring']
      }
    }
  ],
  summary: {
    overallRating: 8,
    keyTakeaways: [
      'Blazer + jeans combo perfect for startup culture',
      'Upgrade footwear to loafers or minimalist sneakers',
      'Add matching belt for polished look',
      'Smart-casual balance achieved successfully'
    ]
  }
};

export function SampleFeedbackShowcase() {
  const privatePrice = usePrivatePrice();
  const [selectedMode, setSelectedMode] = useState<'community' | 'private'>('community');

  return (
    <section className="py-20 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <CheckCircle className="h-4 w-4" />
            See Exactly What You'll Get
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Real Feedback Sample
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everyone gets the same quality feedback - 3 comprehensive reports from real people. Choose your path based on time vs. privacy preference.
          </p>
        </div>

        {/* Path Selector */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setSelectedMode('community')}
              className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center gap-3 ${
                selectedMode === 'community'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-bold">Community Path</div>
                <div className="text-xs text-gray-500">Judge 5 → Earn credit → Free</div>
              </div>
            </button>
            <button
              onClick={() => setSelectedMode('private')}
              className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center gap-3 ${
                selectedMode === 'private'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Lock className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <div className="font-bold">Private Path</div>
                <div className="text-xs text-gray-500">Pay {privatePrice} → Skip judging</div>
              </div>
            </button>
          </div>
        </div>

        {/* Path Description */}
        <div className="text-center mb-8">
          {selectedMode === 'community' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Community Path</span>
              </div>
              <p className="text-green-700">
                Judge 5 community submissions → Earn 1 credit → Submit your request (appears in public feed) → Get 3 feedback reports
              </p>
            </div>
          ) : (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-800">Private Path</span>
              </div>
              <p className="text-purple-700">
                Pay {privatePrice} → Submit privately (never appears in feed) → Get 3 feedback reports in under 1 hour
              </p>
            </div>
          )}
        </div>

        {/* Sample Feedback Display */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Question Header */}
          <div className={`bg-gradient-to-r ${selectedMode === 'community' ? 'from-green-500 to-emerald-500' : 'from-purple-500 to-indigo-500'} p-6 text-white`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Shirt className="h-6 w-6" />
                  <h3 className="text-2xl font-bold">{SAMPLE_FEEDBACK.question}</h3>
                </div>
                <p className="text-white/90 mb-3">{SAMPLE_FEEDBACK.context}</p>
                <div className="flex items-center gap-4">
                  {selectedMode === 'community' ? (
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Public in Feed
                    </span>
                  ) : (
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Completely Private
                    </span>
                  )}
                  <span className="text-white/80 text-sm">
                    {selectedMode === 'community' ? 'Free with credit' : `Costs ${privatePrice}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-bold text-lg">{SAMPLE_FEEDBACK.summary.overallRating}/10</span>
                  <span className="text-gray-600">Overall Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span className="font-bold">{SAMPLE_FEEDBACK.reviews.length}</span>
                  <span className="text-gray-600">Reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="font-bold">
                    {selectedMode === 'community' ? '~2 hours' : '25 min'}
                  </span>
                  <span className="text-gray-600">Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="p-6 space-y-6">
            {SAMPLE_FEEDBACK.reviews.map((review, index) => (
              <div key={review.reviewerId} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-indigo-600">R{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Anonymous Reviewer</span>
                        {review.reviewer.isVerified && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {review.reviewer.totalReviews} reviews • {review.reviewer.rating}/5 rating
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-bold text-lg">{review.rating}/10</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4">{review.feedback}</p>

                <div className="flex gap-2">
                  {review.reviewer.expertise.map((exp, i) => (
                    <span key={i} className="text-xs bg-white px-3 py-1 rounded-lg text-gray-600 border border-gray-200">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Key Takeaways */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                Key Takeaways
              </h4>
              <ul className="space-y-2">
                {SAMPLE_FEEDBACK.summary.keyTakeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready for Your Own Expert Feedback?
            </h3>
            <p className="text-gray-600 mb-6">
              Get 3 comprehensive reviews like this. Same quality feedback, choose your preferred path.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/feed'}
                className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Eye className="h-5 w-5" />
                Start Judging (Free)
              </button>
              <button
                onClick={() => window.location.href = '/submit-unified'}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Lock className="h-5 w-5" />
                Submit Privately ({privatePrice})
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}