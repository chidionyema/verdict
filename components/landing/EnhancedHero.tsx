'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Play,
  Star,
  Shield,
  Clock,
  CheckCircle,
  Users,
  Zap,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrustBadgesNearCTA } from './TrustIndicators';

interface EnhancedHeroProps {
  variant?: 'A' | 'B';
  onCTAClick?: (cta: 'primary' | 'secondary') => void;
}

export function EnhancedHero({ variant = 'A', onCTAClick }: EnhancedHeroProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handlePrimaryCTA = () => {
    onCTAClick?.('primary');
    router.push('/submit');
  };

  const handleSecondaryCTA = () => {
    onCTAClick?.('secondary');
    document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Variant A: Emotional hook (problem-focused)
  // Variant B: Benefit-focused (solution-focused)
  const copy = {
    A: {
      badge: "Your friends are too nice",
      headline: "Get the truth.",
      subheadline: "Not the polite version.",
      description: "Submit anything. 3 strangers tell you what they really think. Anonymous. Fast. Unfiltered.",
      cta: "Get 3 Honest Opinions",
      secondaryCta: "See Sample Feedback",
    },
    B: {
      badge: "Trusted by 8,000+ users",
      headline: "Honest feedback",
      subheadline: "in under 2 hours.",
      description: "Photo, text, or decision - get 3 detailed reviews from verified strangers. No sugarcoating.",
      cta: "Get Feedback Now",
      secondaryCta: "How It Works",
    }
  };

  const content = copy[variant];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 border border-indigo-200 rounded-full mb-6"
            >
              <Zap className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">{content.badge}</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-4">
              {content.headline}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                {content.subheadline}
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
              {content.description}
            </p>

            {/* Value props row */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-8">
              <ValueProp icon={MessageSquare} text="3 detailed reviews" />
              <ValueProp icon={Clock} text="Under 2 hours" />
              <ValueProp icon={Shield} text="100% anonymous" />
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
              <button
                onClick={handlePrimaryCTA}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <span className="flex items-center justify-center gap-2">
                  {content.cta}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <button
                onClick={handleSecondaryCTA}
                className="group px-6 py-4 bg-white/80 backdrop-blur border-2 border-gray-200 text-gray-700 text-lg font-semibold rounded-2xl hover:border-indigo-300 hover:bg-white transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <span className="flex items-center justify-center gap-2">
                  <Play className="h-5 w-5 text-indigo-600" />
                  {content.secondaryCta}
                </span>
              </button>
            </div>

            {/* Trust badges */}
            <TrustBadgesNearCTA />
          </motion.div>

          {/* Right: Product Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.95 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Feedback Preview Card */}
            <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between text-white">
                  <span className="font-semibold">Your Feedback Results</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm opacity-90">3 of 3 received</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Overall Score */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Average Rating</div>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-bold text-gray-900">8.7</span>
                      <span className="text-gray-400">/10</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map((i) => (
                        <Star key={i} className={`h-5 w-5 ${i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">Based on 3 reviews</span>
                  </div>
                </div>

                {/* Sample Responses */}
                <div className="space-y-3">
                  {[
                    { score: 9, text: "Great choice! The color really suits you.", time: "12 min ago" },
                    { score: 8, text: "Solid, but maybe try a different angle.", time: "28 min ago" },
                    { score: 9, text: "This will definitely make a good impression.", time: "47 min ago" },
                  ].map((response, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.15 }}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            #{i + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-700">Anonymous Reviewer</span>
                        </div>
                        <span className="text-sm font-bold text-indigo-600">{response.score}/10</span>
                      </div>
                      <p className="text-gray-600 text-sm">"{response.text}"</p>
                      <p className="text-xs text-gray-400 mt-2">{response.time}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Bottom CTA */}
                <div className="pt-4 text-center">
                  <p className="text-sm text-gray-500">
                    This is what your feedback looks like.{' '}
                    <button onClick={handlePrimaryCTA} className="text-indigo-600 font-semibold hover:underline">
                      Get yours now
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
            >
              Free to start
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg border border-gray-200 flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              47 people reviewing now
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex"
      >
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <span className="text-xs uppercase tracking-wider">See how it works</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-gray-300 rounded-full flex items-start justify-center pt-2"
          >
            <div className="w-1.5 h-3 bg-gray-400 rounded-full" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function ValueProp({ icon: Icon, text }: { icon: typeof MessageSquare; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-green-600" />
      </div>
      <span>{text}</span>
    </div>
  );
}

export default EnhancedHero;
