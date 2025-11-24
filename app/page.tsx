'use client';

import { useRouter } from 'next/navigation';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesComparison } from '@/components/landing/features-comparison';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { InteractiveDemo } from '@/components/landing/interactive-demo';
import { Clock, Shield, CheckCircle, Eye, Star } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Interactive Demo */}
      <div className="bg-white">
        <InteractiveDemo />
      </div>
      
      {/* Features Comparison */}
      <FeaturesComparison />
      
      {/* Social Proof */}
      <SocialProofSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">

          {/* FAQ Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-3 text-gray-900">How anonymous is it really?</h3>
                <p className="text-gray-600">Completely anonymous. No profiles, names, or personal information is shared. Judges only see your submission and question.</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-3 text-gray-900">What if I don't get 10 responses?</h3>
                <p className="text-gray-600">We guarantee at least 8 quality responses within 24 hours, or you get a full refund. Most requests get 10+ responses within hours.</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-3 text-gray-900">How do you ensure quality feedback?</h3>
                <p className="text-gray-600">Our judges are verified humans who must provide detailed, constructive responses. Low-effort answers are rejected and judges are removed.</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-3 text-gray-900">What types of content can I submit?</h3>
                <p className="text-gray-600">Photos, text, emails, documents, life decisions - anything you need honest feedback on. No NSFW content allowed.</p>
              </div>
            </div>
          </div>

          <div className="mt-20 bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Upload</h4>
                <p className="text-gray-600 text-sm">Share what you need feedback on</p>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Wait</h4>
                <p className="text-gray-600 text-sm">10 judges review your submission</p>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Decide</h4>
                <p className="text-gray-600 text-sm">Get honest feedback to make your choice</p>
              </div>
            </div>
          </div>

          {/* Sample Verdict Showcase */}
          <div className="mt-20 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">See What You'll Get</h2>
              <p className="text-gray-600">Real verdict from our community (anonymized)</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <Eye className="h-5 w-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-gray-600 italic mb-2">"Should I wear this outfit to my job interview?"</p>
                  <div className="bg-gray-100 rounded-lg p-4">
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
                <span className="text-xs text-gray-500">+ 7 more detailed responses</span>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-20 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"Got incredibly honest feedback about my dating profile. The responses were thoughtful and helped me see blind spots I never noticed."</p>
                <div className="text-sm text-gray-500">— Sarah, Marketing Manager</div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"Perfect for getting unbiased opinions on business decisions. The anonymity makes people brutally honest in the best way."</p>
                <div className="text-sm text-gray-500">— Mike, Entrepreneur</div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"Super fast responses and surprisingly detailed feedback. Way better than asking friends who might just tell you what you want to hear."</p>
                <div className="text-sm text-gray-500">— Jessica, College Student</div>
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
          <div className="mt-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">
                Stop Wondering. Start Knowing.
              </h2>
              <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto">
                Join 47,000+ people who chose truth over uncertainty. Get brutally honest feedback in minutes, not days.
              </p>
              
              <div className="space-y-6">
                <button
                  onClick={() => router.push('/start')}
                  className="bg-white text-indigo-600 px-12 py-5 rounded-xl text-xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 min-w-[320px]"
                >
                  Get My 3 Free Verdicts Now
                </button>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-indigo-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>3 free verdicts included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span>100% anonymous guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>Results in under 15 minutes</span>
                  </div>
                </div>
                
                <p className="text-sm text-indigo-200 mt-4">
                  No credit card required • Cancel anytime • 4.9/5 rating from 47,000+ users
                </p>
              </div>
            </div>
          </div>
        </div>
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
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
