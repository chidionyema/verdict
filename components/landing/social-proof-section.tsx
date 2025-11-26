'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Verified, 
  TrendingUp, 
  Clock,
  MessageSquare,
  ArrowRight,
  Quote,
  CheckCircle,
  Users,
  Award,
  Shield
} from 'lucide-react';


const FEATURED_TESTIMONIALS = [
  {
    id: 1,
    name: "Mike",
    role: "28",
    company: "",
    image: "M",
    rating: 5,
    text: "Finally got honest feedback on my dating photos. Turns out the group shot was killing my profile.",
    category: "Dating",
    verified: false,
    result: ""
  },
  {
    id: 2,
    name: "Startup founder",
    role: "",
    company: "",
    image: "S",
    rating: 5,
    text: "Used it before a pitch. One reviewer caught a flaw in my pricing slide I'd missed for weeks.",
    category: "Business",
    verified: false,
    result: ""
  },
  {
    id: 3,
    name: "Beta user",
    role: "",
    company: "",
    image: "B", 
    rating: 5,
    text: "Super quick, and the responses were way more honest than I expected.",
    category: "Early tester",
    verified: false,
    result: ""
  }
];

const TRUST_METRICS = [
  {
    icon: MessageSquare,
    label: 'Opinions delivered',
    value: '500+',
    trend: 'During beta testing',
    color: 'text-green-600',
  },
  {
    icon: Star,
    label: 'Beta user rating',
    value: '4.9/5',
    trend: 'Average satisfaction',
    color: 'text-yellow-600',
  },
  {
    icon: Clock,
    label: 'Response time',
    value: '47 min',
    trend: 'Average delivery',
    color: 'text-purple-600',
  },
  {
    icon: Shield,
    label: 'Privacy first',
    value: '100%',
    trend: 'Anonymous & secure',
    color: 'text-blue-600',
  },
];

export function SocialProofSection() {

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Early beta feedback
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Here's what our beta users are saying about getting honest opinions
          </p>
        </div>

        {/* Trust Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {TRUST_METRICS.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="text-center border-0 shadow-md">
                <CardContent className="p-6">
                  <Icon className={`w-8 h-8 ${metric.color} mx-auto mb-3`} />
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {metric.value}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {metric.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {metric.trend}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Featured Testimonials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {FEATURED_TESTIMONIALS.map((testimonial) => (
            <Card key={testimonial.id} className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-purple-600 mb-4 opacity-20" />
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-700 font-semibold">{testimonial.image}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{testimonial.name}</span>
                      {testimonial.role && (
                        <span className="text-sm text-gray-500">, {testimonial.role}</span>
                      )}
                    </div>
                    {testimonial.category && (
                      <div className="text-xs text-gray-500">
                        {testimonial.category}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Popular Categories */}
        <Card className="mb-16 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Popular verdict categories</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Dating profiles</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Job interview prep</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Business decisions</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Style & appearance</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy First Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Built with privacy first
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>No accounts required</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>No data sold</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span>Submissions auto-delete after 30 days</span>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-12 p-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white">
            <h3 className="text-2xl font-bold mb-2">
              Ready to Get Unfiltered Feedback?
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Be among the first to get honest opinions. 
              Start with 3 free verdicts - no credit card required.
            </p>
            
            <button
              onClick={() => window.location.href = '/start'}
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-2 min-h-[56px]"
            >
              Get My Free Verdicts Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}