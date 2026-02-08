'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Heart, Clock, ArrowRight, Gift } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: 'landing' | 'signup' | 'create' | 'pricing';
}

export function ExitIntentModal({ isOpen, onClose, source = 'landing' }: ExitIntentModalProps) {
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
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || loading) return null;

  // Different content based on user state and source
  const getModalContent = () => {
    if (user) {
      // Authenticated user trying to leave
      return {
        title: "Wait! Don't miss out",
        subtitle: "You're so close to getting valuable feedback",
        offer: "Complete one quick request and see the magic happen",
        cta: "Try Creating a Request",
        ctaLink: "/create",
        icon: Sparkles,
        bgGradient: "from-purple-500 to-indigo-600"
      };
    }

    if (source === 'signup') {
      return {
        title: "Almost there!",
        subtitle: "Join thousands getting honest feedback",
        offer: "Sign up now and get 3 free credits to start immediately",
        cta: "Complete Signup",
        ctaLink: "/auth/signup",
        icon: Gift,
        bgGradient: "from-green-500 to-emerald-600"
      };
    }

    if (source === 'pricing') {
      return {
        title: "Still deciding?",
        subtitle: "Try the community path first - it's completely free!",
        offer: "Judge 3 requests and earn free credits. No payment required.",
        cta: "Start Free Trial",
        ctaLink: "/auth/signup",
        icon: Heart,
        bgGradient: "from-green-500 to-teal-600"
      };
    }

    // Default landing page exit intent
    return {
      title: "Before you go...",
      subtitle: "See what honest feedback can do for you",
      offer: "Join free, get 3 credits, and see real feedback in action",
      cta: "Get Started Free",
      ctaLink: "/auth/signup",
      icon: Sparkles,
      bgGradient: "from-indigo-500 to-purple-600"
    };
  };

  const content = getModalContent();
  const Icon = content.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className={`bg-gradient-to-r ${content.bgGradient} p-6 text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
            <p className="text-white/90">{content.subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Offer */}
          <div className="text-center mb-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              {content.offer}
            </p>
          </div>

          {/* Value Props */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span>100% anonymous feedback</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span>Results in 2 hours or less</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span>Real people, honest opinions</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Link
              href={content.ctaLink}
              onClick={onClose}
              className={`w-full bg-gradient-to-r ${content.bgGradient} text-white py-4 px-6 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
            >
              {content.cta}
              <ArrowRight className="h-5 w-5" />
            </Link>
            
            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 py-3 font-medium min-h-[44px]"
            >
              Maybe later
            </button>
          </div>

          {/* Trust signals */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>No commitment</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>Free to start</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}