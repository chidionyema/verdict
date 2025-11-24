'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ChevronRight, User, CreditCard, Camera, CheckCircle, ArrowRight } from 'lucide-react';

interface Profile {
  display_name: string;
  country: string;
  age_range: string;
  gender: string;
  onboarding_completed: boolean;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile>({
    display_name: '',
    country: '',
    age_range: '',
    gender: '',
    onboarding_completed: false,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      setUser(user);
      
      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData as Profile);
        // If already completed onboarding, redirect to dashboard
        if ((profileData as any).onboarding_completed) {
          router.push('/dashboard');
          return;
        }
      }
      
      setIsLoading(false);
    };

    getUser();
  }, [router, supabase]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    
    const { error } = await (supabase
      .from('profiles')
      .update as any)(updates)
      .eq('id', user.id);
    
    if (!error) {
      setProfile(prev => ({ ...prev, ...updates }));
    }
  };

  const completeOnboarding = async () => {
    await updateProfile({ onboarding_completed: true });
    router.push('/dashboard');
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Verdict!',
      description: 'Get honest feedback from real people in minutes',
      completed: true,
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Help us personalize your experience',
      completed: !!(profile.display_name && profile.country && profile.age_range),
    },
    {
      id: 'credits',
      title: 'You Have 3 Free Credits',
      description: 'Each credit gets you 3 expert verdicts',
      completed: true,
    },
    {
      id: 'first-request',
      title: 'Create Your First Request',
      description: 'Upload a photo or ask for feedback on anything',
      completed: false,
      action: () => router.push('/start'),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Welcome to Verdict!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            You're all set up with 3 free credits. Let's get you started on your first honest feedback experience.
          </p>
        </div>

        {/* Onboarding Steps */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-8 text-center">Let's Get You Started</h2>
            
            <div className="space-y-6">
              {onboardingSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center p-6 rounded-lg border-2 transition-all ${
                    currentStep === index
                      ? 'border-indigo-500 bg-indigo-50'
                      : step.completed
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 mr-4">
                    {step.completed ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : currentStep === index ? (
                      <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  
                  {step.action && (
                    <button
                      onClick={step.action}
                      className="ml-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center"
                    >
                      Start
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Profile Completion Form */}
            {currentStep === 1 && (
              <div className="mt-8 bg-indigo-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Complete Your Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profile.display_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="How should we address you?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={profile.country}
                      onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Your country"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Range
                    </label>
                    <select
                      value={profile.age_range}
                      onChange={(e) => setProfile(prev => ({ ...prev, age_range: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select age range</option>
                      <option value="18-24">18-24</option>
                      <option value="25-34">25-34</option>
                      <option value="35-44">35-44</option>
                      <option value="45-54">45-54</option>
                      <option value="55+">55+</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender (Optional)
                    </label>
                    <select
                      value={profile.gender}
                      onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => updateProfile(profile)}
                    disabled={!profile.display_name || !profile.country || !profile.age_range}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Save Profile
                  </button>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-8 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {onboardingSteps.length}
              </div>
              
              <div className="flex gap-4">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Previous
                  </button>
                )}
                
                {currentStep < onboardingSteps.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(Math.min(onboardingSteps.length - 1, currentStep + 1))}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={completeOnboarding}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Get Started!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span>3 Free Credits</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-600" />
              <span>Upload Any Content</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Anonymous & Safe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}