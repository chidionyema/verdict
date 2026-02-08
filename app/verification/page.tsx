'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  Linkedin,
  Briefcase,
  FileText,
  ArrowRight,
  AlertTriangle,
  Star,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import { TouchButton } from '@/components/ui/touch-button';
import { useReviewerReputation } from '@/components/reputation/ReviewerReputation';

interface VerificationFormData {
  verificationType: 'linkedin' | 'portfolio';
  linkedinUrl: string;
  portfolioUrl: string;
  jobTitle: string;
  company: string;
  industry: string;
  yearsExperience: number;
}

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Marketing',
  'Design',
  'Sales',
  'HR/Recruiting',
  'Education',
  'Legal',
  'Real Estate',
  'Other'
];

export default function VerificationPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingVerification, setExistingVerification] = useState<any>(null);
  const [formData, setFormData] = useState<VerificationFormData>({
    verificationType: 'linkedin',
    linkedinUrl: '',
    portfolioUrl: '',
    jobTitle: '',
    company: '',
    industry: '',
    yearsExperience: 0
  });
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Check for existing verification
        const { data: verification } = await supabase
          .from('expert_verifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (verification) {
          setExistingVerification(verification);
          if ((verification as any).verification_status === 'verified') {
            toast.success('You are already a verified expert!');
          }
        }
      } catch (error) {
        console.error('Error loading verification data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const { reputation, loading: repLoading } = useReviewerReputation(user?.id || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validate form
    if (formData.verificationType === 'linkedin' && !formData.linkedinUrl) {
      toast.error('Please provide your LinkedIn URL');
      return;
    }
    
    if (formData.verificationType === 'portfolio' && !formData.portfolioUrl) {
      toast.error('Please provide your portfolio URL');
      return;
    }

    if (!formData.jobTitle || !formData.company || !formData.industry) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await (supabase as any)
        .from('expert_verifications')
        .insert({
          user_id: user.id,
          verification_type: formData.verificationType,
          linkedin_url: formData.verificationType === 'linkedin' ? formData.linkedinUrl : null,
          portfolio_url: formData.verificationType === 'portfolio' ? formData.portfolioUrl : null,
          job_title: formData.jobTitle,
          company: formData.company,
          industry: formData.industry,
          years_experience: formData.yearsExperience || null,
          verification_status: 'pending'
        });

      if (error) throw error;

      toast.success('Verification request submitted! We\'ll review it within 24 hours.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Failed to submit verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || repLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Become a Verified Expert
          </h1>
          <p className="text-lg text-gray-600">
            Join our community of trusted professionals and earn more while helping others
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">2x Credit Earning</h3>
            <p className="text-sm text-gray-600">
              Verified experts earn double credits per review compared to regular reviewers
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Priority Queue</h3>
            <p className="text-sm text-gray-600">
              Get first access to high-value Pro tier requests from serious users
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Expert Badge</h3>
            <p className="text-sm text-gray-600">
              Stand out with a verified badge that builds trust with requesters
            </p>
          </div>
        </div>

        {/* Existing Verification Status */}
        {existingVerification && (
          <div className={`rounded-xl p-6 mb-8 ${
            existingVerification.verification_status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
            existingVerification.verification_status === 'verified' ? 'bg-green-50 border border-green-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {existingVerification.verification_status === 'pending' && <Clock className="h-6 w-6 text-yellow-600" />}
              {existingVerification.verification_status === 'verified' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {existingVerification.verification_status === 'rejected' && <XCircle className="h-6 w-6 text-red-600" />}
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {existingVerification.verification_status === 'pending' && 'Verification Pending'}
                  {existingVerification.verification_status === 'verified' && 'You\'re Verified!'}
                  {existingVerification.verification_status === 'rejected' && 'Verification Not Approved'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {existingVerification.verification_status === 'pending' && 'We\'re reviewing your submission. This usually takes 24 hours.'}
                  {existingVerification.verification_status === 'verified' && `Verified ${existingVerification.job_title} at ${existingVerification.company}`}
                  {existingVerification.verification_status === 'rejected' && existingVerification.rejection_reason}
                </p>
              </div>
            </div>
            
            {existingVerification.verification_status === 'verified' && (
              <button
                onClick={() => router.push('/judge')}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Start Earning as Expert →
              </button>
            )}
          </div>
        )}

        {/* Reputation Check */}
        {reputation && reputation.reputation_score < 4.0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Build Your Reputation First</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Expert verification requires a reputation score of 4.0+. Your current score is {reputation.reputation_score.toFixed(1)}.
                  Keep providing helpful reviews to improve!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Form */}
        {(!existingVerification || existingVerification.verification_status === 'rejected') && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Verification Details</h2>

            {/* Verification Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you like to verify?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="verificationType"
                    value="linkedin"
                    checked={formData.verificationType === 'linkedin'}
                    onChange={(e) => setFormData({...formData, verificationType: 'linkedin'})}
                    className="sr-only peer"
                  />
                  <div className="border-2 rounded-lg p-4 cursor-pointer transition peer-checked:border-purple-600 peer-checked:bg-purple-50">
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-6 w-6 text-blue-600" />
                      <div>
                        <div className="font-semibold">LinkedIn Profile</div>
                        <div className="text-sm text-gray-600">Quick verification via LinkedIn</div>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="verificationType"
                    value="portfolio"
                    checked={formData.verificationType === 'portfolio'}
                    onChange={(e) => setFormData({...formData, verificationType: 'portfolio'})}
                    className="sr-only peer"
                  />
                  <div className="border-2 rounded-lg p-4 cursor-pointer transition peer-checked:border-purple-600 peer-checked:bg-purple-50">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-6 w-6 text-gray-600" />
                      <div>
                        <div className="font-semibold">Portfolio/Website</div>
                        <div className="text-sm text-gray-600">Verify with your work</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* LinkedIn URL */}
            {formData.verificationType === 'linkedin' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile URL *
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            )}

            {/* Portfolio URL */}
            {formData.verificationType === 'portfolio' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio/Website URL *
                </label>
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({...formData, portfolioUrl: e.target.value})}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            )}

            {/* Professional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                  placeholder="e.g. Senior Product Manager"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="e.g. Google"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({...formData, yearsExperience: parseInt(e.target.value) || 0})}
                  placeholder="e.g. 5"
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Your Privacy is Protected</p>
                  <p>
                    Your professional details will be displayed anonymously as "Verified {formData.jobTitle || '[Title]'} at {formData.industry || '[Industry]'} Company".
                    Your real name and company will never be shown to users.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                Maybe later
              </button>
              
              <TouchButton
                type="submit"
                disabled={submitting || !!(reputation && reputation.reputation_score < 4.0)}
                loading={submitting}
                className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </TouchButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}