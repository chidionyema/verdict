'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { STANDARD_VERDICT_COUNT } from '@/lib/validations';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Users, 
  MessageSquare, 
  Shield, 
  Clock,
  Star,
  AlertCircle,
  Heart,
  Brain,
  Target,
  Zap
} from 'lucide-react';

const COMPARISON_DATA = [
  {
    feature: "Get honest opinions",
    verdict: { available: true, description: `${STANDARD_VERDICT_COUNT} honest opinions from real people` },
    friends: { available: false, description: "Biased opinions to protect your feelings" },
    social: { available: false, description: "Filtered responses for social image" },
    reddit: { available: false, description: "Random strangers, variable quality" }
  },
  {
    feature: "Complete anonymity",
    verdict: { available: true, description: "No profiles, names, or personal info shared" },
    friends: { available: false, description: "Everyone knows it's you asking" },
    social: { available: false, description: "Public posts tied to your identity" },
    reddit: { available: false, description: "Public posts anyone can see" }
  },
  {
    feature: "Fast responses",
    verdict: { available: true, description: "Average 4.2 minutes for all verdicts" },
    friends: { available: false, description: "May take days or never respond" },
    social: { available: true, description: "Quick but often superficial" },
    reddit: { available: false, description: "Might get 0 responses or trolls" }
  },
  {
    feature: "Quality feedback",
    verdict: { available: true, description: "Detailed, constructive responses required" },
    friends: { available: false, description: "Often vague or overly positive" },
    social: { available: false, description: "Mostly emoji reactions and brief comments" },
    reddit: { available: false, description: "Variable quality, may include trolls" }
  },
  {
    feature: "Diverse perspectives",
    verdict: { available: true, description: "Verified reviewers from different backgrounds" },
    friends: { available: false, description: "Similar social circle viewpoints" },
    social: { available: true, description: "Varied but potentially toxic" },
    reddit: { available: true, description: "Diverse but unverified" }
  },
  {
    feature: "No social pressure",
    verdict: { available: true, description: "No awkwardness or relationship impact" },
    friends: { available: false, description: "May affect friendships" },
    social: { available: false, description: "Public scrutiny and judgment" },
    reddit: { available: false, description: "Public scrutiny and judgment" }
  },
  {
    feature: "Guaranteed responses",
    verdict: { available: true, description: `Guaranteed ${STANDARD_VERDICT_COUNT} responses` },
    friends: { available: false, description: "No guarantee" },
    social: { available: false, description: "No guarantee" },
    reddit: { available: false, description: "Might get 0 responses" }
  },
  {
    feature: "Control feedback tone",
    verdict: { available: true, description: "Choose: Be Encouraging, Direct, or Brutally Honest" },
    friends: { available: false, description: "They use their own tone" },
    social: { available: false, description: "Random, unpredictable" },
    reddit: { available: false, description: "Can't control tone" }
  }
];

const PAIN_POINTS = [
  {
    icon: Heart,
    title: "Friends are too nice",
    problem: "Your friends care about your feelings more than giving honest feedback",
    solution: "Our anonymous reviewers have no reason to lie to you"
  },
  {
    icon: Users,
    title: "Social media is public",
    problem: "Everyone sees your insecurities and personal questions",
    solution: "Complete privacy - no one knows what you're asking about"
  },
  {
    icon: AlertCircle,
    title: "Biased perspectives", 
    problem: "Your social circle often thinks the same way you do",
    solution: "Vetted reviewers from different backgrounds and experiences"
  },
      {
        icon: Clock,
        title: "Slow or no responses",
        problem: "Friends might ignore your request or take forever to respond",
        solution: `Guaranteed ${STANDARD_VERDICT_COUNT} thoughtful responses within hours, not days`
      },
      {
        icon: MessageSquare,
        title: "Can't control feedback tone",
        problem: "You want brutally honest feedback but get sugar-coated responses, or vice versa",
        solution: "You choose: Be Encouraging, Be Direct, or Be Brutally Honest. Reviewers match your preference."
      }
];

export function FeaturesComparison() {
  const [selectedTab, setSelectedTab] = useState<'comparison' | 'problems'>('problems');

  return (
    <div className="py-16 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Why AskVerdict Beats Asking Friends or Posting on Reddit
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlike posting on Reddit, your question stays private and you're guaranteed real responses — not trolls or silence.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-xl p-1">
            <TouchButton
              variant={selectedTab === 'problems' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('problems')}
              className="px-6 py-3"
            >
              <Brain className="w-4 h-4 mr-2" />
              The Problem
            </TouchButton>
            <TouchButton
              variant={selectedTab === 'comparison' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('comparison')}
              className="px-6 py-3"
            >
              <Target className="w-4 h-4 mr-2" />
              How We're Different
            </TouchButton>
          </div>
        </div>

        {/* Problems Tab */}
        {selectedTab === 'problems' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PAIN_POINTS.map((point, index) => {
              const Icon = point.icon;
              return (
                <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/70 backdrop-blur-xl border border-white/20 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {point.title}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {point.problem}
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-900">Our Solution:</span>
                          </div>
                          <p className="text-green-800 text-sm">
                            {point.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Comparison Tab */}
        {selectedTab === 'comparison' && (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">What you need</h3>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-4 rounded-xl text-center">
                  <Zap className="w-6 h-6 mx-auto mb-2" />
                  <h3 className="font-bold">AskVerdict</h3>
                  <Badge className="bg-white text-purple-600 mt-2">Recommended</Badge>
                </div>
                <div className="bg-gray-100 p-4 rounded-xl text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <h3 className="font-semibold text-gray-700">Ask Friends</h3>
                </div>
                <div className="bg-gray-100 p-4 rounded-xl text-center">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <h3 className="font-semibold text-gray-700">Social Media</h3>
                </div>
                <div className="bg-gray-100 p-4 rounded-xl text-center">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <h3 className="font-semibold text-gray-700">Reddit/Forums</h3>
                </div>
              </div>

              {/* Feature Rows */}
              <div className="space-y-2">
                {COMPARISON_DATA.map((item, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 items-center py-3 border-b border-gray-100 last:border-b-0">
                    <div className="p-2">
                      <h4 className="font-medium text-gray-900">{item.feature}</h4>
                    </div>
                    
                    {/* Verdict Column */}
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">Yes</span>
                      </div>
                      <p className="text-xs text-green-700">{item.verdict.description}</p>
                    </div>

                    {/* Friends Column */}
                    <div className={`p-3 rounded-lg border ${
                      item.friends.available 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {item.friends.available ? (
                          <Check className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          item.friends.available ? 'text-yellow-900' : 'text-red-900'
                        }`}>
                          {item.friends.available ? 'Limited' : 'No'}
                        </span>
                      </div>
                      <p className={`text-xs ${
                        item.friends.available ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {item.friends.description}
                      </p>
                    </div>

                    {/* Social Media Column */}
                    <div className={`p-3 rounded-lg border ${
                      item.social.available 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {item.social.available ? (
                          <Check className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          item.social.available ? 'text-yellow-900' : 'text-red-900'
                        }`}>
                          {item.social.available ? 'Limited' : 'No'}
                        </span>
                      </div>
                      <p className={`text-xs ${
                        item.social.available ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {item.social.description}
                      </p>
                    </div>

                    {/* Reddit/Forums Column */}
                    <div className={`p-3 rounded-lg border ${
                      item.reddit?.available 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {item.reddit?.available ? (
                          <Check className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          item.reddit?.available ? 'text-yellow-900' : 'text-red-900'
                        }`}>
                          {item.reddit?.available ? 'Limited' : 'No'}
                        </span>
                      </div>
                      <p className={`text-xs ${
                        item.reddit?.available ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {item.reddit?.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-white/80 via-purple-50/80 to-pink-50/80 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Experience the Difference Yourself
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Stop getting sugar-coated opinions. Start getting straight answers that help you improve.
              Try your first ${STANDARD_VERDICT_COUNT}-verdict request completely free — no strings attached.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <TouchButton
                onClick={() => (window.location.href = '/start-simple')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold"
              >
                Get 3 free requests
              </TouchButton>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>100% Anonymous</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>Results in Minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-green-600" />
                  <span>Quality Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}