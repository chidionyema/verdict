'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  TrendingUp, 
  Clock,
  MessageSquare,
  ArrowRight,
  Quote,
  CheckCircle,
  Shield,
  Verified,
  Heart,
  Users,
  Zap,
  Award
} from 'lucide-react';

// Anonymous testimonials - privacy is core to our product
const FEATURED_TESTIMONIALS = [
  {
    id: 1,
    name: "Verified User",
    visibleId: "#1204",
    category: "Career Decision",
    avatar: { display: "✓", bgColor: "bg-gradient-to-br from-pink-400 to-purple-500" },
    rating: 5,
    text: "I was torn between two job offers. Three strangers gave me perspectives I hadn't considered - including salary negotiation tips that helped me secure 15% more.",
    helpful: 47,
    verified: true
  },
  {
    id: 2,
    name: "Verified User",
    visibleId: "#0892",
    category: "Dating Profile",
    avatar: { display: "✓", bgColor: "bg-gradient-to-br from-blue-400 to-indigo-500" },
    rating: 5,
    text: "My dating profile wasn't getting matches. The feedback was brutally honest but incredibly helpful. Updated photos based on suggestions - now getting 10x more likes.",
    helpful: 23,
    verified: true
  },
  {
    id: 3,
    name: "Verified User",
    visibleId: "#0341",
    category: "Business Decision",
    avatar: { display: "✓", bgColor: "bg-gradient-to-br from-emerald-400 to-teal-500" },
    rating: 5,
    text: "Before launching my startup, I shared my pitch deck. One reviewer caught a major flaw in my pricing model that could have cost me thousands. Worth every penny.",
    helpful: 31,
    verified: true
  },
  {
    id: 4,
    name: "Verified User",
    visibleId: "#1567",
    category: "Interview Prep",
    avatar: { display: "✓", bgColor: "bg-gradient-to-br from-orange-400 to-red-500" },
    rating: 5,
    text: "Practiced my interview answers and got feedback from 3 professionals. They helped me sound more confident and less rehearsed. Landed the job!",
    helpful: 18,
    verified: true
  },
  {
    id: 5,
    name: "Verified User",
    visibleId: "#0723",
    category: "Style Choice",
    avatar: { display: "✓", bgColor: "bg-gradient-to-br from-yellow-400 to-orange-500" },
    rating: 5,
    text: "Needed honest feedback on my wedding dress options. Family was too polite, but these anonymous reviewers gave me the truth. Chose the perfect dress!",
    helpful: 12,
    verified: true
  },
  {
    id: 6,
    name: "Verified User",
    visibleId: "#0458",
    category: "Email Review",
    avatar: { display: "✓", bgColor: "bg-gradient-to-br from-purple-400 to-pink-500" },
    rating: 5,
    text: "Had a delicate email to send to a difficult client. The feedback helped me strike the right tone - professional but firm. Client responded positively.",
    helpful: 8,
    verified: true
  }
];

// Platform promises - what we guarantee, not fake metrics
const TRUST_METRICS = [
  {
    icon: MessageSquare,
    label: 'Feedback reports',
    value: '3',
    trend: 'Per submission, guaranteed',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    pulse: true
  },
  {
    icon: Star,
    label: 'Quality standard',
    value: 'High',
    trend: 'Detailed, actionable insights',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    pulse: false
  },
  {
    icon: Clock,
    label: 'Response time',
    value: '<2hrs',
    trend: 'Usually much faster',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    pulse: false
  },
  {
    icon: Shield,
    label: 'Privacy',
    value: '100%',
    trend: 'Anonymous & secure',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    pulse: false
  },
];

// What people use AskVerdict for
function PlatformStats() {
  const useCases = [
    { icon: "💼", label: "Career decisions", example: "Job offers, salary negotiations" },
    { icon: "💕", label: "Dating profiles", example: "Photos, bios, conversation openers" },
    { icon: "👔", label: "Style choices", example: "Outfits, haircuts, interview looks" },
    { icon: "📧", label: "Writing review", example: "Emails, messages, applications" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">What People Submit</span>
      </div>
      <div className="space-y-3">
        {useCases.map((useCase, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-lg">{useCase.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-gray-900 text-sm">{useCase.label}</div>
              <div className="text-xs text-gray-500">{useCase.example}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SocialProofSection() {
  return (
    <div className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/dots.svg')] bg-center opacity-[0.03]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 px-4 py-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            Anonymous feedback from real people
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Honest opinions, real results
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See what happens when you get unfiltered feedback from strangers
          </p>
        </div>

        {/* Trust Metrics with enhanced design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {TRUST_METRICS.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className={`text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${metric.bgColor}/30`}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${metric.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4 ${metric.pulse ? 'animate-pulse' : ''}`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {metric.value}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {metric.label}
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {metric.trend}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced testimonials grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              What our users say
            </h3>
            <p className="text-lg text-gray-600">
              <span className="italic">Names hidden to protect privacy</span> — as it should be
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {FEATURED_TESTIMONIALS.slice(0, 3).map((testimonial) => (
              <Card key={testimonial.id} className="relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 overflow-hidden">
                {/* Category badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="text-xs bg-white/90">
                    {testimonial.category}
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  {/* Quote with premium styling */}
                  <Quote className="w-10 h-10 text-indigo-600 mb-4 opacity-20" />
                  
                  {/* Rating with verified badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                    </div>
                    {testimonial.verified && (
                      <Verified className="w-4 h-4 text-blue-500" />
                    )}
                </div>

                  {/* Enhanced testimonial text */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                  {/* Author section with anonymous avatar */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full ${testimonial.avatar.bgColor} flex items-center justify-center text-white text-lg shadow-lg`}
                    >
                      {testimonial.avatar.display}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{testimonial.name}</span>
                        <span className="text-gray-500 text-sm">{testimonial.visibleId}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{testimonial.category}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-400" />
                          {testimonial.helpful} found helpful
                        </span>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

          {/* Additional testimonials row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {FEATURED_TESTIMONIALS.slice(3, 6).map((testimonial) => (
              <Card key={testimonial.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${testimonial.avatar.bgColor} flex items-center justify-center text-white text-sm shadow-md flex-shrink-0`}
                    >
                      {testimonial.avatar.display}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="font-medium text-gray-900 truncate">{testimonial.name} {testimonial.visibleId}</span>
                        <div className="flex gap-0.5 ml-auto">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">{testimonial.text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{testimonial.category}</Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {testimonial.helpful}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Platform stats and trust indicators */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-1">
            <PlatformStats />
          </div>
          
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Why strangers give the best feedback
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Brutally honest</div>
                      <div className="text-sm text-gray-600">No relationships to protect</div>
                    </div>
            </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Diverse perspectives</div>
                      <div className="text-sm text-gray-600">Different backgrounds & experiences</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Quality controlled</div>
                      <div className="text-sm text-gray-600">Verified reviewers with ratings</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      </div>
                    <div>
                      <div className="font-medium text-gray-900">Fast & reliable</div>
                      <div className="text-sm text-gray-600">Guaranteed 3 responses</div>
                    </div>
                  </div>
            </div>
          </CardContent>
        </Card>
          </div>
          </div>

        {/* Enhanced privacy section */}
        <Card className="bg-gradient-to-r from-slate-900 to-gray-900 text-white border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">
              Privacy isn't negotiable
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-300 mb-8">
              <div className="flex flex-col items-center">
                <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                <div className="font-semibold text-lg">No accounts required</div>
                <div className="text-sm font-medium">Start immediately, no signup needed</div>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="w-6 h-6 text-green-400 mb-2" />
                <div className="font-semibold text-lg">Zero data sold</div>
                <div className="text-sm font-medium">We never sell your data to anyone</div>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="w-6 h-6 text-green-400 mb-2" />
                <div className="font-semibold text-lg">Auto-delete</div>
                <div className="text-sm font-medium">Submissions automatically deleted after 30 days</div>
              </div>
            </div>
            
            <button
              onClick={() => window.location.href = '/start-simple'}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl inline-flex items-center gap-2"
            >
              Try it risk-free
              <ArrowRight className="w-5 h-5" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}