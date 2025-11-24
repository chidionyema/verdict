'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Award
} from 'lucide-react';

const REAL_TIME_ACTIVITY = [
  { name: "Sarah", action: "got verdict on dating profile", time: "2 min ago", rating: 8.5 },
  { name: "Mike", action: "received business feedback", time: "4 min ago", rating: 9.2 },
  { name: "Jessica", action: "outfit rating completed", time: "6 min ago", rating: 7.8 },
  { name: "David", action: "career decision feedback", time: "8 min ago", rating: 8.9 },
  { name: "Emma", action: "writing review finished", time: "11 min ago", rating: 9.1 },
];

const FEATURED_TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Marketing Manager",
    company: "Tech Startup",
    image: "SC",
    rating: 5,
    text: "I was nervous about my presentation style and got incredibly detailed feedback. The anonymity meant people were brutally honest, which is exactly what I needed. Changed my entire approach!",
    category: "Professional",
    verified: true,
    result: "30% better presentation scores"
  },
  {
    id: 2,
    name: "Mike Rodriguez",
    role: "Entrepreneur", 
    company: "Founder",
    image: "MR",
    rating: 5,
    text: "Used this before launching my product packaging. The feedback caught design flaws I never noticed. Saved me thousands in redesign costs after launch.",
    category: "Business",
    verified: true,
    result: "Prevented costly redesign"
  },
  {
    id: 3,
    name: "Jessica Kim",
    role: "College Student",
    company: "NYU",
    image: "JK", 
    rating: 5,
    text: "Way better than asking friends who just tell you what you want to hear. Got honest feedback on my dating profile and actually started getting matches!",
    category: "Personal",
    verified: true,
    result: "3x more dating matches"
  }
];

const TRUST_METRICS = [
  {
    icon: Users,
    label: "Active Users",
    value: "47,000+",
    trend: "+23% this month",
    color: "text-blue-600"
  },
  {
    icon: MessageSquare,
    label: "Verdicts Delivered", 
    value: "340K+",
    trend: "99.2% satisfaction",
    color: "text-green-600"
  },
  {
    icon: Star,
    label: "Average Rating",
    value: "4.94/5",
    trend: "Based on 12K+ reviews",
    color: "text-yellow-600"
  },
  {
    icon: Clock,
    label: "Avg Response Time",
    value: "4.2 min",
    trend: "Industry leading",
    color: "text-purple-600"
  }
];

export function SocialProofSection() {
  const [activeActivity, setActiveActivity] = useState(0);
  const [liveCount, setLiveCount] = useState(147);

  useEffect(() => {
    // Rotate through real-time activity
    const activityInterval = setInterval(() => {
      setActiveActivity((prev) => (prev + 1) % REAL_TIME_ACTIVITY.length);
    }, 3000);

    // Simulate live user count changes
    const countInterval = setInterval(() => {
      setLiveCount(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);

    return () => {
      clearInterval(activityInterval);
      clearInterval(countInterval);
    };
  }, []);

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Live Activity Header */}
        <div className="text-center mb-12">
          <Badge className="bg-green-100 text-green-800 border-green-300 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            {liveCount} people getting verdicts right now
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Join 47,000+ People Getting Honest Feedback
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See what happens when real people give you unfiltered opinions
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

                {/* Result Badge */}
                <div className="mb-4">
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {testimonial.result}
                  </Badge>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {testimonial.image}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{testimonial.name}</span>
                      {testimonial.verified && (
                        <Verified className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {testimonial.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Real-time Activity Feed */}
        <Card className="mb-16 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Live Activity</h3>
              <Badge className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Real-time
              </Badge>
            </div>

            <div className="space-y-3">
              {REAL_TIME_ACTIVITY.map((activity, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center gap-4 p-3 rounded-lg transition-all duration-500
                    ${index === activeActivity 
                      ? 'bg-purple-50 border border-purple-200 shadow-sm' 
                      : 'bg-gray-50'
                    }
                  `}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                      {activity.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="font-semibold">{activity.name}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {activity.rating}/10
                      </div>
                      <div className="flex text-yellow-400">
                        {[...Array(Math.floor(activity.rating / 2))].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    {index === activeActivity && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recognition Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Trusted by Leading Communities
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>Featured on Product Hunt</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Top 1% User Satisfaction</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>47K+ Active Community</span>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-12 p-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white">
            <h3 className="text-2xl font-bold mb-2">
              Ready to Get Brutally Honest Feedback?
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Join thousands who've discovered what people really think. 
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