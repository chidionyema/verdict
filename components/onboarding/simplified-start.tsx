'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Briefcase,
  Heart,
  HelpCircle,
  ArrowRight,
  Check,
  Sparkles,
  Star,
  Clock,
  Shield,
  Zap,
  Eye,
  MessageSquare,
  Camera,
  Type,
  ChevronDown,
  X,
  Play,
} from 'lucide-react';
import { ModeIndicator } from '@/components/mode/ModeIndicator';
import { PricingTiers, type RequestTier } from '@/components/pricing/PricingTiers';
import { InsufficientCreditsModal } from '@/components/modals/InsufficientCreditsModal';
import type { User } from '@supabase/supabase-js';
import type { Mode } from '@/lib/mode-colors';

const categories = [
  { 
    id: 'appearance', 
    label: 'Appearance', 
    icon: Heart, 
    description: 'Dating photos, interview looks, event outfits',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-gradient-to-br from-rose-50 to-pink-50',
    iconColor: 'text-rose-600'
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: Briefcase, 
    description: 'LinkedIn, resume, dating profiles, bios',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    iconColor: 'text-blue-600'
  },
  { 
    id: 'writing', 
    label: 'Writing', 
    icon: FileText, 
    description: 'Emails, messages, content, proposals',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    iconColor: 'text-emerald-600'
  },
  { 
    id: 'decision', 
    label: 'Decision', 
    icon: HelpCircle, 
    description: 'Life choices, purchases, career moves',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50',
    iconColor: 'text-violet-600'
  },
];

const socialProof = [
  { metric: "500+", label: "Expert reviews delivered", icon: MessageSquare },
  { metric: "4.9★", label: "Average rating", icon: Star },
  { metric: "15min", label: "Average response time", icon: Clock },
];

const subcategories: Record<string, string[]> = {
  appearance: ['dating', 'interview', 'event', 'casual', 'professional'],
  profile: ['linkedin', 'resume', 'dating', 'portfolio'],
  writing: ['email', 'message', 'content', 'proposal'],
  decision: ['purchase', 'career', 'relationship', 'lifestyle'],
};

export function SimplifiedStart() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState<'photo' | 'text'>('photo');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [textContentTouched, setTextContentTouched] = useState(false);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [context, setContext] = useState('');
  const [requestedTone, setRequestedTone] = useState<'encouraging' | 'honest' | 'brutally_honest'>('honest');
  const [uploading, setUploading] = useState(false);
  const [judgePreferences, setJudgePreferences] = useState<{ type: string; category: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<Mode | null>(null);
  const [selectedTier, setSelectedTier] = useState<RequestTier>('community');
  const [userCredits, setUserCredits] = useState(0);
  const [userTier, setUserTier] = useState<'community' | 'standard' | 'pro'>('community');
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(1);

  useEffect(() => {
    // Only initialize Supabase client in browser
    if (typeof window === 'undefined') return;
    
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Fetch user credits and tier for affordability
        Promise.all([
          supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('profiles')
            .select('pricing_tier')
            .eq('id', user.id)
            .single()
        ]).then(([creditsRes, profileRes]) => {
          setUserCredits((creditsRes.data as any)?.balance || 0);
          setUserTier((profileRes.data as any)?.pricing_tier || 'community');
        });
      }
    });
    
    // Check URL params for visibility mode
    const params = new URLSearchParams(window.location.search);
    const visibility = params.get('visibility');
    if (visibility === 'public') {
      setSubmissionMode('community');
    } else if (visibility === 'private') {
      setSubmissionMode('private');
    }
  }, []);

  // Restore any saved draft from signup/login flow
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('draftRequest');
      if (!raw) return;
      const draft = JSON.parse(raw);

      if (draft.mediaType && (draft.mediaType === 'photo' || draft.mediaType === 'text')) {
        setMediaType(draft.mediaType);
      }
      if (typeof draft.textContent === 'string') {
        setTextContent(draft.textContent);
      }
      if (typeof draft.category === 'string') {
        setCategory(draft.category);
      }
      if (typeof draft.subcategory === 'string') {
        setSubcategory(draft.subcategory);
      }
      if (typeof draft.context === 'string') {
        setContext(draft.context);
      }
      if (draft.requestedTone && ['encouraging', 'honest', 'brutally_honest'].includes(draft.requestedTone)) {
        setRequestedTone(draft.requestedTone);
      }

      // If they already wrote context, drop them back into final step,
      // otherwise go to the next logical step after media/category.
      if (draft.context && draft.context.length >= 20) {
        setStep(3);
      } else if (draft.category) {
        setStep(2);
      } else if (draft.mediaType && (draft.textContent || (window as any).pendingFile)) {
        setStep(2);
      } 
    } catch {
      // Fail silently if draft parsing fails
    }
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    const isImage = imageTypes.includes(file.type);

    if (!isImage) {
      setError('Only JPEG, PNG, HEIC, WebP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller');
      return;
    }

    setError('');
    setPreviewUrl(URL.createObjectURL(file));
    (window as any).pendingFile = file;

    // Auto-advance with smooth transition
    setTimeout(() => setStep(2), 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleTextSubmit = () => {
    if (textContent.length < 50) {
      setError('Please write at least 50 characters');
      return;
    }
    setError('');
    setTimeout(() => setStep(2), 300);
  };

  const handleSubmit = async () => {
    if (!context || context.length < 20) {
      setError('Please provide context (at least 20 characters)');
      return;
    }

    if (!user) {
      // Persist the draft so we can restore after signup/login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('draftRequest', JSON.stringify({
          mediaType,
          textContent: mediaType === 'text' ? textContent : null,
          category,
          subcategory,
          context,
          requestedTone,
        }));
      }
      router.push('/auth/signup?redirect=/start-simple');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let mediaUrl = null;

      if (mediaType === 'photo') {
        const file = (window as any).pendingFile;
        if (!file) {
          setError('Please upload an image');
          setSubmitting(false);
          return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || 'Upload failed');
        }

        const uploadData = await uploadRes.json();
        mediaUrl = uploadData.url;
        setUploading(false);
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subcategory: subcategory || null,
          media_type: mediaType,
          media_url: mediaUrl,
          text_content: mediaType === 'text' ? textContent : null,
          context,
          judge_preferences: judgePreferences,
          requested_tone: requestedTone,
          request_tier: selectedTier,
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        // Handle insufficient credits specifically
        if (res.status === 402) {
          // Use the required_credits from API response (comes from pricing_tiers table)
          setRequiredCredits(data.required_credits || 1);
          setShowCreditsModal(true);
          setSubmitting(false);
          return;
        }

        throw new Error(data.details || data.error || 'Failed to create request');
      }

      const { request } = await res.json();
      
      // Success animation
      setShowSuccess(true);
      setTimeout(() => {
        // Send users to their request list where real-time status is shown,
        // instead of the old simulated waiting page that relied on in-memory state.
        router.push('/my-requests');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  const handleTierUpgrade = async (tierId: 'standard' | 'pro') => {
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier_id: tierId }),
      });

      const data = await res.json();

      if (data.demo) {
        // Demo mode - tier upgraded directly
        // Note: No toast available in this context, use inline notification
        setUserTier(data.tier);
        setError(`Upgraded to ${data.tier} tier (demo mode)`);
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Tier upgrade error:', error);
      setError('Failed to upgrade tier. Please try again.');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Share what you'd like feedback on";
      case 2: return "Tell us what you need and who should review it";
      case 3: return "Add context for personalized insights";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return "Upload a photo or paste your text to get started";
      case 2: return "Choose the area you want help with and how we should match your judges";
      case 3: return "Help experts understand your specific situation";
      default: return "";
    }
  };

  const getStepProgressLabel = () => {
    const labels: Record<number, string> = {
      1: 'Step 1 of 3 · Upload',
      2: 'Step 2 of 3 · Topic & judges',
      3: 'Step 3 of 3 · Context',
    };
    return labels[step] ?? '';
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-6 animate-in fade-in duration-1000">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-12 h-12 text-green-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Request submitted!</h2>
            <p className="text-gray-600">You'll receive expert feedback within 30 minutes</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Redirecting to your dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  // Refresh credits after purchase
  const refreshCredits = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    setUserCredits((data as any)?.balance || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        requiredCredits={requiredCredits}
        currentCredits={userCredits}
        onPurchaseSuccess={() => {
          refreshCredits();
          setShowCreditsModal(false);
        }}
      />

      {/* Progress Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Verdict</span>
            </div>
            <div className="flex items-center gap-4">
              {socialProof.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <item.icon className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">{item.metric}</span>
                  <span className="text-gray-600 hidden sm:inline">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`h-2 rounded-full transition-all duration-500 flex-1 ${
                  step >= s 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
                    : 'bg-gray-200'
                }`} />
                {s < 4 && <div className="w-2" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{getStepProgressLabel()}</span>
            <span className="hidden sm:inline">Takes ~2 minutes total</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          {submissionMode && (
            <div className="mb-6 flex justify-center">
              <ModeIndicator mode={submissionMode} />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            {getStepTitle()}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {getStepSubtitle()}
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 animate-in slide-in-from-top duration-300">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Attached media preview across steps */}
        {(previewUrl || textContent) && (
          <div className="max-w-3xl mx-auto mb-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-indigo-600 mb-1">
                  Your upload
                </p>
                <p className="text-sm text-gray-700">
                  {mediaType === 'photo'
                    ? 'Photo attached – judges will see this on your request.'
                    : 'Text attached – judges will read this as your main content.'}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {mediaType === 'photo' && previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Your upload"
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                  />
                )}
                {mediaType === 'text' && textContent && (
                  <div className="hidden sm:block max-w-xs text-xs text-gray-600 line-clamp-3 bg-gray-50 border border-gray-200 rounded-lg p-2">
                    {textContent}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                >
                  Change upload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            {/* Media Type Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                What would you like feedback on?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Upload a <span className="font-medium">photo</span> or paste your <span className="font-medium">text</span> to get started.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setMediaType('photo')}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    mediaType === 'photo'
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      mediaType === 'photo' 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }`}>
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h4 className={`font-semibold ${mediaType === 'photo' ? 'text-indigo-900' : 'text-gray-900'}`}>
                        Photo
                      </h4>
                      <p className={`text-sm ${mediaType === 'photo' ? 'text-indigo-600' : 'text-gray-600'}`}>
                        Upload an image
                      </p>
                    </div>
                  </div>
                  {mediaType === 'photo' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setMediaType('text')}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    mediaType === 'text'
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      mediaType === 'text' 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }`}>
                      <Type className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h4 className={`font-semibold ${mediaType === 'text' ? 'text-indigo-900' : 'text-gray-900'}`}>
                        Text
                      </h4>
                      <p className={`text-sm ${mediaType === 'text' ? 'text-indigo-600' : 'text-gray-600'}`}>
                        Paste your content
                      </p>
                    </div>
                  </div>
                  {mediaType === 'text' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              </div>

              {/* Upload / Record Area */}
              {mediaType === 'photo' ? (
                <div 
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : previewUrl 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-indigo-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {previewUrl ? (
                    <div className="space-y-6">
                      <div className="relative inline-block">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-64 max-w-full rounded-xl shadow-lg" 
                        />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-green-700 font-semibold">Perfect! Photo uploaded successfully</p>
                        <p className="text-sm text-green-600">Ready to choose your feedback type</p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-semibold text-gray-900">Drop your photo here</h4>
                        <p className="text-gray-600">or click to browse your files</p>
                        <p className="text-sm text-gray-500">JPEG, PNG, HEIC, WebP up to 5MB</p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        <Upload className="w-5 h-5" />
                        Choose Photo
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative">
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      onBlur={() => setTextContentTouched(true)}
                      placeholder="Paste your text here... (minimum 50 characters for quality feedback)"
                      className="w-full p-6 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-lg resize-none"
                      rows={8}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        textContentTouched && textContent.length < 50 ? 'text-red-500' :
                        textContent.length >= 50 ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {textContent.length}/500
                      </span>
                    </div>
                  </div>

                  {textContent.length >= 50 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl animate-in slide-in-from-top duration-300">
                      <div className="flex items-center gap-2 text-green-800 mb-2">
                        <Check className="w-4 h-4" />
                        <span className="font-semibold">Looking good!</span>
                      </div>
                      <p className="text-sm text-green-700">Your text is ready for expert review</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleTextSubmit}
                      disabled={textContent.length < 50}
                      className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all ${
                        textContent.length < 50
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                      }`}
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-advance indicator */}
            {((mediaType === 'photo' && previewUrl) || (mediaType === 'text' && textContent.length >= 50)) && (
              <div className="text-center animate-in fade-in duration-500 delay-300">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  Ready to continue automatically
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Category + Quick Judge Preferences */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom duration-700">
            {/* Category selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                    }}
                    className={`group relative p-8 rounded-2xl border-2 transition-all duration-500 text-left ${
                      isSelected 
                        ? `border-indigo-500 ${cat.bgColor} shadow-xl scale-105` 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg hover:scale-102'
                    }`}
                  >
                    <div className="flex items-start gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        isSelected 
                          ? `bg-gradient-to-r ${cat.color} text-white shadow-lg` 
                          : `${cat.bgColor} ${cat.iconColor} group-hover:scale-110`
                      }`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h3 className={`text-2xl font-bold transition-colors ${
                          isSelected ? 'text-gray-900' : 'text-gray-800 group-hover:text-gray-900'
                        }`}>
                          {cat.label}
                        </h3>
                        <p className={`text-base transition-colors ${
                          isSelected ? 'text-gray-700' : 'text-gray-600'
                        }`}>
                          {cat.description}
                        </p>
                        {isSelected && (
                          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 animate-in fade-in duration-300">
                            <Check className="w-4 h-4" />
                            Selected
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick judge preferences, shown once a category is chosen */}
            {category && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center space-y-4 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    How we choose your judges
                  </h3>
                  <p className="text-gray-600">
                    You don&apos;t need to pick anything here — we automatically balance expertise, quality, and speed for your {category} request.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Industry experts</h4>
                      <p className="text-sm text-gray-600">Professionals in your field when it&apos;s relevant.</p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <Star className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Top rated judges</h4>
                      <p className="text-sm text-gray-600">People with consistently helpful feedback.</p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Fast responders</h4>
                      <p className="text-sm text-gray-600">Judges who typically reply within minutes.</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setJudgePreferences({ type: 'auto', category });
                      setTimeout(() => setStep(3), 400);
                    }}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    Continue · Auto‑match my judges
                    <Sparkles className="w-5 h-5" />
                  </button>
                  <p className="text-sm text-gray-500 mt-3">
                    We&apos;ll pick 3 judges for you — you can always see who responded later.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Context */}
        {step === 3 && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {/* Subcategory Tags */}
              {subcategories[category] && (
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    Get more specific (optional)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {subcategories[category].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSubcategory(subcategory === sub ? '' : sub)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                          subcategory === sub
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Context Input */}
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    What's the context? <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder={`e.g., "${category === 'appearance' ? 'Job interview at a tech startup next week - want to look professional but approachable' : 
                        category === 'profile' ? 'Updating LinkedIn for career change from finance to marketing - need to highlight transferable skills' :
                        category === 'writing' ? 'Follow-up email to potential client after great meeting - want to be enthusiastic but not pushy' :
                        'Choosing between two apartments - one in downtown (expensive, walkable) vs suburbs (affordable, need car)'
                      }"`}
                      className="w-full p-6 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-lg resize-none"
                      rows={6}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        context.length < 20 ? 'text-red-500' : context.length >= 20 ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {context.length}/500
                      </span>
                    </div>
                  </div>
                </div>

                {context.length >= 20 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <Check className="w-4 h-4" />
                      <span className="font-semibold">Perfect context!</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Experts will have everything they need to give you personalized feedback
                    </p>
                  </div>
                )}

                {context.length >= 20 && context.length < 80 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-blue-800 font-semibold text-sm mb-1">💡 Pro tip</p>
                        <p className="text-blue-700 text-sm">
                          Adding more details about your goals, timeline, or audience will get you even more tailored advice.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Tier Selection */}
              {context.length >= 20 && (
                <div className="space-y-6 pt-6 border-t border-gray-200">
                  <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      Choose your review tier
                    </label>
                    <p className="text-sm text-gray-600 mb-6">
                      Select the level of expertise and speed you need
                    </p>
                  </div>
                  <PricingTiers
                    selectedTier={selectedTier}
                    onSelectTier={setSelectedTier}
                    userCredits={userCredits}
                    showRecommended={true}
                    compact={true}
                    currentUserTier={userTier}
                    onUpgrade={handleTierUpgrade}
                  />
                </div>
              )}

              {/* Tone Selection */}
              {context.length >= 20 && (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      How honest should reviewers be?
                    </label>
                    <p className="text-sm text-gray-600 mb-4">
                      Choose the tone of feedback you want to receive
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setRequestedTone('encouraging')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        requestedTone === 'encouraging'
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          requestedTone === 'encouraging' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Heart className={`w-5 h-5 ${
                            requestedTone === 'encouraging' ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <h4 className={`font-semibold ${
                          requestedTone === 'encouraging' ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          Be Encouraging
                        </h4>
                      </div>
                      <p className={`text-sm ${
                        requestedTone === 'encouraging' ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        Gentle, supportive feedback with positive reinforcement
                      </p>
                    </button>

                    <button
                      onClick={() => setRequestedTone('honest')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        requestedTone === 'honest'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          requestedTone === 'honest' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <MessageSquare className={`w-5 h-5 ${
                            requestedTone === 'honest' ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <h4 className={`font-semibold ${
                          requestedTone === 'honest' ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          Be Direct
                        </h4>
                      </div>
                      <p className={`text-sm ${
                        requestedTone === 'honest' ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        Straightforward, balanced feedback (recommended)
                      </p>
                    </button>

                    <button
                      onClick={() => setRequestedTone('brutally_honest')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        requestedTone === 'brutally_honest'
                          ? 'border-red-500 bg-red-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          requestedTone === 'brutally_honest' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          <Zap className={`w-5 h-5 ${
                            requestedTone === 'brutally_honest' ? 'text-red-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <h4 className={`font-semibold ${
                          requestedTone === 'brutally_honest' ? 'text-red-900' : 'text-gray-900'
                        }`}>
                          Be Brutally Honest
                        </h4>
                      </div>
                      <p className={`text-sm ${
                        requestedTone === 'brutally_honest' ? 'text-red-700' : 'text-gray-600'
                      }`}>
                        No sugar-coating — give it to me straight
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || context.length < 20}
                  className={`relative px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                    submitting || context.length < 20
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-2xl transform hover:scale-105'
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {uploading ? 'Uploading...' : 'Creating request...'}
                    </div>
                  ) : user ? (
                    <div className="flex items-center gap-3">
                      <span>Get Expert {category} Feedback</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>Sign up & Get Feedback</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </button>
              </div>

              {context.length >= 20 && !submitting && (
                <div className="text-center mt-4 animate-in fade-in duration-500">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    You'll receive feedback in ~15 minutes
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}