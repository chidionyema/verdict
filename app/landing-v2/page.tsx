'use client';

import { HeroSection } from '@/components/landing/hero-section';
import { ProductDemo } from '@/components/landing/product-demo';
import { HowItWorks } from '@/components/landing/how-it-works';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { PricingTableSection } from '@/components/landing/pricing-table';
import { TouchButton } from '@/components/ui/touch-button';
import { 
  ArrowRight,
  Shield, 
  Clock, 
  MessageSquare,
  Star,
  CheckCircle,
  Zap
} from 'lucide-react';

export default function WorldClassLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <HeroSection />

      {/* Interactive Product Demo */}
      <ProductDemo />

      {/* How It Works - Simple 3-step process */}
      <HowItWorks />

      {/* Social Proof with Real Testimonials */}
      <SocialProofSection />
      
      {/* Transparent Pricing */}
      <PricingTableSection />

      {/* Streamlined FAQ Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Quick answers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Completely anonymous?
              </h3>
              <p className="text-sm text-gray-600">
                Yes. Neither side sees any personal info.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Quality guaranteed?
              </h3>
              <p className="text-sm text-gray-600">
                All judges are verified and rated.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                How fast?
              </h3>
              <p className="text-sm text-gray-600">
                Average 47 minutes for all 3 responses.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Become a judge?
              </h3>
              <p className="text-sm text-gray-600">
                Apply anytime. Earn money for helpful reviews.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}