'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TouchButton } from '@/components/ui/touch-button';
import { 
  Upload, 
  Users, 
  MessageSquare,
  ArrowRight,
  Clock,
  Shield,
  CheckCircle
} from 'lucide-react';

const STEPS = [
  {
    id: 1,
    title: "Ask your question",
    description: "Upload a photo or write your question. No account required.",
    icon: Upload,
    detail: "Takes 30 seconds",
    color: "bg-blue-50 border-blue-200 text-blue-700"
  },
  {
    id: 2,
    title: "3 people respond",
    description: "Verified reviewers give honest, anonymous feedback.",
    icon: Users,
    detail: "Usually within 47 minutes",
    color: "bg-purple-50 border-purple-200 text-purple-700"
  },
  {
    id: 3,
    title: "Get straight answers",
    description: "Read all responses. Make better decisions.",
    icon: MessageSquare,
    detail: "Private and helpful",
    color: "bg-green-50 border-green-200 text-green-700"
  }
];

interface HowItWorksProps {
  showCTA?: boolean;
  compact?: boolean;
}

export function HowItWorks({ showCTA = true, compact = false }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 border border-indigo-200">
            Simple 3-step process
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get honest feedback in minutes, not days
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="relative">
                {/* Step Card */}
                <Card className={`relative border-2 ${step.color} hover:shadow-lg transition-all duration-200`}>
                  <CardContent className="p-6 text-center">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {step.id}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="mt-4 mb-6">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {step.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {step.detail}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Arrow between steps (desktop only) */}
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Why It Works Better Section */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Why strangers give better feedback
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Shield className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">No relationship to protect</h4>
              <p className="text-sm text-gray-600">
                Anonymous reviewers have no reason to sugarcoat their feedback
              </p>
            </div>
            
            <div className="text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Diverse perspectives</h4>
              <p className="text-sm text-gray-600">
                Get opinions from different backgrounds and experiences
              </p>
            </div>
            
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Quality controlled</h4>
              <p className="text-sm text-gray-600">
                All reviewers are verified and maintain quality ratings
              </p>
            </div>
          </div>
        </div>

        {/* Example Preview */}
        {!compact && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                See what feedback looks like
              </h3>
              <p className="text-gray-600">
                Real responses to "Should I wear this to my job interview?"
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { rating: 9, text: "Perfect! Professional and confident. The fit is excellent." },
                { rating: 8, text: "Great choice overall. Maybe try a more subtle tie pattern for finance." },
                { rating: 10, text: "Absolutely. Shows you take the opportunity seriously." }
              ].map((response, index) => (
                <Card key={index} className="bg-white border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-3 h-3 rounded-full ${
                            i < Math.floor(response.rating / 2) 
                              ? 'bg-yellow-400' 
                              : 'bg-gray-200'
                          }`} 
                        />
                      ))}
                      <span className="text-sm font-medium text-gray-700 ml-1">
                        {response.rating}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      "{response.text}"
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      Anonymous reviewer
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        {showCTA && (
          <div className="text-center mt-12">
            <TouchButton
              onClick={() => (window.location.href = '/start-simple')}
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
            >
              Get 3 free verdicts now
              <ArrowRight className="ml-2 w-5 h-5" />
            </TouchButton>
            
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>No account required</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>Completely anonymous</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}