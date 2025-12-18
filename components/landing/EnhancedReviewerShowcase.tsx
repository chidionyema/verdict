'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Clock, MessageSquare, TrendingUp, Shield } from 'lucide-react';
import { VerifiedBadge, VerifiedHRBadge, VerifiedTechBadge } from '@/components/verification/VerifiedBadge';

interface Reviewer {
  id: string;
  name: string;
  expertise: string[];
  rating: number;
  totalReviews: number;
  responseTime: number;
  isVerified: boolean;
  verifiedCategory?: 'hr' | 'tech' | 'design' | 'marketing' | 'finance' | 'general';
  verifiedLevel?: 'linkedin' | 'expert' | 'elite';
  specialization: string;
  avatarBg: string;
  sampleFeedback: string;
  consensusRate: number;
}

const FEATURED_REVIEWERS: Reviewer[] = [
  {
    id: '1',
    name: 'Sarah M.',
    expertise: ['Career', 'Business', 'Leadership'],
    rating: 4.9,
    totalReviews: 234,
    responseTime: 12,
    isVerified: true,
    verifiedCategory: 'hr',
    verifiedLevel: 'expert',
    specialization: 'Senior HR Director',
    avatarBg: 'bg-gradient-to-br from-blue-100 to-indigo-100',
    sampleFeedback: "Your resume shows great potential, but I'd suggest highlighting your leadership achievements more prominently...",
    consensusRate: 89,
  },
  {
    id: '2',
    name: 'Alex K.',
    expertise: ['Tech', 'Product', 'Startups'],
    rating: 4.8,
    totalReviews: 189,
    responseTime: 15,
    isVerified: true,
    verifiedCategory: 'tech',
    verifiedLevel: 'expert',
    specialization: 'Tech Lead at Fortune 500',
    avatarBg: 'bg-gradient-to-br from-green-100 to-emerald-100',
    sampleFeedback: "The technical approach is solid, but consider the scalability implications for the user experience...",
    consensusRate: 92,
  },
  {
    id: '3',
    name: 'Maya R.',
    expertise: ['Dating', 'Relationships', 'Communication'],
    rating: 4.9,
    totalReviews: 312,
    responseTime: 8,
    isVerified: true,
    verifiedCategory: 'general',
    verifiedLevel: 'linkedin',
    specialization: 'Licensed Therapist',
    avatarBg: 'bg-gradient-to-br from-purple-100 to-pink-100',
    sampleFeedback: "Your photos convey warmth and authenticity. I'd suggest adding one that shows you in a more active setting...",
    consensusRate: 94,
  },
  {
    id: '4',
    name: 'Jordan P.',
    expertise: ['Style', 'Fashion', 'Personal Brand'],
    rating: 4.7,
    totalReviews: 156,
    responseTime: 20,
    isVerified: false,
    specialization: 'Fashion Enthusiast',
    avatarBg: 'bg-gradient-to-br from-orange-100 to-yellow-100',
    sampleFeedback: "Love the color coordination! This outfit works well for business casual. Consider a slightly more fitted...",
    consensusRate: 78,
  },
];

export function EnhancedReviewerShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextReviewer = () => {
    setCurrentIndex((prev) => (prev + 1) % FEATURED_REVIEWERS.length);
  };

  const prevReviewer = () => {
    setCurrentIndex((prev) => (prev - 1 + FEATURED_REVIEWERS.length) % FEATURED_REVIEWERS.length);
  };

  const currentReviewer = FEATURED_REVIEWERS[currentIndex];

  return (
    <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
            <Shield className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Verified Expert Reviewers</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get feedback from real professionals
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our reviewers include verified HR professionals, tech leaders, therapists, and industry experts who provide thoughtful, actionable feedback.
          </p>
        </div>

        {/* Main Reviewer Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className={`w-20 h-20 rounded-2xl ${currentReviewer.avatarBg} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl font-bold text-gray-700">
                    {currentReviewer.name.charAt(0)}
                  </span>
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">{currentReviewer.name}</h3>
                    {currentReviewer.isVerified && (
                      <>
                        {currentReviewer.verifiedCategory === 'hr' && (
                          <VerifiedHRBadge 
                            isVerified={true} 
                            level={currentReviewer.verifiedLevel}
                            size="md"
                          />
                        )}
                        {currentReviewer.verifiedCategory === 'tech' && (
                          <VerifiedTechBadge 
                            isVerified={true} 
                            level={currentReviewer.verifiedLevel}
                            size="md"
                          />
                        )}
                        {currentReviewer.verifiedCategory === 'general' && (
                          <VerifiedBadge 
                            isVerified={true} 
                            level={currentReviewer.verifiedLevel}
                            category="general"
                            size="md"
                          />
                        )}
                      </>
                    )}
                  </div>
                  
                  <p className="text-lg text-indigo-600 font-medium mb-4">{currentReviewer.specialization}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {currentReviewer.expertise.map((skill) => (
                      <span 
                        key={skill} 
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold text-gray-900">{currentReviewer.rating}</span>
                      </div>
                      <p className="text-xs text-gray-600">Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="font-bold text-gray-900">{currentReviewer.totalReviews}</span>
                      </div>
                      <p className="text-xs text-gray-600">Reviews</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-gray-900">{currentReviewer.responseTime}min</span>
                      </div>
                      <p className="text-xs text-gray-600">Avg Response</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="font-bold text-gray-900">{currentReviewer.consensusRate}%</span>
                      </div>
                      <p className="text-xs text-gray-600">Consensus</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Feedback */}
              <div className="bg-gray-50 rounded-xl p-6 mt-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  Sample Feedback Style
                </h4>
                <p className="text-gray-700 italic">"{currentReviewer.sampleFeedback}"</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevReviewer}
              className="p-3 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="flex gap-2">
              {FEATURED_REVIEWERS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextReviewer}
              className="p-3 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Trust Message */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <Shield className="h-5 w-5 text-indigo-600" />
            <span className="font-medium">All verified reviewers are manually screened for professional credentials</span>
          </div>
        </div>
      </div>
    </div>
  );
}