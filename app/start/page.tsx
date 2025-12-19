'use client';

import { useRouter } from 'next/navigation';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { useLocalizedPricing } from '@/hooks/use-pricing';
import { 
  ArrowRight, 
  Clock, 
  Users, 
  Zap,
  Shield,
  Star,
  CheckCircle,
  Heart
} from 'lucide-react';

// Success stories for social proof
const successStories = [
  {
    outcome: "3x more LinkedIn connections",
    category: "Professional photos",
    timeframe: "1 week"
  },
  {
    outcome: "Got the job offer", 
    category: "Interview outfit",
    timeframe: "2 days"
  },
  {
    outcome: "2x more dating matches",
    category: "Dating photos",
    timeframe: "Same weekend"
  }
];

export default function StartPage() {
  const router = useRouter();
  const pricing = useLocalizedPricing();

  const handleCommunityPath = () => {
    router.push('/start-simple?visibility=public');
  };

  const handleExpressPath = () => {
    router.push('/start-simple?visibility=private');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="inline-flex mb-6 bg-white/80 backdrop-blur border-indigo-200 text-indigo-700 px-4 py-2">
            <Shield className="h-4 w-4 mr-2" />
            100% Human Reviewers • No AI
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
            What's Your Situation?
          </h1>
          
          <p className="text-xl text-gray-600 mb-2 max-w-2xl mx-auto">
            Choose the path that matches your timeline and needs
          </p>
          
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Both get you 3 honest opinions • Different timelines and approaches
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          
          {/* Community Path */}
          <div className="bg-white/70 backdrop-blur rounded-2xl p-8 border border-white/30 hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">"I Have Time to Give Back"</h2>
              <p className="text-gray-600">Help others, earn your feedback for free</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Judge 3 people's requests</p>
                  <p className="text-sm text-gray-600">~20 minutes total</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Earn 1 credit automatically</p>
                  <p className="text-sm text-gray-600">{pricing.privatePrice} value unlocked</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Submit your own request</p>
                  <p className="text-sm text-gray-600">Get expert feedback for free</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-green-800 mb-3">
                <Heart className="h-4 w-4" />
                <span className="font-semibold">Perfect when you're thinking:</span>
              </div>
              <ul className="text-sm text-green-700 space-y-2">
                <li>💭 "I want to see what others are asking about"</li>
                <li>💭 "I don't mind spending 20 minutes helping people"</li>
                <li>💭 "I'd rather earn my feedback than pay for it"</li>
                <li>💭 "I'm curious about this whole process"</li>
              </ul>
            </div>
            
            <TouchButton
              onClick={handleCommunityPath}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                Start with Community
                <ArrowRight className="h-5 w-5" />
              </span>
            </TouchButton>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              Perfect if you have 20 minutes to help others
            </p>
          </div>

          {/* Express Path */}
          <div className="bg-white/70 backdrop-blur rounded-2xl p-8 border border-white/30 hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">"I Need This Fast"</h2>
              <p className="text-gray-600">Pay {pricing.privatePrice}, skip the line, get instant feedback</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Submit your request now</p>
                  <p className="text-sm text-gray-600">Upload & describe in 2 minutes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pay {pricing.privatePrice} for priority review</p>
                  <p className="text-sm text-gray-600">Secure payment via Stripe</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Get 3 expert opinions</p>
                  <p className="text-sm text-gray-600">Usually within 2 hours</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-purple-800 mb-3">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">Perfect when you're saying:</span>
              </div>
              <ul className="text-sm text-purple-700 space-y-2">
                <li>⚡ "I have a job interview tomorrow"</li>
                <li>⚡ "I'm going on a date tonight"</li>
                <li>⚡ "I need to decide this quickly"</li>
                <li>⚡ "I don't have time to review other people's stuff"</li>
              </ul>
            </div>
            
            <TouchButton
              onClick={handleExpressPath}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                Start with Express
                <ArrowRight className="h-5 w-5" />
              </span>
            </TouchButton>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              Perfect when you need feedback fast
            </p>
          </div>
        </div>

        {/* Success Stories */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-center text-lg font-semibold text-gray-900 mb-6">
            Recent Success Stories
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {successStories.map((story, index) => (
              <div key={index} className="bg-white/50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-semibold text-gray-900">{story.outcome}</span>
                </div>
                <p className="text-sm text-gray-600">{story.category}</p>
                <p className="text-xs text-gray-500">{story.timeframe}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 mb-2">
              Join 15,000+ people who've made better decisions with Verdict
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>100% anonymous</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-600" />
                <span>No AI, only humans</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-green-600" />
                <span>Under 1 hour</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}