'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Gift, Clock, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExitIntentOffer {
  id: string;
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

export function SmartExitIntent() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [userBehavior, setUserBehavior] = useState({
    timeOnPage: 0,
    scrollDepth: 0,
    mouseMovements: 0,
    focusedSection: '',
  });
  const [selectedOffer, setSelectedOffer] = useState<ExitIntentOffer | null>(null);
  const [email, setEmail] = useState('');
  const [hasShown, setHasShown] = useState(false);

  // Track user behavior
  useEffect(() => {
    let timeInterval: NodeJS.Timeout;
    let mouseTracker = 0;

    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setUserBehavior(prev => ({ ...prev, scrollDepth: Math.max(prev.scrollDepth, scrollPercentage) }));
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseTracker++;
      if (mouseTracker % 50 === 0) { // Update every 50 movements
        setUserBehavior(prev => ({ ...prev, mouseMovements: prev.mouseMovements + 1 }));
      }

      // Detect exit intent (mouse leaving viewport near top)
      if (e.clientY <= 5 && !hasShown && userBehavior.timeOnPage > 10) {
        showModal();
      }
    };

    timeInterval = setInterval(() => {
      setUserBehavior(prev => ({ ...prev, timeOnPage: prev.timeOnPage + 1 }));
    }, 1000);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hasShown, userBehavior.timeOnPage]);

  const getPersonalizedOffer = useCallback((): ExitIntentOffer => {
    // High engagement (scrolled far, lots of time)
    if (userBehavior.scrollDepth > 70 && userBehavior.timeOnPage > 30) {
      return {
        id: 'vip',
        title: 'VIP Early Access',
        description: 'You seem interested! Get exclusive VIP access to new features and priority support.',
        cta: 'Claim VIP Access',
        icon: <Sparkles className="h-6 w-6" />,
        action: () => {
          localStorage.setItem('verdict_vip_claimed', 'true');
          router.push('/submit?vip=true');
        },
        color: 'from-purple-600 to-pink-600'
      };
    }

    // Quick bouncer (low time, low scroll)
    if (userBehavior.timeOnPage < 15 && userBehavior.scrollDepth < 30) {
      return {
        id: 'quick',
        title: 'Wait! Try it free first',
        description: 'No credit card needed. Judge 3 others, get 1 free submission.',
        cta: 'Start Free →',
        icon: <Gift className="h-6 w-6" />,
        action: () => router.push('/feed'),
        color: 'from-green-600 to-emerald-600'
      };
    }

    // Price sensitive (viewed pricing)
    if (userBehavior.focusedSection === 'pricing') {
      return {
        id: 'discount',
        title: '20% off your first submission',
        description: 'Exclusive one-time discount. Valid for 24 hours only.',
        cta: 'Get Discount Code',
        icon: <Gift className="h-6 w-6" />,
        action: () => {
          localStorage.setItem('verdict_discount', 'SAVE20');
          router.push('/submit?discount=SAVE20');
        },
        color: 'from-orange-600 to-red-600'
      };
    }

    // Default offer
    return {
      id: 'default',
      title: 'Before you go...',
      description: 'Get our free guide: "10 Photo Mistakes That Kill Your Dating Profile"',
      cta: 'Send Me The Guide',
      icon: <Shield className="h-6 w-6" />,
      action: () => setSelectedOffer(null), // Show email form
      color: 'from-indigo-600 to-purple-600'
    };
  }, [userBehavior, router]);

  const showModal = () => {
    if (hasShown) return;
    
    const offer = getPersonalizedOffer();
    setSelectedOffer(offer);
    setIsVisible(true);
    setHasShown(true);
    
    // Track exit intent shown
    localStorage.setItem('verdict_exit_intent_shown', new Date().toISOString());
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to your email service
    localStorage.setItem('verdict_email', email);
    localStorage.setItem('verdict_guide_requested', 'true');
    setIsVisible(false);
    router.push('/submit?welcome=true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${selectedOffer?.color || 'from-indigo-600 to-purple-600'} p-6 text-white relative`}>
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            {selectedOffer?.icon}
            <span className="text-sm font-medium uppercase tracking-wider opacity-90">
              Special Offer
            </span>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            {selectedOffer?.title}
          </h2>
          <p className="text-white/90">
            {selectedOffer?.description}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {selectedOffer?.id === 'default' ? (
            // Email capture form
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Your email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                Send Me The Free Guide
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                No spam, ever. Unsubscribe anytime.
              </p>
            </form>
          ) : (
            // Direct action button
            <div className="space-y-4">
              <button
                onClick={selectedOffer?.action}
                className={`w-full bg-gradient-to-r ${selectedOffer?.color} text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2`}
              >
                {selectedOffer?.cta}
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setIsVisible(false)}
                className="w-full text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                No thanks, I'll browse more
              </button>
            </div>
          )}

          {/* Trust indicators */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-500" />
                100% Anonymous
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-blue-500" />
                Results in 24h
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}