'use client';

import { Shield, Star, Award, CheckCircle } from 'lucide-react';

interface ExpertProfile {
  name: string;
  title: string;
  company: string;
  expertise: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
}

const SAMPLE_EXPERTS: ExpertProfile[] = [
  {
    name: "Sarah Chen",
    title: "Senior UX Designer", 
    company: "Google",
    expertise: "Design & User Experience",
    rating: 4.9,
    reviewCount: 127,
    verified: true
  },
  {
    name: "Marcus Johnson",
    title: "Head of Marketing",
    company: "Stripe", 
    expertise: "Marketing & Brand Strategy",
    rating: 4.8,
    reviewCount: 89,
    verified: true
  },
  {
    name: "Dr. Emily Rodriguez",
    title: "Clinical Psychologist",
    company: "Stanford Health",
    expertise: "Psychology & Behavior",
    rating: 5.0,
    reviewCount: 156,
    verified: true
  }
];

interface ExpertCredentialsBadgeProps {
  className?: string;
  showDetails?: boolean;
}

export function ExpertCredentialsBadge({ 
  className = '',
  showDetails = true 
}: ExpertCredentialsBadgeProps) {
  
  if (!showDetails) {
    return (
      <div className={`inline-flex items-center gap-1 text-xs ${className}`}>
        <Shield className="h-3 w-3 text-blue-600" />
        <span className="text-blue-700 font-medium">Verified experts</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-blue-600" />
        <span className="font-semibold text-blue-900">Verified Expert Judges</span>
      </div>
      
      <div className="space-y-2">
        {SAMPLE_EXPERTS.slice(0, 3).map((expert, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-200"
          >
            {/* Avatar placeholder */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {expert.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 text-sm">{expert.name}</span>
                {expert.verified && (
                  <CheckCircle className="h-3 w-3 text-blue-600" />
                )}
              </div>
              <div className="text-xs text-gray-600">
                {expert.title} at {expert.company}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-medium text-gray-700">{expert.rating}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {expert.reviewCount} reviews
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-900">Expert Quality Guarantee</span>
        </div>
        <ul className="space-y-1 text-xs text-purple-800">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-600" />
            Industry professionals with verified credentials
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-600" />
            Average 4.8+ star rating from past feedback
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-600" />
            Specialized expertise in your request category
          </li>
        </ul>
      </div>
    </div>
  );
}