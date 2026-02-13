'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Upload,
  Users,
  MessageSquare,
  Star,
  CheckCircle,
  Shield,
  Clock,
  Zap,
  Lock,
  Play,
  Quote,
} from 'lucide-react';
import { EnhancedHero } from './EnhancedHero';
import { SocialProofStats } from './SocialProofStats';
import { Testimonials } from './Testimonials';
import { UseCases } from './UseCases';
import { TrustIndicators } from './TrustIndicators';
import { LiveActivityFeed } from './LiveActivityFeed';
import { StickyCTA } from './StickyCTA';
import { useLocalizedPricing } from '@/hooks/use-pricing';
import { trackABEvent } from '@/lib/ab-testing';

interface StreamlinedLandingProps {
  variant?: 'A' | 'B';
  experimentId?: string;
}

export function StreamlinedLanding({ variant = 'A', experimentId }: StreamlinedLandingProps) {
  const router = useRouter();
  const pricing = useLocalizedPricing();

  // Track CTA clicks for A/B testing
  const handleCTAClick = (cta: 'primary' | 'secondary') => {
    if (experimentId) {
      trackABEvent(experimentId, variant, cta === 'primary' ? 'cta_click' : 'secondary_cta_click');
    }
  };

  const handleUseCaseCTA = () => {
    router.push('/submit');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Live Activity Banner */}
      <LiveActivityFeed variant="banner" />

      {/* SECTION 1: Enhanced Hero */}
      <EnhancedHero variant={variant} onCTAClick={handleCTAClick} />

      {/* SECTION 2: Social Proof Stats */}
      <div className="bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SocialProofStats variant="compact" showCategories={false} />
        </div>
      </div>

      {/* SECTION 3: How It Works + Demo */}
      <DemoSection />

      {/* SECTION 4: Use Cases */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <UseCases variant="grid" showCTA={false} onCTAClick={handleUseCaseCTA} />
        </div>
      </div>

      {/* SECTION 5: Testimonials */}
      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Testimonials variant="carousel" />
        </div>
      </div>

      {/* SECTION 6: Trust Indicators */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustIndicators variant="full" />
        </div>
      </div>

      {/* SECTION 7: Pricing (Two Paths) */}
      <PricingSection pricing={pricing} />

      {/* SECTION 8: Final CTA */}
      <FinalCTASection pricing={pricing} />

      {/* Floating Activity Feed (desktop only) */}
      <LiveActivityFeed variant="floating" />

      {/* Sticky CTA (mobile only) */}
      <StickyCTA
        ctaText="Get 3 Honest Opinions"
        ctaLink="/submit"
        secondaryText="Free to start"
        showTrust={true}
      />
    </div>
  );
}

// ============================================
// SECTION 2: Demo Section
// ============================================
function DemoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: Upload,
      title: "Submit anything",
      description: "Photo, text, decision — takes 30 seconds",
      visual: (
        <div className="bg-gray-100 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Upload className="h-8 w-8 text-indigo-600" />
          </div>
          <p className="text-gray-600 text-sm">"Should I wear this to my interview?"</p>
          <div className="mt-4 bg-gradient-to-br from-blue-100 to-indigo-100 h-32 rounded-lg" />
        </div>
      ),
    },
    {
      icon: Users,
      title: "3 strangers review",
      description: "Verified reviewers give honest opinions",
      visual: (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                i === 1 ? 'bg-green-500' : i === 2 ? 'bg-blue-500' : 'bg-purple-500'
              }`}>
                #{i}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
              <CheckCircle className={`h-5 w-5 ${i <= 2 ? 'text-green-500' : 'text-gray-300'}`} />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: MessageSquare,
      title: "Get the truth",
      description: "Detailed feedback with ratings & advice",
      visual: (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-gray-900">8.7/10</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className={`h-5 w-5 ${i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
          </div>
          {[
            { score: 9, text: "Perfect choice! Very professional." },
            { score: 8, text: "Great, maybe try a darker tie." },
          ].map((r, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">Reviewer {i + 1}</span>
                <span className="text-sm font-bold text-indigo-600">{r.score}/10</span>
              </div>
              <p className="text-sm text-gray-700">"{r.text}"</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isInView, steps.length]);

  return (
    <section id="demo-section" ref={ref} className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Submit → Wait → Get brutally honest feedback. That's it.
          </p>
        </motion.div>

        {/* Steps + Visual */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              return (
                <motion.button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                          Step {index + 1}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3 }}
                      className="h-1 bg-indigo-600 rounded-full mt-4"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Visual Preview */}
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Preview</span>
              <span className="text-xs text-indigo-600 font-medium">Step {activeStep + 1} of 3</span>
            </div>
            {steps[activeStep].visual}
          </motion.div>
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ delay: 0.4 }}
          className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-3xl mx-auto"
        >
          <Quote className="h-8 w-8 text-indigo-200 mb-4" />
          <blockquote className="text-xl text-gray-700 mb-4">
            "My friends said my dating photos were fine. Three strangers told me the truth — my main photo was killing my matches. Changed it, and got 10x more likes."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
            <div>
              <div className="font-semibold text-gray-900">Verified User #1204</div>
              <div className="text-sm text-gray-500">Dating profile feedback</div>
            </div>
            <div className="ml-auto flex gap-1">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// SECTION 3: Pricing
// ============================================
function PricingSection({ pricing }: { pricing: ReturnType<typeof useLocalizedPricing> }) {
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const paths = [
    {
      id: 'free',
      name: 'Community Path',
      badge: 'Free',
      price: '£0',
      priceDetail: 'Earn credits by reviewing',
      icon: Users,
      color: 'green',
      features: [
        'Review 3 submissions (~15 min)',
        'Earn 1 credit automatically',
        'Submit your question (public)',
        'Get 3 honest feedback reports',
      ],
      cta: 'Start Reviewing Free',
      action: () => router.push('/feed'),
    },
    {
      id: 'paid',
      name: 'Private Path',
      badge: 'Instant',
      price: pricing.privatePrice,
      priceDetail: 'One-time payment',
      icon: Lock,
      color: 'purple',
      features: [
        'No reviewing required',
        'Submit privately (confidential)',
        'Get 3 feedback reports in <1hr',
        'Never appears in public feed',
      ],
      cta: 'Submit Privately',
      action: () => router.push('/submit?private=true'),
      highlight: true,
    },
  ];

  return (
    <section ref={ref} className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Two ways to get feedback
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Both paths get you 3 honest feedback reports. Choose what fits your needs.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {paths.map((path, index) => {
            const Icon = path.icon;
            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-3xl p-8 ${
                  path.highlight
                    ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 shadow-xl'
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                {path.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-sm font-bold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    path.color === 'green' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    <Icon className={`h-7 w-7 ${
                      path.color === 'green' ? 'text-green-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{path.name}</h3>
                    <span className={`text-sm font-medium ${
                      path.color === 'green' ? 'text-green-600' : 'text-purple-600'
                    }`}>
                      {path.badge}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-black text-gray-900">{path.price}</span>
                  <span className="text-gray-500 ml-2">{path.priceDetail}</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {path.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${
                        path.color === 'green' ? 'text-green-500' : 'text-purple-500'
                      }`} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={path.action}
                  className={`w-full py-4 min-h-[56px] rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 active:scale-[0.98] ${
                    path.highlight
                      ? 'bg-purple-600 hover:bg-purple-700 text-white focus-visible:ring-purple-500'
                      : 'bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-500'
                  }`}
                >
                  {path.cta}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 1 : 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-full">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">
              3 feedback reports guaranteed or full refund
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// SECTION 4: Final CTA
// ============================================
function FinalCTASection({ pricing }: { pricing: ReturnType<typeof useLocalizedPricing> }) {
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stop wondering. Start knowing.
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Get the honest feedback you need to make better decisions.
            Your friends won't tell you. Strangers will.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => router.push('/submit')}
              className="group px-8 py-5 min-h-[60px] bg-white text-indigo-600 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600 active:scale-[0.98]"
            >
              Get 3 Honest Opinions
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-indigo-100">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span>Results in &lt;2 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>100% anonymous</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Free to start</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default StreamlinedLanding;
