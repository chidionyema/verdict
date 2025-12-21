'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TERMINOLOGY } from '@/lib/terminology';
import { 
  ArrowRight, 
  MessageSquare, 
  Users, 
  Star, 
  Clock,
  Shield,
  Sparkles,
  CheckCircle,
  Play,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * UNIFIED LANDING PAGE
 * Single clear value proposition
 * No confusing dual paths - progressive disclosure
 */
export default function UnifiedLanding() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Redirect authenticated users to their dashboard
      if (user) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Feedback Requests', value: '12,847', icon: MessageSquare },
    { label: 'Active Reviewers', value: '3,291', icon: Users },
    { label: 'Average Rating', value: '4.8/5', icon: Star },
    { label: 'Response Time', value: '4 min', icon: Clock }
  ];

  const features = [
    {
      icon: MessageSquare,
      title: 'Submit Anything',
      description: 'Photos, text, ideas, decisions - get feedback on whatever matters to you'
    },
    {
      icon: Users,
      title: 'Real People',
      description: 'Authentic human opinions from our verified community, not AI'
    },
    {
      icon: Clock,
      title: 'Fast Results',
      description: 'Get detailed feedback in minutes, not days'
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: 'Our review system ensures helpful, constructive feedback'
    }
  ];

  const testimonials = [
    {
      text: "Got amazing feedback on my dating profile. Made the suggested changes and matches increased 3x!",
      author: "Sarah M.",
      role: "Marketing Manager",
      avatar: "👩‍💼"
    },
    {
      text: "The community helped me choose between two job offers. Their insights were spot-on.",
      author: "Mike R.", 
      role: "Software Engineer",
      avatar: "👨‍💻"
    },
    {
      text: "Used it for my startup pitch deck. The feedback was incredibly detailed and actionable.",
      author: "Emma L.",
      role: "Entrepreneur", 
      avatar: "👩‍🚀"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Verdict
              </span>
            </div>

            <div className="flex items-center space-x-6">
              <Link href="/explore" className="text-gray-700 hover:text-gray-900 font-medium">
                Explore
              </Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-gray-900 font-medium">
                How It Works
              </Link>
              <Link href="/auth/login" className="text-gray-700 hover:text-gray-900 font-medium">
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Get honest feedback
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                on anything
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Submit photos, text, ideas, or decisions and get detailed feedback from real people 
              in our trusted community. No AI, just authentic human opinions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-5 w-5" />
                Get Feedback Now
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-400 transition-all flex items-center justify-center gap-2">
                <Play className="h-5 w-5" />
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50"
                >
                  <stat.icon className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why choose Verdict?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We've built the most trusted platform for getting authentic, helpful feedback 
              from real people who care about helping you improve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-16">
            Get feedback in 3 simple steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Submit',
                description: 'Upload your photo, text, or question with context about what feedback you need'
              },
              {
                step: '2', 
                title: 'Review',
                description: 'Our verified community members provide honest, detailed feedback based on your request'
              },
              {
                step: '3',
                title: 'Improve',
                description: 'Get actionable insights to make better decisions and improve your content'
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-8 h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300 transform -translate-x-4"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            Trusted by thousands of users
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100"
              >
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
                <div className="flex items-center mt-4">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get better feedback?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are making better decisions with help from our community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Start Free Today
            </Link>
            
            <Link
              href="/explore"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <Users className="h-5 w-5" />
              Explore Community
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-indigo-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>No subscription required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Quality guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Verdict</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link>
              <Link href="/help" className="text-gray-400 hover:text-white">Help</Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Verdict. Get honest feedback on anything.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}