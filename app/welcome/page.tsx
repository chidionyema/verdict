'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, ArrowRight, User, MapPin, Calendar, Users } from 'lucide-react';
import { toast } from '@/components/ui/toast';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'India', 'Japan', 'Brazil', 'Mexico', 'Other'
];

const AGE_RANGES = [
  '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    display_name: '',
    country: '',
    age_range: '',
    gender: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login?redirect=/welcome');
        return;
      }

      // Check if profile already has these fields filled
      const res = await fetch('/api/me');
      if (res.ok) {
        const { profile: existingProfile } = await res.json();
        if (existingProfile) {
          setProfile({
            display_name: existingProfile.display_name || '',
            country: existingProfile.country || '',
            age_range: existingProfile.age_range || '',
            gender: existingProfile.gender || '',
          });

          // If already complete, redirect to dashboard
          if (existingProfile.display_name && existingProfile.country && existingProfile.age_range) {
            router.push('/dashboard');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!profile.display_name.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        throw new Error('Failed to save profile');
      }

      toast.success('Profile updated! Welcome to Verdict.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to save profile. Please check your connection and try again.');
      } else {
        toast.error('We couldn\'t save your profile. Please try again in a moment.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label={`Step ${step} of 3`}>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s <= step ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Welcome header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Verdict!
            </h1>
            <p className="text-gray-600">
              Let's set up your profile to personalize your experience.
            </p>
          </div>

          {/* Step 1: Display Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="display-name" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4" aria-hidden="true" />
                  Display Name
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  placeholder="How should we call you?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                  aria-describedby="display-name-hint"
                />
                <p id="display-name-hint" className="text-xs text-gray-500 mt-2">
                  This is how other users will see you. You can use a nickname.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!profile.display_name.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Demographics */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="country" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Country
                </label>
                <select
                  id="country"
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  aria-label="Select your country"
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label id="age-range-label" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  Age Range
                </label>
                <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="age-range-label">
                  {AGE_RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setProfile({ ...profile, age_range: range })}
                      aria-pressed={profile.age_range === range}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        profile.age_range === range
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Gender & Complete */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label id="gender-label" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Gender (optional)
                </label>
                <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="gender-label" aria-describedby="gender-hint">
                  {GENDERS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setProfile({ ...profile, gender: g.value })}
                      aria-pressed={profile.gender === g.value}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        profile.gender === g.value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <p id="gender-hint" className="text-xs text-gray-500 mt-2">
                  This helps us match you with relevant feedback requests.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Your Profile</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium">{profile.display_name}</span>
                  </div>
                  {profile.country && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Country</span>
                      <span className="font-medium">{profile.country}</span>
                    </div>
                  )}
                  {profile.age_range && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Age</span>
                      <span className="font-medium">{profile.age_range}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Complete Setup'}
                  <CheckCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Skip option */}
          <div className="mt-6 text-center">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
