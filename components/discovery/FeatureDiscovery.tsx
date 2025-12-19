'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  X,
  Sparkles,
  ArrowRight,
  Scale,
  RotateCcw,
  MessageSquare,
  Eye,
  Heart,
  FileText,
  Lightbulb,
  Users,
  TrendingUp,
  Zap,
  Star,
  Gift,
  Crown,
  Target,
  ChevronRight,
  Calendar,
  Clock,
  Award,
  Info,
  Play,
  Shuffle,
  BarChart3,
  Camera,
  Image,
  Type,
  CheckCircle,
  Lock,
} from 'lucide-react';

interface FeatureDiscoveryProps {
  userId?: string;
  userProfile?: any;
  requestHistory?: any[];
  onFeatureSelect?: (feature: string) => void;
  compact?: boolean;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: any;
  gradient: string;
  category: 'request_type' | 'advanced' | 'tools' | 'premium';
  benefits: string[];
  examples: string[];
  unlocked: boolean;
  requirement?: string;
  badge?: string;
  popularity: number;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  ctaText: string;
  ctaLink: string;
}

interface Recommendation {
  feature: Feature;
  score: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

const ALL_FEATURES: Feature[] = [
  // Request Types
  {
    id: 'comparison',
    name: 'A/B Comparison',
    description: 'Upload two options and get direct side-by-side feedback on which performs better',
    icon: Scale,
    gradient: 'from-purple-500 to-pink-500',
    category: 'request_type',
    benefits: ['Clear winner selection', 'Direct preference reasons', 'Statistical insights'],
    examples: ['Two outfit choices', 'Profile photo options', 'Design variations', 'Content versions'],
    unlocked: true,
    badge: 'Popular',
    popularity: 85,
    estimatedTime: '10-15 min',
    difficulty: 'beginner',
    ctaText: 'Try A/B Comparison',
    ctaLink: '/create?type=comparison',
  },
  {
    id: 'split_test',
    name: 'Split Test',
    description: 'Test your content with specific demographics to understand audience preferences',
    icon: RotateCcw,
    gradient: 'from-orange-500 to-red-500',
    category: 'request_type',
    benefits: ['Demographic targeting', 'Age/gender insights', 'Statistical analysis', 'Data-driven results'],
    examples: ['Marketing materials', 'Product photos', 'Social media content', 'Brand messaging'],
    unlocked: true,
    badge: 'Pro',
    popularity: 65,
    estimatedTime: '15-20 min',
    difficulty: 'intermediate',
    ctaText: 'Start Split Test',
    ctaLink: '/create?type=split_test',
  },
  {
    id: 'expert_review',
    name: 'Expert Review',
    description: 'Get feedback from verified industry professionals in your specific field',
    icon: Crown,
    gradient: 'from-yellow-500 to-amber-500',
    category: 'premium',
    benefits: ['Industry expertise', 'Professional insights', 'Career guidance', 'Specialist knowledge'],
    examples: ['Resume review', 'Portfolio critique', 'Business strategy', 'Technical analysis'],
    unlocked: false,
    requirement: 'Pro plan required',
    badge: 'Premium',
    popularity: 75,
    estimatedTime: '20-30 min',
    difficulty: 'advanced',
    ctaText: 'Book Expert Review',
    ctaLink: '/experts',
  },
  {
    id: 'video_analysis',
    name: 'Video Analysis',
    description: 'Upload videos for comprehensive feedback on presentation, body language, and content',
    icon: Camera,
    gradient: 'from-blue-500 to-purple-500',
    category: 'advanced',
    benefits: ['Body language analysis', 'Presentation skills', 'Engagement metrics', 'Timing feedback'],
    examples: ['Interview practice', 'Presentation skills', 'Social media videos', 'Sales pitches'],
    unlocked: false,
    requirement: 'Complete 10 requests',
    badge: 'Coming Soon',
    popularity: 60,
    estimatedTime: '10-15 min',
    difficulty: 'intermediate',
    ctaText: 'Join Waitlist',
    ctaLink: '/waitlist/video',
  },
  {
    id: 'anonymous_mode',
    name: 'Anonymous Feedback',
    description: 'Get completely honest feedback without revealing your identity to judges',
    icon: Eye,
    gradient: 'from-gray-500 to-slate-600',
    category: 'tools',
    benefits: ['Complete anonymity', 'Brutally honest feedback', 'No bias', 'Raw opinions'],
    examples: ['Sensitive content', 'Personal decisions', 'Controversial topics', 'Honest opinions'],
    unlocked: true,
    popularity: 55,
    estimatedTime: '5-10 min',
    difficulty: 'beginner',
    ctaText: 'Go Anonymous',
    ctaLink: '/create?anonymous=true',
  },
  {
    id: 'bulk_testing',
    name: 'Bulk Testing',
    description: 'Test multiple variations at once and get comparative analysis across all options',
    icon: BarChart3,
    gradient: 'from-indigo-500 to-blue-500',
    category: 'advanced',
    benefits: ['Multiple comparisons', 'Ranking system', 'Cost efficient', 'Comprehensive analysis'],
    examples: ['Product variations', 'Content options', 'Design iterations', 'Message testing'],
    unlocked: false,
    requirement: 'Premium feature',
    badge: 'Enterprise',
    popularity: 30,
    estimatedTime: '30-45 min',
    difficulty: 'advanced',
    ctaText: 'Explore Bulk Testing',
    ctaLink: '/enterprise',
  },
  {
    id: 'ai_insights',
    name: 'AI-Powered Insights',
    description: 'Get additional AI analysis alongside human feedback for deeper insights',
    icon: Sparkles,
    gradient: 'from-pink-500 to-violet-500',
    category: 'tools',
    benefits: ['Pattern recognition', 'Trend analysis', 'Predictive insights', 'Data synthesis'],
    examples: ['Sentiment analysis', 'Trend predictions', 'Performance optimization', 'Content strategy'],
    unlocked: false,
    requirement: 'Beta feature',
    badge: 'Beta',
    popularity: 70,
    estimatedTime: '5 min',
    difficulty: 'beginner',
    ctaText: 'Join Beta',
    ctaLink: '/beta/ai-insights',
  },
];

export default function FeatureDiscovery({ 
  userId, 
  userProfile, 
  requestHistory = [], 
  onFeatureSelect,
  compact = false 
}: FeatureDiscoveryProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [userPreferences, setUserPreferences] = useState<{
    categories: string[];
    experience_level: string;
    goals: string[];
  }>({
    categories: [],
    experience_level: 'beginner',
    goals: [],
  });

  useEffect(() => {
    if (userId) {
      generateRecommendations();
      fetchUserPreferences();
    }
  }, [userId, requestHistory, userProfile]);

  const fetchUserPreferences = async () => {
    if (!userId) return;
    
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        setUserPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const generateRecommendations = () => {
    const totalRequests = requestHistory.length;
    const categories = [...new Set(requestHistory.map(r => r.category))];
    const hasComparisons = requestHistory.some(r => r.request_type === 'comparison');
    const hasSplitTests = requestHistory.some(r => r.request_type === 'split_test');
    
    const scored: Recommendation[] = ALL_FEATURES.map(feature => {
      let score = feature.popularity; // Base score
      let reason = `${feature.popularity}% of users find this valuable`;
      let urgency: 'low' | 'medium' | 'high' = 'low';

      // Scoring logic
      if (feature.id === 'comparison' && !hasComparisons && totalRequests >= 2) {
        score += 40;
        reason = 'Perfect for choosing between options - you\'ve made several requests';
        urgency = 'high';
      }

      if (feature.id === 'split_test' && totalRequests >= 3 && categories.includes('appearance')) {
        score += 35;
        reason = 'Great for testing with different demographics';
        urgency = 'medium';
      }

      if (feature.id === 'expert_review' && totalRequests >= 5) {
        score += 30;
        reason = 'Unlock professional insights with your experience level';
        urgency = 'medium';
      }

      if (feature.id === 'anonymous_mode' && !feature.unlocked) {
        score += 20;
        reason = 'Get more honest feedback on sensitive topics';
      }

      if (feature.id === 'ai_insights' && totalRequests >= 3) {
        score += 30;
        reason = 'AI can spot patterns humans miss';
        urgency = 'medium';
      }

      // Penalize if requirement not met
      if (!feature.unlocked && feature.requirement) {
        if (feature.requirement.includes('Complete') && totalRequests < parseInt(feature.requirement.match(/\d+/)?.[0] || '999')) {
          score -= 50;
        }
        if (feature.requirement.includes('Pro plan') && !userProfile?.is_pro) {
          score -= 30;
        }
      }

      return {
        feature,
        score: Math.max(0, Math.min(100, score)),
        reason,
        urgency,
      };
    });

    // Sort by score and take top 6
    const topRecommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    setRecommendations(topRecommendations);
  };

  const handleFeatureClick = (feature: Feature) => {
    if (feature.unlocked) {
      if (onFeatureSelect) {
        onFeatureSelect(feature.id);
      } else {
        window.location.href = feature.ctaLink;
      }
    } else {
      setSelectedFeature(feature);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'request_type': return MessageSquare;
      case 'advanced': return Star;
      case 'tools': return Zap;
      case 'premium': return Crown;
      default: return Sparkles;
    }
  };

  const filteredFeatures = selectedCategory === 'all' 
    ? ALL_FEATURES 
    : ALL_FEATURES.filter(f => f.category === selectedCategory);

  if (compact) {
    // Compact banner view for workspace/dashboard
    const topRecommendation = recommendations[0];
    
    if (!topRecommendation) return null;

    return (
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-2xl shadow-xl mb-6">
        <div className="bg-white rounded-[15px] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${topRecommendation.feature.gradient} rounded-xl flex items-center justify-center`}>
                <topRecommendation.feature.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Discover: {topRecommendation.feature.name}</h3>
                <p className="text-sm text-gray-600">{topRecommendation.reason}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Explore All
              </button>
              <button
                onClick={() => handleFeatureClick(topRecommendation.feature)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2"
              >
                Try It
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Trigger Button/Banner */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-200 rounded-xl p-6 hover:border-indigo-300 transition-all group"
      >
        <div className="flex items-center justify-center gap-3 text-indigo-600">
          <Sparkles className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="font-semibold">Discover New Features</span>
          <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </div>
        <p className="text-sm text-gray-600 mt-2">Unlock advanced feedback types and tools</p>
      </button>

      {/* Feature Discovery Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Feature Discovery</h2>
                <p className="text-gray-600">Unlock powerful new ways to get feedback</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  Recommended for You
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.slice(0, 3).map((rec) => (
                    <div
                      key={rec.feature.id}
                      className="relative border-2 border-indigo-200 rounded-xl p-4 bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => handleFeatureClick(rec.feature)}
                    >
                      {rec.urgency === 'high' && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          HOT
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${rec.feature.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <rec.feature.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{rec.feature.name}</h4>
                          {rec.feature.badge && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                              {rec.feature.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-500">{rec.feature.estimatedTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {rec.feature.unlocked ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filters */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Features', icon: Sparkles },
                  { id: 'request_type', label: 'Request Types', icon: MessageSquare },
                  { id: 'advanced', label: 'Advanced', icon: Star },
                  { id: 'tools', label: 'Tools', icon: Zap },
                  { id: 'premium', label: 'Premium', icon: Crown },
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Features Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className={`border rounded-xl p-6 transition-all hover:shadow-lg ${
                      feature.unlocked
                        ? 'border-gray-200 hover:border-indigo-300 cursor-pointer'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() => handleFeatureClick(feature)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center`}>
                          {feature.unlocked ? (
                            <feature.icon className="h-6 w-6 text-white" />
                          ) : (
                            <Lock className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{feature.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {feature.badge && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                                {feature.badge}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(feature.difficulty)}`}>
                              {feature.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{feature.popularity}%</div>
                        <div className="text-xs text-gray-500">popularity</div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{feature.description}</p>

                    <div className="space-y-3 mb-4">
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Benefits:</h5>
                        <div className="flex flex-wrap gap-1">
                          {feature.benefits.slice(0, 3).map((benefit, index) => (
                            <span
                              key={index}
                              className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full"
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Examples:</h5>
                        <div className="text-xs text-gray-600">
                          {feature.examples.slice(0, 2).join(', ')}...
                        </div>
                      </div>
                    </div>

                    {!feature.unlocked && feature.requirement && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700">Requirement:</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">{feature.requirement}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {feature.estimatedTime}
                        </div>
                      </div>
                      
                      <button
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          feature.unlocked
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!feature.unlocked}
                      >
                        {feature.ctaText}
                        {feature.unlocked && <ArrowRight className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Feature Locked</h3>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${selectedFeature.gradient} rounded-xl flex items-center justify-center`}>
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{selectedFeature.name}</h4>
                  <p className="text-gray-600">{selectedFeature.description}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h5 className="font-semibold text-yellow-800 mb-2">Unlock Requirement:</h5>
                <p className="text-yellow-700">{selectedFeature.requirement}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <Link
                  href="/create"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center"
                >
                  Make More Requests
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}