"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { DynamicHero } from "@/components/personalization/DynamicHero";
import { FeaturesComparison } from "@/components/landing/features-comparison";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { FeatureDiscoveryBanner } from "@/components/discovery/FeatureDiscoveryBanner";
import { ReviewerShowcase } from "@/components/landing/reviewer-showcase";
import { InteractiveFeedbackPreview } from "@/components/landing/InteractiveFeedbackPreview";
import { PricingTableSection } from "@/components/landing/pricing-table";
import { EconomyExplanationSection } from "@/components/landing/economy-explanation";
import { SmartExitIntent } from "@/components/conversion/SmartExitIntent";
import { LiveActivityTicker } from "@/components/social-proof/LiveActivityTicker";
import { getSchemaPrice, getPricingTexts } from "@/lib/localization";
import { Clock, Shield, CheckCircle, Eye, Star, Users, Lock } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const pricing = getPricingTexts();
  const schemaPrice = getSchemaPrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Review / Product schema for SEO */}
      <Script
        id="feedback-review-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "AskVerdict – Anonymous Feedback from Real People",
            description:
              "Get 3 comprehensive feedback reports on your photo, text, or decision within 2 hours. Anonymous, fast, and unfiltered feedback with ratings, strengths, and actionable advice.",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "2500",
            },
            offers: {
              "@type": "Offer",
              price: schemaPrice.price,
              priceCurrency: schemaPrice.priceCurrency,
              availability: "https://schema.org/InStock",
            },
          }),
        }}
      />

      {/* Live Activity Ticker */}
      <LiveActivityTicker />

      {/* Feature Discovery Banner */}
      <FeatureDiscoveryBanner />

      {/* Dynamic Personalized Hero Section */}
      <DynamicHero />
      
      {/* CRITICAL: Economy Explanation - Move to prominent position */}
      <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
            <span className="text-sm font-medium text-amber-800">How It Works</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Two Simple Ways to Get Feedback
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Path */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200">
              <div className="text-2xl mb-3">🆓</div>
              <h3 className="text-lg font-bold text-green-900 mb-2">Free Path</h3>
              <p className="text-gray-700 mb-4">Judge 3 submissions → Earn 1 credit → Submit for free</p>
              <div className="text-sm text-green-800 bg-green-50 rounded-lg p-3">
                Help others decide, get free feedback in return
              </div>
            </div>
            
            {/* Paid Path */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="text-lg font-bold text-purple-900 mb-2">Instant Path</h3>
              <p className="text-gray-700 mb-4">Pay {pricing.privateSubmissionPrice} → Skip judging → Get private results</p>
              <div className="text-sm text-purple-800 bg-purple-50 rounded-lg p-3">
                Perfect when you're in a hurry
              </div>
            </div>
          </div>
          <p className="text-gray-600 mt-6">Both paths give you 3 honest feedback reports from real people.</p>
        </div>
      </div>
      
      {/* Quick Demo - Show how it works visually */}
      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 backdrop-blur-sm">
        <InteractiveDemo />
      </div>
      
      {/* Social Proof - Early trust building */}
      <SocialProofSection />
      
      {/* Interactive Preview Demo - Show actual feedback quality */}
      <InteractiveFeedbackPreview />
      
      {/* Features Comparison */}
      <FeaturesComparison />

      
      
      {/* Reviewer showcase with quality indicators */}
      <ReviewerShowcase />


      {/* Pricing table */}
      <PricingTableSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
        <div className="text-center">

          {/* How Judging Works Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Want to be a reviewer?</h2>
            <p className="text-lg text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Help others make better decisions and earn rewards.
            </p>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 mb-12 hover:shadow-2xl transition-all duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Review submissions</h4>
                  <p className="text-gray-600 text-sm">In your areas of interest</p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Get paid</h4>
                  <p className="text-gray-600 text-sm">Per quality response</p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Flexible</h4>
                  <p className="text-gray-600 text-sm">Review when you have time</p>
                </div>
              </div>
              <div className="text-center">
                <a
                  href="/become-reviewer"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Join as a Reviewer →
                </a>
              </div>
            </div>
          </div>

          {/* FAQ Section - Streamlined */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Quick Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 group">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">Free vs Paid?</h3>
                <p className="text-gray-600"><strong>Free:</strong> {pricing.freePath} → Submit (public). <strong>Paid:</strong> {pricing.paidPath} → Submit privately.</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 group">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">How anonymous?</h3>
                <p className="text-gray-600">Completely anonymous. No profiles or names shared. Private submissions never appear in public feed.</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 group">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">What if no responses?</h3>
                <p className="text-gray-600">3 reports guaranteed within 24 hours or full refund. Most get results in under 2 hours.</p>
              </div>
            </div>
          </div>

          <div className="mt-20 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">How It Works</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Two paths to get feedback. Choose what fits your needs.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Free Path */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-xl p-8 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">Free</div>
                  <h3 className="text-2xl font-bold text-gray-900">Community Path</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Review 3 submissions</h4>
                      <p className="text-gray-600 text-sm">Browse the feed and review others' submissions (~15 min)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Earn 1 credit</h4>
                      <p className="text-gray-600 text-sm">Automatic credit after 3 reviews</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Submit & get feedback</h4>
                      <p className="text-gray-600 text-sm">Use credit to submit (public in feed), get 3 reports</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Paid Path */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl shadow-xl p-8 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">{pricing.privateSubmissionPrice}</div>
                  <h3 className="text-2xl font-bold text-gray-900">Private Path</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Pay {pricing.privateSubmissionPrice}</h4>
                      <p className="text-gray-600 text-sm">One-time payment, no judging required</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Submit privately</h4>
                      <p className="text-gray-600 text-sm">Your submission stays completely confidential</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Get instant results</h4>
                      <p className="text-gray-600 text-sm">3 feedback reports within 2 hours (private)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Testimonials */}
          <div className="mt-20 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">What Our Users Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"Finally got honest feedback on my dating photos. Turns out the group shot was killing my profile."</p>
                <div className="text-sm text-gray-500">— Mike, 28</div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"Used it before a pitch. One reviewer caught a flaw in my pricing slide I'd missed for weeks."</p>
                <div className="text-sm text-gray-500">— Startup founder</div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"Super quick, and the responses were way more honest than I expected."</p>
                <div className="text-sm text-gray-500">— Beta user</div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Verified Human Reviewers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span>24/7 Available</span>
              </div>
            </div>
          </div>
          {/* Final Conversion CTA - Dual Path */}
          <div className="mt-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white text-center relative overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
            {/* Floating orbs */}
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/20 rounded-full filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-pink-300/30 rounded-full filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6 animate-fade-in">
                Ready to Get Started?
              </h2>
              <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto animate-fade-in-up">
                Choose your path: Review others to earn free credits, or pay {pricing.privateSubmissionPrice} for instant private results. Both get you 3 honest feedback reports.
              </p>
              
              <div className="space-y-6">
                {/* Dual Path CTAs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  <button
                    onClick={() => router.push('/start')}
                    className="bg-white text-indigo-600 px-8 py-5 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 group"
                  >
                    <div className="flex flex-col items-center">
                      <span className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Start Reviewing (Free)
                      </span>
                      <span className="text-sm opacity-80 mt-1">Review 3 → Earn 1 credit</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => router.push('/start')}
                    className="bg-indigo-800 text-white border-2 border-white/30 px-8 py-5 rounded-2xl text-lg font-bold hover:bg-indigo-900 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 group"
                  >
                    <div className="flex flex-col items-center">
                      <span className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Submit Privately ({pricing.privateSubmissionPrice})
                      </span>
                      <span className="text-sm opacity-90 mt-1">Skip judging → Instant</span>
                    </div>
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-indigo-100 animate-fade-in-up">
                  <div className="flex items-center gap-2 group hover:text-white transition-colors">
                    <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>3 feedback reports guaranteed</span>
                  </div>
                  <div className="flex items-center gap-2 group hover:text-white transition-colors">
                    <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>100% anonymous</span>
                  </div>
                  <div className="flex items-center gap-2 group hover:text-white transition-colors">
                    <Clock className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>Results in hours, not days</span>
                  </div>
                </div>
                
                <p className="text-sm text-indigo-200 mt-4 animate-fade-in">
                  No credit card required for free path • Choose what works for you
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Exit-intent modal with personalized offers */}
      <SmartExitIntent />

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-4 left-0 right-0 px-4 sm:hidden z-40">
        <button
          onClick={() => router.push('/start')}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-xl font-semibold text-base flex items-center justify-center gap-2 min-h-[48px] backdrop-blur-sm border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          Start judging (free)
          <span className="text-lg">→</span>
        </button>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatingAnimation {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.05);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-slide-in-from-bottom {
          animation: slideInFromBottom 0.8s ease-out forwards;
        }

        .animate-floating {
          animation: floatingAnimation 3s ease-in-out infinite;
        }

        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Glassmorphism utility */
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Enhanced hover shadows */
        .hover\\:shadow-3xl:hover {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}
