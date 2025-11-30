'use client';

import { useState } from 'react';
import { ReviewerQualityCard, type ReviewerCredentials } from '@/components/ReviewerBadge';
import { ChevronLeft, ChevronRight, Users, Shield, Star, Clock } from 'lucide-react';

// Sample reviewer data showcasing different expertise levels
const FEATURED_REVIEWERS: ReviewerCredentials[] = [
  {
    id: 'r1234',
    expertise: ['Career', 'Business', 'Leadership'],
    rating: 4.9,
    totalReviews: 234,
    responseTime: 15,
    verifiedProfessional: true,
    specialization: 'HR Professional',
    yearsExperience: 12,
    badges: [
      { type: 'top-rated', label: 'Top 5% Reviewer', icon: null as any, color: '' },
      { type: 'subject-expert', label: 'Career Expert', icon: null as any, color: '' },
      { type: 'fast-responder', label: 'Quick Response', icon: null as any, color: '' }
    ]
  },
  {
    id: 'r5678',
    expertise: ['Dating', 'Relationships', 'Communication'],
    rating: 4.8,
    totalReviews: 189,
    responseTime: 22,
    verifiedProfessional: true,
    specialization: 'Relationship Coach',
    yearsExperience: 8,
    badges: [
      { type: 'empathy-champion', label: 'Empathy Champion', icon: null as any, color: '' },
      { type: 'detailed-feedback', label: '150+ words avg', icon: null as any, color: '' }
    ]
  },
  {
    id: 'r9012',
    expertise: ['Style', 'Fashion', 'Personal Branding'],
    rating: 4.7,
    totalReviews: 156,
    responseTime: 18,
    verifiedProfessional: false,
    specialization: 'Fashion Enthusiast',
    badges: [
      { type: 'top-rated', label: 'Highly Rated', icon: null as any, color: '' },
      { type: 'fast-responder', label: 'Responds < 20min', icon: null as any, color: '' }
    ]
  },
  {
    id: 'r3456',
    expertise: ['Writing', 'Communication', 'Business'],
    rating: 4.9,
    totalReviews: 312,
    responseTime: 25,
    verifiedProfessional: true,
    specialization: 'Content Strategist',
    yearsExperience: 10,
    badges: [
      { type: 'subject-expert', label: 'Writing Expert', icon: null as any, color: '' },
      { type: 'detailed-feedback', label: 'Thorough Reviews', icon: null as any, color: '' },
      { type: 'top-rated', label: 'Top Reviewer', icon: null as any, color: '' }
    ]
  }
];

export function ReviewerShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextReviewer = () => {
    setCurrentIndex((prev) => (prev + 1) % FEATURED_REVIEWERS.length);
  };

  const prevReviewer = () => {
    setCurrentIndex((prev) => (prev - 1 + FEATURED_REVIEWERS.length) % FEATURED_REVIEWERS.length);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Meet Our Expert Reviewers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real professionals and experienced individuals ready to give you honest, constructive feedback
          </p>
        </div>

        {/* Trust Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg">
            <Users className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">127+</p>
            <p className="text-sm text-gray-600">Active Reviewers</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">68%</p>
            <p className="text-sm text-gray-600">Verified Professionals</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg">
            <Star className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">4.8/5</p>
            <p className="text-sm text-gray-600">Average Rating</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">19min</p>
            <p className="text-sm text-gray-600">Avg Response Time</p>
          </div>
        </div>

        {/* Reviewer Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={prevReviewer}
              className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              aria-label="Previous reviewer"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>

            <div className="flex-1">
              <ReviewerQualityCard reviewer={FEATURED_REVIEWERS[currentIndex]} />
            </div>

            <button
              onClick={nextReviewer}
              className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              aria-label="Next reviewer"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {FEATURED_REVIEWERS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-indigo-600'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to reviewer ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-6">
            Every reviewer is carefully vetted to ensure you get valuable, actionable feedback
          </p>
          <button
            onClick={() => window.location.href = '/start-simple'}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            Get Feedback from Expert Reviewers →
          </button>
        </div>
      </div>
    </section>
  );
}