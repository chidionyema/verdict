'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { JudgeEarningsCalculator } from '@/components/judge/JudgeEarningsCalculator';
import { LiveJudgeActivity } from '@/components/judge/LiveJudgeActivity';
import { JudgeOnboardingTracker } from '@/components/judge/JudgeOnboardingTracker';
import { JudgeSuccessStories } from '@/components/judge/JudgeSuccessStories';
import { 
  CheckCircle, 
  DollarSign, 
  Star, 
  Clock, 
  Shield,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Play,
  BookOpen,
  Target,
  Zap,
  Gift
} from 'lucide-react';
import { motion } from 'framer-motion';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface JudgeStat {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export default function BecomeJudgePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isJudge, setIsJudge] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_judge')
          .eq('id', user.id)
          .single();

        setIsJudge(!!(profile as any)?.is_judge);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats: JudgeStat[] = [
    {
      label: 'Active Judges',
      value: '2,847',
      icon: <Users className="h-5 w-5" />,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      label: 'Avg Weekly Earnings',
      value: '$127',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-600'
    },
    {
      label: 'Top Judge This Week',
      value: '$412',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'from-purple-500 to-pink-600'
    },
    {
      label: 'Avg Response Time',
      value: '4.2 min',
      icon: <Clock className="h-5 w-5" />,
      color: 'from-orange-500 to-red-600'
    }
  ];

  const benefits = [
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: 'Earn Real Money',
      description: '$0.60 - $2.00 per verdict based on complexity. Weekly payouts via Stripe.',
      highlight: true
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: '100% Flexible',
      description: 'Work whenever you want. No minimums, no schedules. Perfect side hustle.',
      highlight: false
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Help Real People',
      description: 'Your feedback helps with dating profiles, career moves, and life decisions.',
      highlight: false
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: 'Level Up System',
      description: 'Unlock higher-paying requests and bonuses as you build reputation.',
      highlight: true
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Easy to Start',
      description: '5-minute qualification. No experience needed, just good judgment.',
      highlight: false
    },
    {
      icon: <Gift className="h-6 w-6" />,
      title: 'Bonuses & Perks',
      description: 'Streak bonuses, quality bonuses, and exclusive judge community access.',
      highlight: false
    }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Expert Judge',
      earnings: '$1,847/month',
      quote: "I judge during my commute and lunch breaks. Last month I made enough to cover my car payment!",
      avatar: '👩‍💼'
    },
    {
      name: 'Mike R.',
      role: 'Weekend Judge',
      earnings: '$320/month',
      quote: "Perfect weekend side hustle. I enjoy helping people and the extra income is great for my savings.",
      avatar: '👨‍🏫'
    },
    {
      name: 'Emma L.',
      role: 'Top Judge',
      earnings: '$2,400/month',
      quote: "Started as a side gig, now it's a significant income stream. The flexibility is unmatched.",
      avatar: '👩‍⚖️'
    }
  ];

  const handleStartQualification = () => {
    if (!user) {
      // Store intent to become judge
      localStorage.setItem('verdict_judge_intent', 'true');
      router.push('/auth/signup?redirect=/judge/qualify');
    } else if (isJudge) {
      router.push('/judge');
    } else {
      router.push('/judge/qualify');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Join 2,847 Active Judges</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Turn Your Opinion Into
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Real Income
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Help people make better decisions while earning $50-$400+ per week. 
              Work on your schedule, get paid weekly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartQualification}
                className="px-8 py-4 bg-white text-purple-700 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
              >
                {isJudge ? 'Go to Judge Dashboard' : 'Start 5-Min Qualification'}
                <ChevronRight className="h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-bold text-lg hover:bg-white/30 transition-all flex items-center justify-center gap-2"
              >
                <Play className="h-5 w-5" />
                Watch 2-min Demo
              </motion.button>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                  <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-2 mx-auto`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Judges Love Verdict
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl border-2 ${
                  benefit.highlight 
                    ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50' 
                    : 'border-gray-200 bg-white'
                } hover:shadow-lg transition-all`}
              >
                <div className={`w-12 h-12 ${
                  benefit.highlight ? 'bg-indigo-600' : 'bg-gray-200'
                } rounded-xl flex items-center justify-center mb-4`}>
                  <div className={benefit.highlight ? 'text-white' : 'text-gray-700'}>
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Activity & Calculator Side by Side */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Calculate Your Earnings</h3>
              <JudgeEarningsCalculator />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Live Judge Activity</h3>
              <LiveJudgeActivity />
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Real Judges, Real Success
          </h2>
          <JudgeSuccessStories />
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gray-50" id="demo">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How to Become a Judge
          </h2>
          
          <JudgeOnboardingTracker currentStep={-1} />
          
          <div className="mt-12 text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartQualification}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-2"
            >
              <Zap className="h-5 w-5" />
              {isJudge ? 'Go to Dashboard' : 'Start Qualification Now'}
            </motion.button>
            
            <p className="mt-4 text-gray-600">
              Average time to complete: <strong>5 minutes</strong>
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Common Questions
          </h2>
          
          <div className="space-y-6">
            <details className="bg-gray-50 rounded-xl p-6 group cursor-pointer">
              <summary className="font-bold text-lg flex items-center justify-between">
                How much can I really earn?
                <ChevronRight className="h-5 w-5 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600">
                Earnings depend on your availability and speed. New judges typically earn $50-150/week 
                working 5-10 hours. Experienced judges earn $200-400/week, with top performers exceeding 
                $500/week. You're paid per verdict, not hourly.
              </p>
            </details>
            
            <details className="bg-gray-50 rounded-xl p-6 group cursor-pointer">
              <summary className="font-bold text-lg flex items-center justify-between">
                When and how do I get paid?
                <ChevronRight className="h-5 w-5 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600">
                Payouts are processed weekly via Stripe. Earnings become available after a 7-day 
                maturation period. You can request payouts anytime your available balance exceeds $20. 
                Payments typically arrive within 1-3 business days.
              </p>
            </details>
            
            <details className="bg-gray-50 rounded-xl p-6 group cursor-pointer">
              <summary className="font-bold text-lg flex items-center justify-between">
                What if I fail the qualification?
                <ChevronRight className="h-5 w-5 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600">
                No worries! You can retake the qualification quiz after 24 hours. We provide feedback 
                on what to improve. Most people pass on their second attempt. The quiz ensures judges 
                provide helpful, constructive feedback.
              </p>
            </details>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join 2,847 judges already earning on Verdict
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartQualification}
            className="px-8 py-4 bg-white text-purple-700 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-2"
          >
            {isJudge ? 'Go to Judge Dashboard' : 'Start 5-Minute Qualification'}
            <ChevronRight className="h-5 w-5" />
          </motion.button>
          
          <div className="mt-8 flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>No experience needed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Work anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <span>Weekly payouts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}