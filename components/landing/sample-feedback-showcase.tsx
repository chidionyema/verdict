'use client';

import { useState } from 'react';
import { 
  MessageSquare, 
  Star, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  Eye,
  Heart,
  Briefcase,
  Shirt,
  Calendar,
  Users,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react';
import { ReviewerMiniProfile } from '@/components/ReviewerBadge';

interface SampleFeedback {
  id: string;
  tier: 'basic' | 'detailed';
  category: 'appearance' | 'career' | 'dating' | 'writing';
  question: string;
  context: string;
  mediaType: 'photo' | 'text';
  price: number;
  reviews: {
    reviewerId: string;
    rating: number;
    tone: 'encouraging' | 'honest' | 'constructive';
    feedback: string;
    timestamp: string;
    wordCount: number;
    reviewer: {
      rating: number;
      totalReviews: number;
      isVerified: boolean;
      expertise: string[];
    };
  }[];
  summary: {
    overallRating: number;
    consensus: string;
    keyTakeaways: string[];
  };
}

const SAMPLE_FEEDBACKS: SampleFeedback[] = [
  {
    id: '1',
    tier: 'basic',
    category: 'appearance',
    question: 'Is this outfit appropriate for a tech startup interview?',
    context: 'I want to look professional but not too formal. The company culture seems relaxed.',
    mediaType: 'photo',
    price: 1.99,
    reviews: [
      {
        reviewerId: 'r1234',
        rating: 8,
        tone: 'encouraging',
        feedback: "👍 Yes, looks great!",
        timestamp: '5 minutes ago',
        wordCount: 4,
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
        tone: 'honest',
        feedback: "Good but change the shoes",
        timestamp: '8 minutes ago',
        wordCount: 5,
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
        tone: 'constructive',
        feedback: "Perfect startup vibe 👌",
        timestamp: '12 minutes ago',
        wordCount: 4,
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
      consensus: 'Great outfit choice with one minor suggestion',
      keyTakeaways: [
        'Outfit works well for startup culture',
        'Consider different shoes',
        'Professional but relaxed look achieved'
      ]
    }
  },
  {
    id: '2',
    tier: 'detailed',
    category: 'appearance',
    question: 'Is this outfit appropriate for a tech startup interview?',
    context: 'I want to look professional but not too formal. The company culture seems relaxed.',
    mediaType: 'photo',
    price: 4.99,
    reviews: [
      {
        reviewerId: 'r1234',
        rating: 8,
        tone: 'encouraging',
        feedback: "Perfect balance! The outfit strikes exactly the right note for a tech startup. The blazer adds professionalism while the jeans keep it relaxed. I'd suggest swapping the sneakers for loafers or clean minimalist sneakers to elevate it slightly. The color combination is spot-on - shows you understand the culture. You'll make a great first impression!",
        timestamp: '12 minutes ago',
        wordCount: 67,
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
        tone: 'honest',
        feedback: "Good foundation but needs tweaking. The blazer-jeans combo works, but those sneakers are too casual even for a startup. Your shirt could be crisper - maybe iron it or choose a knit polo instead. Love the watch choice - subtle but professional. Consider adding a belt that matches your shoes. Overall vibe is right, just polish the details.",
        timestamp: '18 minutes ago',
        wordCount: 71,
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
        tone: 'constructive',
        feedback: "You nailed the startup interview look! As someone who's hired at tech companies, this shows you've done your homework. The smart-casual balance is perfect. My only suggestion: ensure your grooming is on point - fresh haircut, trimmed nails, etc. These details matter more than the outfit itself. Your confidence will seal the deal. Good luck!",
        timestamp: '25 minutes ago',
        wordCount: 63,
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
      consensus: 'Great outfit choice with minor improvements needed',
      keyTakeaways: [
        'Blazer + jeans combo perfect for startup culture',
        'Upgrade footwear to loafers or minimalist sneakers',
        'Iron shirt or choose knit alternative',
        'Add matching belt for polished look'
      ]
    }
  },
  {
    id: '3',
    tier: 'basic',
    category: 'dating',
    question: 'How can I improve my dating profile bio?',
    context: "Current bio: 'Adventure seeker, coffee enthusiast, dog dad. Looking for someone to explore hidden restaurants and debate whether pineapple belongs on pizza.'",
    mediaType: 'text',
    price: 1.99,
    reviews: [
      {
        reviewerId: 'r3456',
        rating: 6,
        tone: 'honest',
        feedback: "Too generic - 6/10",
        timestamp: '3 minutes ago',
        wordCount: 4,
        reviewer: {
          rating: 4.9,
          totalReviews: 312,
          isVerified: true,
          expertise: ['Dating', 'Writing']
        }
      },
      {
        reviewerId: 'r7890',
        rating: 7,
        tone: 'constructive',
        feedback: "Needs specific examples",
        timestamp: '7 minutes ago',
        wordCount: 3,
        reviewer: {
          rating: 4.6,
          totalReviews: 267,
          isVerified: false,
          expertise: ['Relationships', 'Communication']
        }
      },
      {
        reviewerId: 'r2345',
        rating: 8,
        tone: 'encouraging',
        feedback: "Good start, add details",
        timestamp: '10 minutes ago',
        wordCount: 4,
        reviewer: {
          rating: 4.8,
          totalReviews: 445,
          isVerified: true,
          expertise: ['Dating Coach', 'Psychology']
        }
      }
    ],
    summary: {
      overallRating: 7,
      consensus: 'Bio needs more specific details',
      keyTakeaways: [
        'Replace generic phrases',
        'Add specific examples',
        'Include unique interests'
      ]
    }
  },
  {
    id: '4',
    tier: 'detailed',
    category: 'dating',
    question: 'How can I improve my dating profile bio?',
    context: "Current bio: 'Adventure seeker, coffee enthusiast, dog dad. Looking for someone to explore hidden restaurants and debate whether pineapple belongs on pizza.'",
    mediaType: 'text',
    price: 4.99,
    reviews: [
      {
        reviewerId: 'r3456',
        rating: 6,
        tone: 'honest',
        feedback: "Your bio is generic - these phrases appear on thousands of profiles. 'Adventure seeker' says nothing specific. Instead: 'Last month I hiked Yosemite's Half Dome.' Replace 'coffee enthusiast' with your actual coffee ritual. The pineapple pizza line is overused. Share something unique: your weird talent, specific goals, or an interesting story. Show, don't tell.",
        timestamp: '8 minutes ago',
        wordCount: 68,
        reviewer: {
          rating: 4.9,
          totalReviews: 312,
          isVerified: true,
          expertise: ['Dating', 'Writing']
        }
      },
      {
        reviewerId: 'r7890',
        rating: 7,
        tone: 'constructive',
        feedback: "Good start but too safe! Add specifics: What adventures? Name the last place you explored. What kind of dog? Include a conversation starter beyond pizza debates - maybe 'I'll teach you my grandmother's secret pasta recipe if you can beat me at mini golf.' Give matches something concrete to message about. Your personality should jump off the screen.",
        timestamp: '15 minutes ago',
        wordCount: 69,
        reviewer: {
          rating: 4.6,
          totalReviews: 267,
          isVerified: false,
          expertise: ['Relationships', 'Communication']
        }
      },
      {
        reviewerId: 'r2345',
        rating: 8,
        tone: 'encouraging',
        feedback: "You've got the friendly vibe down! To stand out: mention specific restaurants you've discovered, share your dog's name/breed, add one unexpected interest. Consider: 'Training my golden retriever Max to be a therapy dog. Recent win: found the best ramen spot in Chinatown. Let's explore the city's hidden bookstores and settle the great pizza debate over craft beer.'",
        timestamp: '22 minutes ago',
        wordCount: 66,
        reviewer: {
          rating: 4.8,
          totalReviews: 445,
          isVerified: true,
          expertise: ['Dating Coach', 'Psychology']
        }
      }
    ],
    summary: {
      overallRating: 7,
      consensus: 'Bio needs more specific details and personality',
      keyTakeaways: [
        'Replace generic phrases with specific examples',
        'Add concrete conversation starters',
        'Include your dog\'s name and breed',
        'Share unique interests or stories',
        'Make it easy for matches to message you'
      ]
    }
  }
];

export function SampleFeedbackShowcase() {
  const [selectedSample, setSelectedSample] = useState(0);
  const [showFullReview, setShowFullReview] = useState(false);
  const sample = SAMPLE_FEEDBACKS[selectedSample];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'appearance': return <Shirt className="h-5 w-5" />;
      case 'career': return <Briefcase className="h-5 w-5" />;
      case 'dating': return <Heart className="h-5 w-5" />;
      case 'writing': return <MessageSquare className="h-5 w-5" />;
      default: return <Eye className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'appearance': return 'from-pink-500 to-rose-500';
      case 'career': return 'from-blue-500 to-indigo-500';
      case 'dating': return 'from-red-500 to-pink-500';
      case 'writing': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <CheckCircle className="h-4 w-4" />
            See Exactly What You'll Get
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Real Feedback Samples
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See the difference between Basic and Detailed feedback. Choose the option that matches your decision complexity.
          </p>
        </div>

        {/* Tier Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setSelectedSample(0)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                SAMPLE_FEEDBACKS[selectedSample].tier === 'basic'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Basic ($1.99)
            </button>
            <button
              onClick={() => setSelectedSample(1)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                SAMPLE_FEEDBACKS[selectedSample].tier === 'detailed'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Detailed ($4.99)
            </button>
          </div>
        </div>

        {/* Category Selector */}
        <div className="flex justify-center gap-4 mb-8">
          {[...new Set(SAMPLE_FEEDBACKS.map(f => f.category))].map((category) => {
            const feedbacksInCategory = SAMPLE_FEEDBACKS.filter(f => f.category === category);
            const currentTier = SAMPLE_FEEDBACKS[selectedSample].tier;
            const targetIndex = SAMPLE_FEEDBACKS.findIndex(f => f.category === category && f.tier === currentTier);
            
            return (
              <button
                key={category}
                onClick={() => setSelectedSample(targetIndex)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  SAMPLE_FEEDBACKS[selectedSample].category === category
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <span className="capitalize">{category}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Feedback Display */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Question Header */}
          <div className={`bg-gradient-to-r ${getCategoryColor(sample.category)} p-6 text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold">{sample.question}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    sample.tier === 'basic' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-yellow-400 text-yellow-900'
                  }`}>
                    {sample.tier === 'basic' ? 'Basic Feedback' : 'Detailed Feedback'}
                  </span>
                </div>
                <p className="text-white/90">{sample.context}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">${sample.price}</p>
                <p className="text-sm text-white/80">
                  {sample.tier === 'basic' ? 'Quick ratings' : 'Written reviews'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-bold text-lg">{sample.summary.overallRating}/10</span>
                  <span className="text-gray-600">Overall Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span className="font-bold">{sample.reviews.length}</span>
                  <span className="text-gray-600">Expert Reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="font-bold">25 min</span>
                  <span className="text-gray-600">Delivery Time</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-semibold">{sample.summary.consensus}</span>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="p-6 space-y-6">
            {sample.reviews.map((review, index) => (
              <div key={review.reviewerId} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <ReviewerMiniProfile 
                        rating={review.reviewer.rating}
                        totalReviews={review.reviewer.totalReviews}
                        isVerified={review.reviewer.isVerified}
                      />
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        review.tone === 'encouraging' 
                          ? 'bg-green-100 text-green-700'
                          : review.tone === 'honest'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {review.tone} feedback
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{review.wordCount} words</span>
                      <span>{review.timestamp}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-bold text-lg">{review.rating}/10</span>
                    </div>
                  </div>
                </div>

                {/* Feedback Content */}
                <p className="text-gray-700 leading-relaxed">{review.feedback}</p>

                {/* Reviewer Expertise */}
                <div className="flex gap-2 mt-4">
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
                {sample.summary.keyTakeaways.map((takeaway, index) => (
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
              Get 3 detailed reviews like these in under 30 minutes. No subscriptions, no hidden fees.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/start-simple'}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Get Started - From $1.99
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowFullReview(!showFullReview)}
                className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all duration-300"
              >
                View More Samples
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}