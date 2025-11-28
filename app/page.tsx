"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesComparison } from "@/components/landing/features-comparison";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { FeatureDiscoveryBanner } from "@/components/discovery/FeatureDiscoveryBanner";
import { JudgeSelectionSection } from "@/components/landing/judge-selection";
import { PricingTableSection } from "@/components/landing/pricing-table";
import { ExitIntentModal } from "@/components/ExitIntentModal";
import { Clock, Shield, CheckCircle, Eye, Star, Users } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Review / Product schema for SEO */}
      <Script
        id="verdict-review-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Verdict – Anonymous Feedback from Real People",
            description:
              "Get 3 honest opinions on your photo, text, or decision in under an hour. Anonymous, fast, and unfiltered feedback.",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "12000",
            },
            offers: {
              "@type": "Offer",
              price: "3.49",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
            },
          }),
        }}
      />

      {/* Feature Discovery Banner */}
      <FeatureDiscoveryBanner />

      {/* Hero Section */}
      <HeroSection />
      
      {/* Interactive Demo */}
      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 backdrop-blur-sm">
        <InteractiveDemo />
      </div>
      
      {/* Features Comparison */}
      <FeaturesComparison />
      
      {/* Social Proof */}
      <SocialProofSection />

      {/* Judge selection / credibility */}
      <JudgeSelectionSection />

      {/* Pricing table */}
      <PricingTableSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
        <div className="text-center">

          {/* How Judging Works Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Want to be a judge?</h2>
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
                  <p className="text-gray-600 text-sm">Judge when you have time</p>
                </div>
              </div>
              <div className="text-center">
                <a
                  href="/become-a-judge"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Join as a Judge →
                </a>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Common Questions</h2>
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 group">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">How anonymous is it really?</h3>
                <p className="text-gray-600">Completely anonymous. No profiles, names, or personal information is shared. Judges only see your submission and question.</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 group">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">What if I don't get 3 responses?</h3>
                <p className="text-gray-600">We guarantee all 3 thoughtful responses within 24 hours, or you get a full refund. Most requests get all 3 responses within hours.</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 group">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">How do you ensure quality feedback?</h3>
                <p className="text-gray-600">Our judges are verified humans who must provide detailed, constructive responses. Low-effort answers are rejected and judges are removed.</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 group">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">What types of content can I submit?</h3>
                <p className="text-gray-600">Photos, text, emails, documents, life decisions - anything you need honest feedback on. No NSFW content allowed.</p>
              </div>
            </div>
          </div>

          <div className="mt-20 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-3xl mx-auto border border-white/20 hover:shadow-3xl transition-all duration-500">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-indigo-600 font-bold text-lg">1</span>
                </div>
                <h4 className="font-semibold mb-2">Upload</h4>
                <p className="text-gray-600 text-sm">Share what you need feedback on</p>
              </div>
              <div className="text-center group">
                <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-orange-600 font-bold text-lg">2</span>
                </div>
                <h4 className="font-semibold mb-2">Wait</h4>
                <p className="text-gray-600 text-sm">3 real people review your submission</p>
              </div>
              <div className="text-center group">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-green-600 font-bold text-lg">3</span>
                </div>
                <h4 className="font-semibold mb-2">Decide</h4>
                <p className="text-gray-600 text-sm">Get honest feedback to make your choice</p>
              </div>
            </div>
          </div>

          {/* Sample Verdict Showcase */}
          <div className="mt-20 bg-gradient-to-r from-white/80 via-purple-50/80 to-pink-50/80 backdrop-blur-xl rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl border border-white/30">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">See What You'll Get</h2>
              <p className="text-gray-600">Real verdict from our community (anonymized)</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500">
              <div className="flex items-start gap-4 mb-4">
                <Eye className="h-5 w-5 text-indigo-500 mt-1" />
                <div className="flex-1">
                  <p className="text-gray-600 italic mb-2">"Should I wear this outfit to my job interview?"</p>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                    <div className="text-sm text-gray-700">
                      <strong>Overall Rating:</strong> 8.5/10 
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                  <p className="text-green-800">"Perfect for a professional setting! The color combination shows confidence without being too bold. You'll make a great first impression."</p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <p className="text-blue-800">"The fit looks great and very appropriate. Maybe add a simple watch or small accessories to complete the look. Good luck!"</p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                  <p className="text-purple-800">"Absolutely! This screams 'hire me' in the best way. Professional, polished, and shows attention to detail."</p>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <span className="text-xs text-gray-500">+ 2 more detailed responses</span>
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
                <span>Verified Human Judges</span>
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
          {/* Final Conversion CTA */}
          <div className="mt-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white text-center relative overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
            {/* Floating orbs */}
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/20 rounded-full filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-pink-300/30 rounded-full filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6 animate-fade-in">
                Stop Wondering. Start Knowing.
              </h2>
              <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto animate-fade-in-up">
                Join the movement for honest feedback. Get straight answers in minutes, not days.
              </p>
              
              <div className="space-y-6">
                <button
                  onClick={() => router.push('/start-simple')}
                  className="bg-white text-indigo-600 px-12 py-5 rounded-2xl text-xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 min-w-[320px] group"
                >
                  Get 3 free verdicts
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </button>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-indigo-100 animate-fade-in-up">
                  <div className="flex items-center gap-2 group hover:text-white transition-colors">
                    <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>3 free verdicts included</span>
                  </div>
                  <div className="flex items-center gap-2 group hover:text-white transition-colors">
                    <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>100% anonymous guarantee</span>
                  </div>
                  <div className="flex items-center gap-2 group hover:text-white transition-colors">
                    <Clock className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>Results in under 15 minutes</span>
                  </div>
                </div>
                
                <p className="text-sm text-indigo-200 mt-4 animate-fade-in">
                  No credit card required • Cancel anytime • Currently free during beta
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit-intent modal for conversion capture */}
      <ExitIntentModal />

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-4 left-0 right-0 px-4 sm:hidden z-40">
        <button
          onClick={() => router.push('/start-simple')}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-xl font-semibold text-base flex items-center justify-center gap-2 min-h-[48px] backdrop-blur-sm border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          Get 3 free verdicts
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
