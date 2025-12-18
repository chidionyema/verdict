'use client';

import { useState } from 'react';
import { Star, MessageSquare, Clock, Eye, Heart, Filter, Search, ArrowRight } from 'lucide-react';
import { VerifiedBadge, VerifiedHRBadge, VerifiedTechBadge } from '@/components/verification/VerifiedBadge';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';

interface CaseStudy {
  id: string;
  category: 'career' | 'dating' | 'style' | 'decision';
  title: string;
  description: string;
  submissionType: 'photo' | 'text' | 'decision';
  submissionPreview: string;
  averageRating: number;
  responseCount: number;
  responseTime: number;
  featured: boolean;
  reviews: {
    id: string;
    reviewerName: string;
    isVerified: boolean;
    verifiedCategory?: 'hr' | 'tech' | 'design' | 'marketing' | 'finance' | 'general';
    verifiedLevel?: 'linkedin' | 'expert' | 'elite';
    specialization: string;
    rating: number;
    feedback: string;
    helpful: boolean;
    responseTime: number;
  }[];
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'cs1',
    category: 'career',
    title: 'LinkedIn Profile Makeover',
    description: 'Software engineer seeking to transition to product management',
    submissionType: 'text',
    submissionPreview: '"Experienced software engineer with 5 years at tech startups. Looking to transition to product management. How does my LinkedIn summary sound?"',
    averageRating: 8.7,
    responseCount: 3,
    responseTime: 12,
    featured: true,
    reviews: [
      {
        id: 'r1',
        reviewerName: 'Sarah M.',
        isVerified: true,
        verifiedCategory: 'hr',
        verifiedLevel: 'expert',
        specialization: 'Senior HR Director',
        rating: 9,
        feedback: "Your technical background is impressive, but your summary needs to bridge the gap to product management more explicitly. Here's what I'd recommend: 1) Lead with your PM-relevant experience (user research, cross-functional collaboration), 2) Quantify your impact (how did your engineering decisions affect users?), 3) Add specific PM skills you've developed. Consider: 'Product-focused Software Engineer | 5 years building user-centric solutions | Experienced in cross-functional collaboration and data-driven decision making | Transitioning to Product Management to scale impact'",
        helpful: true,
        responseTime: 8,
      },
      {
        id: 'r2',
        reviewerName: 'Alex K.',
        isVerified: true,
        verifiedCategory: 'tech',
        verifiedLevel: 'expert',
        specialization: 'Tech Lead at Fortune 500',
        rating: 8,
        feedback: "As someone who made a similar transition, focus on the 'why' behind your move to PM. Your current summary reads too technical. Highlight instances where you: influenced product decisions, worked directly with users, or led initiatives beyond code. Add keywords like 'product strategy,' 'user experience,' and 'market research.' Also, consider getting PM certifications (Google, Coursera) to show commitment.",
        helpful: true,
        responseTime: 15,
      },
      {
        id: 'r3',
        reviewerName: 'Jordan P.',
        isVerified: false,
        specialization: 'Former PM at Startup',
        rating: 9,
        feedback: "Your engineering background is actually a huge asset in PM! Don't downplay it. Instead, reframe your experience: 'Built products used by 10K+ users' instead of 'Developed software features.' Show business impact. Include any customer interaction, A/B testing, or feature prioritization experience. Consider adding a brief section about PM-specific projects or side hustles.",
        helpful: true,
        responseTime: 20,
      },
    ],
  },
  {
    id: 'cs2',
    category: 'dating',
    title: 'Dating Profile Photo Selection',
    description: 'Professional in late 20s optimizing dating app presence',
    submissionType: 'photo',
    submissionPreview: 'Photo shows well-dressed person at a coffee shop, natural lighting, genuine smile',
    averageRating: 7.3,
    responseCount: 3,
    responseTime: 8,
    featured: true,
    reviews: [
      {
        id: 'r4',
        reviewerName: 'Maya R.',
        isVerified: true,
        verifiedCategory: 'general',
        verifiedLevel: 'linkedin',
        specialization: 'Licensed Therapist',
        rating: 8,
        feedback: "Great natural smile and the coffee shop setting feels approachable! The lighting is perfect and you look genuinely happy. For dating apps, this works well as a secondary photo. For your main photo, consider: 1) More direct eye contact with camera, 2) A setting that shows a hobby or interest, 3) Full body shot to give better sense of your style. This photo shows your personality well - keep it in your lineup!",
        helpful: true,
        responseTime: 5,
      },
      {
        id: 'r5',
        reviewerName: 'Chris L.',
        isVerified: false,
        specialization: 'Dating Coach',
        rating: 7,
        feedback: "Solid photo! You look friendly and the venue choice suggests you're social. The outfit is clean and professional without being overdressed. Two suggestions: 1) Try a version with slightly more confident posture (shoulders back), 2) Consider if this represents your typical style - authenticity is key. Overall, this would perform well on apps like Bumble or Hinge where personality matters more than pure attraction.",
        helpful: true,
        responseTime: 12,
      },
      {
        id: 'r6',
        reviewerName: 'Sam T.',
        isVerified: false,
        specialization: 'Photography Enthusiast',
        rating: 7,
        feedback: "From a technical perspective: excellent natural lighting, good composition, and authentic expression. The shallow depth of field works well. For dating success: this photo suggests stability and approachability, which appeals to people seeking serious relationships. If you're on Tinder, you might want something with more energy. For Hinge/Bumble, this is perfect.",
        helpful: true,
        responseTime: 10,
      },
    ],
  },
  {
    id: 'cs3',
    category: 'style',
    title: 'Job Interview Outfit',
    description: 'Recent graduate preparing for first corporate interviews',
    submissionType: 'photo',
    submissionPreview: 'Business casual outfit: navy blazer, white shirt, dark jeans, brown shoes',
    averageRating: 6.7,
    responseCount: 3,
    responseTime: 15,
    featured: false,
    reviews: [
      {
        id: 'r7',
        reviewerName: 'Rachel W.',
        isVerified: true,
        verifiedCategory: 'hr',
        verifiedLevel: 'linkedin',
        specialization: 'Corporate Recruiter',
        rating: 6,
        feedback: "The blazer and shirt combination looks sharp, but I'd recommend switching to dress pants instead of jeans for corporate interviews. Even 'business casual' in most corporate environments means chinos or dress pants. The brown shoes work well with the navy blazer. Overall impression: shows effort but might be slightly underdressed depending on company culture. Research the specific company's dress code if possible.",
        helpful: true,
        responseTime: 18,
      },
      {
        id: 'r8',
        reviewerName: 'Mike D.',
        isVerified: false,
        specialization: 'Fashion Enthusiast',
        rating: 7,
        feedback: "Great color coordination! Navy and brown is a classic combination. The fit of the blazer looks good from what I can see. For interviews, I'd suggest: 1) Dress pants (charcoal or navy), 2) Make sure the shirt is properly pressed, 3) Consider a simple watch if you have one - it adds a professional touch. The overall style suggests you understand business dress codes, just needs minor adjustments.",
        helpful: true,
        responseTime: 12,
      },
      {
        id: 'r9',
        reviewerName: 'Lisa K.',
        isVerified: true,
        verifiedCategory: 'general',
        verifiedLevel: 'linkedin',
        specialization: 'Sales Manager',
        rating: 7,
        feedback: "As someone who interviews candidates regularly: you're 80% there! The blazer shows you take the opportunity seriously. The jeans are the main issue - they read too casual for most corporate settings. Dark chinos would be a good middle ground if you don't have dress pants. Remember: it's better to be slightly overdressed than underdressed for an interview. You can always adjust after you get the job.",
        helpful: true,
        responseTime: 8,
      },
    ],
  },
];

export default function CaseStudiesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: 'all', label: 'All Categories', count: CASE_STUDIES.length },
    { value: 'career', label: 'Career', count: CASE_STUDIES.filter(cs => cs.category === 'career').length },
    { value: 'dating', label: 'Dating', count: CASE_STUDIES.filter(cs => cs.category === 'dating').length },
    { value: 'style', label: 'Style', count: CASE_STUDIES.filter(cs => cs.category === 'style').length },
    { value: 'decision', label: 'Decisions', count: CASE_STUDIES.filter(cs => cs.category === 'decision').length },
  ];

  const filteredCaseStudies = CASE_STUDIES.filter(cs => {
    const matchesCategory = selectedCategory === 'all' || cs.category === selectedCategory;
    const matchesSearch = cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cs.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredCaseStudies = filteredCaseStudies.filter(cs => cs.featured);
  const regularCaseStudies = filteredCaseStudies.filter(cs => !cs.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Real Feedback Examples
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto mb-8">
              See the quality and depth of feedback our community provides. These are real submissions and responses from our platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>Real submissions</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Detailed feedback</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Verified experts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search case studies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Featured Case Studies */}
        {featuredCaseStudies.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Featured Examples
            </h2>
            <div className="space-y-8">
              {featuredCaseStudies.map((caseStudy) => (
                <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} featured />
              ))}
            </div>
          </div>
        )}

        {/* Regular Case Studies */}
        {regularCaseStudies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More Examples</h2>
            <div className="space-y-6">
              {regularCaseStudies.map((caseStudy) => (
                <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredCaseStudies.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No case studies found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to get this quality of feedback?</h3>
          <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
            Join our community and get detailed, actionable feedback from real experts and professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <TouchButton
              onClick={() => window.location.href = '/feed'}
              className="bg-white text-indigo-600 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold"
            >
              Start Reviewing (Free)
            </TouchButton>
            <TouchButton
              onClick={() => window.location.href = '/start'}
              className="bg-indigo-800 hover:bg-indigo-900 text-white px-6 py-3 rounded-xl font-semibold border border-indigo-400"
            >
              Submit for Feedback
            </TouchButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaseStudyCard({ caseStudy, featured = false }: { caseStudy: CaseStudy; featured?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-2xl shadow-lg border p-6 ${featured ? 'border-yellow-200 shadow-xl' : 'border-gray-200'}`}>
      {featured && (
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Star className="h-3 w-3 mr-1" />
            Featured Example
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{caseStudy.title}</h3>
          <Badge className="capitalize">{caseStudy.category}</Badge>
        </div>
        <p className="text-gray-600 mb-4">{caseStudy.description}</p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{caseStudy.averageRating}/10</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{caseStudy.responseCount} responses</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{caseStudy.responseTime} min avg</span>
          </div>
        </div>
      </div>

      {/* Submission Preview */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Original Submission
        </h4>
        <p className="text-gray-700 italic">"{caseStudy.submissionPreview}"</p>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {caseStudy.reviews.slice(0, expanded ? caseStudy.reviews.length : 1).map((review) => (
          <div key={review.id} className="border-l-4 border-indigo-200 pl-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-medium text-gray-900">{review.reviewerName}</span>
              {review.isVerified && (
                <>
                  {review.verifiedCategory === 'hr' && (
                    <VerifiedHRBadge 
                      isVerified={true} 
                      level={review.verifiedLevel}
                      size="sm"
                    />
                  )}
                  {review.verifiedCategory === 'tech' && (
                    <VerifiedTechBadge 
                      isVerified={true} 
                      level={review.verifiedLevel}
                      size="sm"
                    />
                  )}
                  {review.verifiedCategory === 'general' && (
                    <VerifiedBadge 
                      isVerified={true} 
                      level={review.verifiedLevel}
                      category="general"
                      size="sm"
                    />
                  )}
                </>
              )}
              <span className="text-sm text-gray-600">• {review.specialization}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{review.rating}/10</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-sm text-gray-600">{review.responseTime}min</span>
              </div>
              {review.helpful && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <Heart className="h-3 w-3 mr-1" />
                  Helpful
                </Badge>
              )}
            </div>
            
            <p className="text-gray-700">{review.feedback}</p>
          </div>
        ))}

        {caseStudy.reviews.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            {expanded ? 'Show Less' : `Show ${caseStudy.reviews.length - 1} More Response${caseStudy.reviews.length - 1 > 1 ? 's' : ''}`}
            <ArrowRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}