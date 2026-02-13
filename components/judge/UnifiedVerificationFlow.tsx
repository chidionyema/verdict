'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Circle,
  ChevronRight,
  Linkedin,
  User,
  Award,
  Sparkles,
  TrendingUp,
  ArrowRight,
  X,
  Camera,
  FileText,
  Globe,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UnifiedVerificationFlowProps {
  userId: string;
  onComplete?: () => void;
  onDismiss?: () => void;
  mode?: 'modal' | 'inline' | 'page';
}

interface VerificationState {
  profileComplete: boolean;
  linkedinConnected: boolean;
  linkedinUrl: string;
  expertiseArea: string;
  bio: string;
  avatarUrl: string | null;
}

const EXPERTISE_OPTIONS = [
  { value: 'tech', label: 'Tech & Engineering', icon: '💻' },
  { value: 'design', label: 'Design & Creative', icon: '🎨' },
  { value: 'marketing', label: 'Marketing & Growth', icon: '📈' },
  { value: 'hr', label: 'HR & Recruiting', icon: '👥' },
  { value: 'business', label: 'Business & Strategy', icon: '💼' },
  { value: 'finance', label: 'Finance & Accounting', icon: '💰' },
  { value: 'writing', label: 'Writing & Content', icon: '✍️' },
  { value: 'general', label: 'General / Multiple', icon: '🌟' },
];

/**
 * UnifiedVerificationFlow - Frictionless, single-page verification
 *
 * Design principles:
 * 1. ONE page, not multiple navigations
 * 2. Show concrete earnings impact at each step
 * 3. Pre-fill everything possible
 * 4. Allow partial completion (save progress)
 * 5. Celebrate each completion, not just the final one
 */
export function UnifiedVerificationFlow({
  userId,
  onComplete,
  onDismiss,
  mode = 'inline',
}: UnifiedVerificationFlowProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState<'profile' | 'linkedin' | 'complete'>('profile');
  const [showCelebration, setShowCelebration] = useState<string | null>(null);

  const [state, setState] = useState<VerificationState>({
    profileComplete: false,
    linkedinConnected: false,
    linkedinUrl: '',
    expertiseArea: '',
    bio: '',
    avatarUrl: null,
  });

  // Load current state
  useEffect(() => {
    loadState();
  }, [userId]);

  const loadState = async () => {
    try {
      const supabase = createClient();
      const { data } = await (supabase as any)
        .from('profiles')
        .select('bio, expertise_area, avatar_url, linkedin_url, country')
        .eq('id', userId)
        .single();

      const profile = data as {
        bio: string | null;
        expertise_area: string | null;
        avatar_url: string | null;
        linkedin_url: string | null;
        country: string | null;
      } | null;

      if (profile) {
        const profileComplete = !!(
          profile.bio &&
          profile.expertise_area &&
          profile.avatar_url &&
          profile.country
        );
        const linkedinConnected = !!(profile.linkedin_url);

        setState({
          profileComplete,
          linkedinConnected,
          linkedinUrl: profile.linkedin_url || '',
          expertiseArea: profile.expertise_area || '',
          bio: profile.bio || '',
          avatarUrl: profile.avatar_url,
        });

        // Auto-advance to appropriate step
        if (profileComplete && linkedinConnected) {
          setActiveStep('complete');
        } else if (profileComplete) {
          setActiveStep('linkedin');
        } else {
          setActiveStep('profile');
        }
      }
    } catch (error) {
      console.error('Error loading verification state:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!state.expertiseArea || !state.bio) return;

    setSaving(true);
    try {
      const supabase = createClient();
      await (supabase as any)
        .from('profiles')
        .update({
          expertise_area: state.expertiseArea,
          bio: state.bio,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      setState(prev => ({ ...prev, profileComplete: true }));
      setShowCelebration('profile');
      setTimeout(() => {
        setShowCelebration(null);
        setActiveStep('linkedin');
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const connectLinkedIn = async () => {
    if (!state.linkedinUrl) return;

    // Basic URL validation
    if (!state.linkedinUrl.includes('linkedin.com/in/')) {
      alert('Please enter a valid LinkedIn profile URL');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/judge/instant-verify-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          linkedinUrl: state.linkedinUrl,
        }),
      });

      if (res.ok) {
        setState(prev => ({ ...prev, linkedinConnected: true }));
        setShowCelebration('linkedin');
        setTimeout(() => {
          setShowCelebration(null);
          setActiveStep('complete');
          onComplete?.();
        }, 1500);
      }
    } catch (error) {
      console.error('Error connecting LinkedIn:', error);
    } finally {
      setSaving(false);
    }
  };

  const skipLinkedIn = () => {
    setActiveStep('complete');
    onComplete?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Celebration overlay
  const CelebrationOverlay = ({ type }: { type: string }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center z-10"
    >
      <div className="text-center text-white">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <CheckCircle className="h-16 w-16 mx-auto mb-4" />
        </motion.div>
        <p className="text-xl font-bold">
          {type === 'profile' ? 'Profile Complete!' : 'LinkedIn Connected!'}
        </p>
        <p className="text-green-100 mt-1">
          {type === 'profile' ? '+15% earnings unlocked' : '+25% earnings unlocked'}
        </p>
      </div>
    </motion.div>
  );

  const containerClass = mode === 'modal'
    ? 'bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden'
    : mode === 'page'
    ? 'bg-white rounded-2xl shadow-lg border border-gray-200 max-w-2xl mx-auto overflow-hidden'
    : 'bg-white rounded-2xl border border-gray-200 overflow-hidden';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
        {mode === 'modal' && onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1 text-white/70 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="h-6 w-6" />
          <h2 className="text-xl font-bold">Unlock Higher Earnings</h2>
        </div>
        <p className="text-indigo-200 text-sm">
          Complete your profile to earn up to 50% more per verdict
        </p>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className={`h-2 flex-1 rounded-full ${state.profileComplete ? 'bg-white' : 'bg-white/30'}`} />
          <div className={`h-2 flex-1 rounded-full ${state.linkedinConnected ? 'bg-white' : 'bg-white/30'}`} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 relative">
        <AnimatePresence>
          {showCelebration && <CelebrationOverlay type={showCelebration} />}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Step 1: Profile */}
          {activeStep === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Complete Your Profile</h3>
                  <p className="text-sm text-gray-500">Unlocks +15% earnings bonus</p>
                </div>
              </div>

              {/* Expertise selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your expertise area
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERTISE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setState(prev => ({ ...prev, expertiseArea: opt.value }))}
                      className={`p-3 rounded-xl border text-left text-sm transition ${
                        state.expertiseArea === opt.value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="mr-2">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short bio (helps requesters trust your feedback)
                </label>
                <textarea
                  value={state.bio}
                  onChange={e => setState(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="e.g., 5 years in product design at tech startups. I specialize in user research and interface design."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {state.bio.length}/200 characters
                </p>
              </div>

              <button
                onClick={saveProfile}
                disabled={!state.expertiseArea || state.bio.length < 20 || saving}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Step 2: LinkedIn */}
          {activeStep === 'linkedin' && (
            <motion.div
              key="linkedin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                  <Linkedin className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Connect LinkedIn</h3>
                  <p className="text-sm text-gray-500">Unlocks +25% earnings bonus</p>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                <p className="text-sm text-sky-800">
                  Linking your LinkedIn shows requesters you're a real professional.
                  Verified judges receive <strong>40% more tips</strong> on average.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your LinkedIn profile URL
                </label>
                <input
                  type="url"
                  value={state.linkedinUrl}
                  onChange={e => setState(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              <button
                onClick={connectLinkedIn}
                disabled={!state.linkedinUrl || saving}
                className="w-full py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Linkedin className="h-5 w-5" />
                    Connect LinkedIn
                  </>
                )}
              </button>

              <button
                onClick={skipLinkedIn}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition"
              >
                Skip for now (you can add this later)
              </button>
            </motion.div>
          )}

          {/* Step 3: Complete */}
          {activeStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">You're All Set!</h3>
              <p className="text-gray-600 mb-6">
                {state.linkedinConnected
                  ? "You've unlocked the Verified Professional bonus. Start judging to earn more!"
                  : "Your profile is complete. Add LinkedIn anytime to earn even more."}
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Your current earnings multiplier</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {state.linkedinConnected ? '1.25x' : state.profileComplete ? '1.15x' : '1x'}
                </p>
              </div>

              <button
                onClick={onDismiss || onComplete}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Start Judging
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
