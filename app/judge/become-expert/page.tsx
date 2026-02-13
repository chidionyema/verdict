'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Shield,
  Briefcase,
  FileText,
  Link as LinkIcon,
  Users,
  CheckCircle,
  ArrowLeft,
  Upload,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Star,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TouchButton } from '@/components/ui/touch-button';
import { BackButton } from '@/components/ui/BackButton';
import { VerificationProgress } from '@/components/judge/VerificationProgress';

const EXPERTISE_CATEGORIES = [
  { id: 'hr', label: 'HR & Recruiting', description: 'Resumes, cover letters, hiring decisions' },
  { id: 'design', label: 'Design & Creative', description: 'UI/UX, branding, visual design' },
  { id: 'tech', label: 'Technology', description: 'Software, code review, tech decisions' },
  { id: 'marketing', label: 'Marketing', description: 'Copy, campaigns, brand strategy' },
  { id: 'business', label: 'Business Strategy', description: 'Pitches, business plans, strategy' },
  { id: 'finance', label: 'Finance', description: 'Financial planning, investment decisions' },
  { id: 'legal', label: 'Legal', description: 'Contracts, legal documents, compliance' },
  { id: 'writing', label: 'Writing & Content', description: 'Articles, books, content creation' },
];

const PROOF_TYPES = [
  { id: 'portfolio', label: 'Portfolio/Website', icon: LinkIcon, description: 'Link to your professional portfolio' },
  { id: 'certification', label: 'Certification', icon: Award, description: 'Industry certification or credential' },
  { id: 'reference', label: 'Professional Reference', icon: Users, description: 'Contact who can verify expertise' },
  { id: 'work_sample', label: 'Work Sample', icon: FileText, description: 'Example of professional work' },
];

export default function BecomeExpertPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [proofType, setProofType] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofDescription, setProofDescription] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(0);

  // User state
  const [user, setUser] = useState<any>(null);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        router.push('/auth/login?redirect=/judge/become-expert');
        return;
      }

      setUser(currentUser);

      // Check for existing application
      const { data: existing } = await supabase
        .from('expert_verification_requests')
        .select('*')
        .eq('user_id', currentUser.id)
        .in('status', ['pending', 'approved'])
        .single();

      if (existing) {
        setExistingApplication(existing);
      }

      // Get verification status
      const statusRes = await fetch('/api/judge/verification-status');
      if (statusRes.ok) {
        const status = await statusRes.json();
        setVerificationStatus(status);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !proofType || !proofDescription || yearsExperience < 1) {
      setError('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/judge/expert-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertiseCategory: selectedCategory,
          proofType,
          proofUrl: proofUrl || null,
          proofDescription,
          yearsExperience,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Show existing application status
  if (existingApplication) {
    const isPending = existingApplication.status === 'pending';
    const isApproved = existingApplication.status === 'approved';

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <BackButton href="/judge/verify" label="Back to Verification" className="mb-6" />

          <div className={`bg-white rounded-2xl shadow-lg border ${
            isApproved ? 'border-green-200' : 'border-amber-200'
          } p-8`}>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full ${
                isApproved ? 'bg-green-100' : 'bg-amber-100'
              } flex items-center justify-center mx-auto mb-4`}>
                {isApproved ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <Clock className="h-8 w-8 text-amber-600" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isApproved ? 'Expert Verified!' : 'Application Under Review'}
              </h1>
              <p className="text-gray-600 mb-6">
                {isApproved
                  ? 'Congratulations! You have expert verification status.'
                  : 'Your expert verification application is being reviewed. We\'ll notify you once a decision is made.'}
              </p>

              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Application Details</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Category:</dt>
                    <dd className="font-medium text-gray-900">{existingApplication.expertise_category}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Submitted:</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(existingApplication.submitted_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Status:</dt>
                    <dd className={`font-medium ${isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                      {isApproved ? 'Approved' : 'Pending Review'}
                    </dd>
                  </div>
                </dl>
              </div>

              <Link
                href="/judge"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-green-200 p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="h-10 w-10 text-green-600" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
            <p className="text-gray-600 mb-6">
              Your expert verification application has been submitted successfully.
              Our team will review your credentials and notify you within 2-3 business days.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Our team reviews your credentials and proof of expertise</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>We may reach out for additional verification if needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Once approved, you'll receive the Expert badge and 50% bonus earnings</span>
                </li>
              </ul>
            </div>

            <Link
              href="/judge"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
            >
              Return to Dashboard
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Check if user meets prerequisites (linkedin_verified minimum)
  const meetsPrerequisites = verificationStatus?.tierIndex >= 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/judge/verify" label="Back to Verification" className="mb-6" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
            <Award className="h-4 w-4" />
            Expert Verification
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Become an Expert Judge</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Prove your domain expertise to unlock the highest tier benefits and earnings multiplier.
          </p>
        </div>

        {/* Prerequisites check */}
        {!meetsPrerequisites && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Prerequisites Required</h3>
                <p className="text-sm text-amber-700 mt-1">
                  You need to complete LinkedIn verification before applying for Expert status.
                  This ensures all Expert judges have a verified professional identity.
                </p>
                <Link
                  href="/judge/verify"
                  className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800 mt-3"
                >
                  Complete verification steps
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Progress indicator */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step >= s
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {s}
                      </div>
                      {s < 3 && (
                        <div className={`w-12 h-1 rounded ${
                          step > s ? 'bg-purple-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* Step 1: Select expertise category */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Select Your Expertise Area
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Choose the category that best represents your professional expertise.
                      </p>

                      <div className="grid gap-3">
                        {EXPERTISE_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            disabled={!meetsPrerequisites}
                            className={`p-4 rounded-xl border text-left transition ${
                              selectedCategory === cat.id
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            } ${!meetsPrerequisites ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <p className={`font-medium ${
                              selectedCategory === cat.id ? 'text-purple-900' : 'text-gray-900'
                            }`}>
                              {cat.label}
                            </p>
                            <p className="text-sm text-gray-500">{cat.description}</p>
                          </button>
                        ))}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <TouchButton
                          onClick={() => setStep(2)}
                          disabled={!selectedCategory || !meetsPrerequisites}
                          className="bg-purple-600 text-white disabled:opacity-50"
                        >
                          Continue
                        </TouchButton>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Proof of expertise */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Proof of Expertise
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Provide evidence of your professional expertise in{' '}
                        {EXPERTISE_CATEGORIES.find(c => c.id === selectedCategory)?.label}.
                      </p>

                      {/* Proof type selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Type of Proof
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {PROOF_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.id}
                                onClick={() => setProofType(type.id)}
                                className={`p-4 rounded-xl border text-left transition ${
                                  proofType === type.id
                                    ? 'border-purple-600 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <Icon className={`h-5 w-5 mb-2 ${
                                  proofType === type.id ? 'text-purple-600' : 'text-gray-400'
                                }`} />
                                <p className={`font-medium text-sm ${
                                  proofType === type.id ? 'text-purple-900' : 'text-gray-900'
                                }`}>
                                  {type.label}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* URL input */}
                      {proofType && (proofType === 'portfolio' || proofType === 'certification') && (
                        <div className="mb-4">
                          <label htmlFor="proof-url" className="block text-sm font-medium text-gray-700 mb-2">
                            URL (optional)
                          </label>
                          <input
                            type="url"
                            id="proof-url"
                            value={proofUrl}
                            onChange={(e) => setProofUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      )}

                      {/* Description */}
                      <div className="mb-4">
                        <label htmlFor="proof-description" className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          id="proof-description"
                          value={proofDescription}
                          onChange={(e) => setProofDescription(e.target.value)}
                          rows={4}
                          placeholder="Describe your expertise, qualifications, and relevant experience..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        />
                      </div>

                      {/* Years experience */}
                      <div className="mb-6">
                        <label htmlFor="years-experience" className="block text-sm font-medium text-gray-700 mb-2">
                          Years of Experience *
                        </label>
                        <select
                          id="years-experience"
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(parseInt(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value={0}>Select years</option>
                          <option value={1}>1-2 years</option>
                          <option value={3}>3-5 years</option>
                          <option value={5}>5-10 years</option>
                          <option value={10}>10+ years</option>
                        </select>
                      </div>

                      <div className="flex justify-between">
                        <TouchButton
                          onClick={() => setStep(1)}
                          variant="outline"
                          className="border-gray-300"
                        >
                          Back
                        </TouchButton>
                        <TouchButton
                          onClick={() => setStep(3)}
                          disabled={!proofType || !proofDescription || yearsExperience < 1}
                          className="bg-purple-600 text-white disabled:opacity-50"
                        >
                          Continue
                        </TouchButton>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Review & submit */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Review & Submit
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Review your application before submitting.
                      </p>

                      <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <dl className="space-y-3">
                          <div>
                            <dt className="text-sm text-gray-500">Expertise Category</dt>
                            <dd className="font-medium text-gray-900">
                              {EXPERTISE_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Proof Type</dt>
                            <dd className="font-medium text-gray-900">
                              {PROOF_TYPES.find(t => t.id === proofType)?.label}
                            </dd>
                          </div>
                          {proofUrl && (
                            <div>
                              <dt className="text-sm text-gray-500">URL</dt>
                              <dd className="font-medium text-gray-900 truncate">{proofUrl}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-sm text-gray-500">Experience</dt>
                            <dd className="font-medium text-gray-900">
                              {yearsExperience === 10 ? '10+' : `${yearsExperience}`} years
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Description</dt>
                            <dd className="font-medium text-gray-900 whitespace-pre-wrap">
                              {proofDescription}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <TouchButton
                          onClick={() => setStep(2)}
                          variant="outline"
                          className="border-gray-300"
                          disabled={submitting}
                        >
                          Back
                        </TouchButton>
                        <TouchButton
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="bg-purple-600 text-white"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Award className="h-4 w-4 mr-2" />
                              Submit Application
                            </>
                          )}
                        </TouchButton>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Benefits sidebar */}
          <div className="space-y-6">
            {/* Current status */}
            {verificationStatus && (
              <VerificationProgress
                userId={user?.id || ''}
                variant="card"
                showCTA={false}
              />
            )}

            {/* Expert benefits */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Expert Benefits
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">50% Bonus Earnings</p>
                    <p className="text-xs text-purple-200">On all verdicts</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Expert Badge</p>
                    <p className="text-xs text-purple-200">Displayed on all feedback</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Expert-Tier Requests</p>
                    <p className="text-xs text-purple-200">Access premium submissions</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Priority Queue</p>
                    <p className="text-xs text-purple-200">First access to new requests</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Review process */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Review Process</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium shrink-0">1</span>
                  <span>Submit your application with proof of expertise</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium shrink-0">2</span>
                  <span>Our team reviews your credentials (2-3 business days)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium shrink-0">3</span>
                  <span>Get notified and start earning expert bonuses</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
