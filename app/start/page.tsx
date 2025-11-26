'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Upload, Image, FileText, Briefcase, Heart, Palette, HelpCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import SocialProofCarousel from '@/components/SocialProofCarousel';
import JudgePreview from '@/components/JudgePreview';
import SmartMessageBanner from '@/components/SmartMessageBanner';
import OutcomePrediction from '@/components/OutcomePrediction';
import SmartContextAnalyzer from '@/components/SmartContextAnalyzer';
import PersonalizationEngine from '@/components/PersonalizationEngine';
import QualityScoring from '@/components/QualityScoring';
import ViralGrowthHub from '@/components/ViralGrowthHub';
import { JudgePreferences } from '@/components/request/judge-preferences';
import type { JudgePreferences as JudgePreferencesType } from '@/components/request/judge-preferences';
import { TrustBadge, TrustBadgeGroup } from '@/components/shared/TrustBadge';
import { EncouragingCounter } from '@/components/shared/EncouragingCounter';
import { DecisionFramingHelper } from '@/components/request/DecisionFramingHelper';
import { VERDICT_TIERS, VERDICT_TIER_PRICING } from '@/lib/validations';

const categories = [
  { id: 'appearance', label: 'Appearance', icon: Heart, description: 'Dating, events, professional looks' },
  { id: 'profile', label: 'Profile', icon: Briefcase, description: 'Resume, LinkedIn, dating profiles' },
  { id: 'writing', label: 'Writing', icon: FileText, description: 'Emails, messages, content' },
  { id: 'decision', label: 'Decision', icon: HelpCircle, description: 'Job offers, relationships, life choices' },
];

// Mock judge data (replace with real data from API)
const mockJudges = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b192?w=150&h=150&fit=crop&crop=face',
    specialty: 'Style Expert',
    credentials: '10+ years fashion industry',
    rating: 4.9,
    verdictCount: 1247,
    responseTime: '2 hours',
    expertise: ['Professional Style', 'Color Analysis', 'Body Type'],
    successRate: 94
  },
  {
    id: '2',
    name: 'Marcus Williams',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    specialty: 'Career Coach',
    credentials: 'MBA, Executive Coach',
    rating: 4.8,
    verdictCount: 892,
    responseTime: '1 hour',
    expertise: ['Interview Prep', 'Leadership', 'Personal Brand'],
    successRate: 91
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    specialty: 'Dating Expert',
    credentials: 'Psychology PhD, 5+ years',
    rating: 4.9,
    verdictCount: 2156,
    responseTime: '30 min',
    expertise: ['Dating Photos', 'Profile Writing', 'Communication'],
    successRate: 96
  }
];

const subcategories: Record<string, string[]> = {
  appearance: ['date', 'interview', 'event', 'casual', 'professional'],
  profile: ['linkedin', 'resume', 'dating', 'professional'],
  writing: ['email', 'message', 'content', 'cover-letter'],
  decision: ['purchase', 'life', 'career', 'relationship'],
};

export default function StartPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState<'photo' | 'text'>('photo');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [uploading, setUploading] = useState(false);
  const [judgePreferences, setJudgePreferences] = useState<JudgePreferencesType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [tier, setTier] = useState<'basic' | 'standard' | 'premium'>('basic');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      
      // Restore draft if user just signed up
      const draft = sessionStorage.getItem('draftRequest');
      if (draft && user) {
        try {
          const parsed = JSON.parse(draft);
          setMediaType(parsed.mediaType || 'photo');
          setTextContent(parsed.textContent || '');
          setCategory(parsed.category || '');
          setSubcategory(parsed.subcategory || '');
          setTitle(parsed.title || '');
          setContext(parsed.context || '');
          
          // Restore file if it exists
          const pendingFile = (window as Window & { pendingFile?: File }).pendingFile;
          if (pendingFile) {
            setPreviewUrl(URL.createObjectURL(pendingFile));
          }
          
          // Auto-advance to the appropriate step
          if (parsed.category) {
            setStep(3); // Go to final step
          } else if (parsed.mediaType === 'text' && parsed.textContent) {
            setStep(2); // Go to category selection
          } else if (parsed.mediaType === 'photo' && pendingFile) {
            setStep(2); // Go to category selection
          }
        } catch (e) {
          console.error('Failed to restore draft:', e);
        }
      }
    });
  }, [supabase.auth]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, HEIC, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller');
      return;
    }

    setError('');
    setPreviewUrl(URL.createObjectURL(file));

    // Store file for later upload
    sessionStorage.setItem('pendingFile', JSON.stringify({
      name: file.name,
      type: file.type,
      size: file.size,
    }));

    // Store actual file in memory (workaround)
    (window as Window & { pendingFile?: File }).pendingFile = file;

    setStep(2);
  };

  const handleTextSubmit = () => {
    if (textContent.length < 50) {
      setError('Please write at least 50 characters');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setSubcategory('');
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!context || context.length < 20) {
      setError('Please provide context (at least 20 characters)');
      return;
    }

    // If not logged in, redirect to signup
    if (!user) {
      // Store draft in session
      sessionStorage.setItem('draftRequest', JSON.stringify({
        mediaType,
        textContent: mediaType === 'text' ? textContent : null,
        category,
        subcategory,
        title,
        context,
        tier,
      }));
      router.push('/auth/signup?redirect=/start/submit');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let mediaUrl = null;

      // Upload image if photo type
      if (mediaType === 'photo') {
        const file = (window as Window & { pendingFile?: File }).pendingFile;
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
        
        // Show warning if storage is not properly configured
        if (uploadData.warning) {
          console.warn('Upload warning:', uploadData.warning);
        }
        
        setUploading(false);
      }

      // Combine title and context for storage
      const fullContext = title ? `${title}\n\n${context}` : context;

      // Create request
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subcategory: subcategory || null,
          media_type: mediaType,
          media_url: mediaUrl,
          text_content: mediaType === 'text' ? textContent : null,
          context: fullContext,
          judge_preferences: judgePreferences,
          tier,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('API Error Details:', data);
        throw new Error(data.details || data.error || 'Failed to create request');
      }

      const { request } = await res.json();

      // Clean up
      (window as Window & { pendingFile?: File }).pendingFile = undefined;
      sessionStorage.removeItem('pendingFile');
      sessionStorage.removeItem('draftRequest');

      // Redirect to success page with context
      const successUrl = `/success?category=${encodeURIComponent(category)}&mediaType=${encodeURIComponent(mediaType)}&context=${encodeURIComponent(context)}&requestId=${encodeURIComponent(request.id || 'unknown')}`;
      router.push(successUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <SmartMessageBanner currentStep={step} category={category} />
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step > s ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 1 && (
            <>
              {/* Simple, focused start */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Life's tough decisions made clearer in 10 minutes
                </h2>
                <p className="text-gray-600 text-lg">
                  Get 3 expert perspectives on your photos, text, or decisions
                </p>
              </div>

              {/* Social Proof - Only show after media type selection */}
              {(mediaType === 'photo' && previewUrl) || (mediaType === 'text' && textContent.length > 20) ? (
                <div className="mb-6">
                  <SocialProofCarousel />
                </div>
              ) : null}

              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                What would you like feedback on?
              </h3>

              <div className="flex space-x-4 mb-8">
                <button
                  onClick={() => setMediaType('photo')}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition cursor-pointer ${
                    mediaType === 'photo'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Image className="inline h-5 w-5 mr-2" />
                  Photo
                </button>
                <button
                  onClick={() => setMediaType('text')}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition cursor-pointer ${
                    mediaType === 'text'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="inline h-5 w-5 mr-2" />
                  Text
                </button>
              </div>

              {mediaType === 'photo' ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  {previewUrl ? (
                    <div className="mb-4">
                      <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">Upload your photo</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-6 py-3 rounded-lg font-medium cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    {previewUrl ? 'Change Photo' : 'Choose Photo'}
                  </label>
                  
                  {/* Show next step preview when ready */}
                  {previewUrl && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="font-medium">Photo uploaded successfully!</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Next: Choose what type of feedback you'd like
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste your text here... (minimum 50 characters)"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={6}
                  />
                  
                  {/* Show next step preview when ready */}
                  {textContent.length >= 50 && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="font-medium">Text looks good!</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Ready for the next step: Choose your feedback type
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-4">
                    <span className={`text-sm ${textContent.length < 50 ? 'text-red-500' : 'text-gray-500'}`}>
                      {textContent.length}/500 characters
                    </span>
                    <button
                      onClick={handleTextSubmit}
                      disabled={textContent.length < 50}
                      className={`px-6 py-3 rounded-lg font-medium transition cursor-pointer ${
                        textContent.length < 50
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <>
              {/* Progress Indicator */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-2">
                  {mediaType === 'photo' ? 'Photo uploaded' : 'Text ready'} ✓
                </p>
                <h2 className="text-2xl font-bold text-gray-900">Choose your feedback type</h2>
                <p className="text-gray-600 mt-2">Select the area where you'd like expert guidance</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  
                  return (
                    <div key={cat.id} className="relative">
                      <button
                        onClick={() => setCategory(cat.id)}
                        className={`w-full p-6 rounded-xl border-2 transition-all cursor-pointer text-left ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Icon className={`h-8 w-8 mt-1 ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`} />
                          <div>
                            <h4 className={`font-semibold text-lg ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                              {cat.label}
                            </h4>
                            <p className={`text-sm mt-1 ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                              {cat.description}
                            </p>
                            {isSelected && (
                              <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
                                <p className="text-sm text-indigo-800 font-medium">✓ Selected</p>
                                <p className="text-xs text-indigo-600 mt-1">Our {cat.label.toLowerCase()} experts are ready</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Show judge preview after category selection */}
              {category && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
                  <h4 className="font-semibold text-gray-900 mb-3 text-center">
                    Your {category} expert will be:
                  </h4>
                  <JudgePreview judges={mockJudges} category={category} />
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 transition"
                >
                  ← Back to upload
                </button>
                {category && (
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Choose judges →
                  </button>
                )}
              </div>
            </>
          )}

          {/* Step 3: Judge Selection */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-2">
                  {mediaType === 'photo' ? 'Photo' : 'Text'} ready ✓ • {category} feedback selected ✓
                </p>
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Judges</h2>
                <p className="text-gray-600 mt-2">Select the type of people you want feedback from</p>
              </div>

              <JudgePreferences 
                category={category}
                onPreferencesChange={(prefs) => {
                  setJudgePreferences(prefs);
                  setStep(4);
                }}
              />

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 transition"
                >
                  ← Back to category
                </button>
              </div>
            </>
          )}

          {/* Step 4: Context */}
          {step === 4 && (
            <>
              {/* Progress Summary */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-2">
                  {mediaType === 'photo' ? 'Photo' : 'Text'} ready ✓ • {category} feedback selected ✓ • Judges selected ✓
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {category === 'decision' ? 'Explain your situation' : 'Add context for better feedback'}
                </h2>
                <p className="text-gray-600 mt-2">
                  {category === 'decision'
                    ? 'The more detail you provide, the better advice you\'ll receive'
                    : 'Help experts understand your specific situation'}
                </p>
              </div>

              {/* Trust Badges */}
              <div className="mb-6">
                <TrustBadgeGroup className="justify-center" />
              </div>

              {/* Subcategory */}
              {subcategories[category] && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    More specific area (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {subcategories[category].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSubcategory(sub)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer capitalize ${
                          subcategory === sub
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Framing Helper */}
              <DecisionFramingHelper
                category={category}
                title={title}
                onTitleChange={setTitle}
                className="mb-8"
              />

              {/* Context Input - Focused and Clear */}
              <div className="mb-8">
                <label 
                  htmlFor="context-textarea"
                  className="block text-lg font-medium text-gray-900 mb-3"
                >
                  {category === 'decision' ? 'Explain your situation' : 'Additional context'}
                </label>
                {category === 'decision' && (
                  <p className="text-sm text-gray-600 mb-3">
                    Include: What's at stake, your concerns, timeline, constraints, and what you've already considered
                  </p>
                )}
                <textarea
                  id="context-textarea"
                  value={context}
                  onChange={(e) => {
                    setContext(e.target.value);
                    // Real-time validation
                    if (e.target.value.length > 0 && e.target.value.length < 20) {
                      setValidationErrors(prev => ({
                        ...prev,
                        context: 'Please provide at least 20 characters for better feedback'
                      }));
                    } else {
                      setValidationErrors(prev => {
                        const { context, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  placeholder={`e.g., "${category === 'appearance' ? 'Job interview at a tech startup next week' :
                    category === 'profile' ? 'Updating LinkedIn for career change to marketing' :
                    category === 'writing' ? 'Follow-up email to potential client after meeting' :
                    'Should I take the startup job offer or stay at my stable corporate position? The startup offers equity but lower salary. I have a mortgage and two kids. Need to decide by Friday.'
                  }"`}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg ${
                    validationErrors.context ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  rows={category === 'decision' ? 6 : 5}
                  aria-invalid={!!validationErrors.context}
                  aria-describedby={validationErrors.context ? 'context-error' : undefined}
                />
                {validationErrors.context && (
                  <p id="context-error" className="text-sm text-red-600 mt-2" role="alert">
                    {validationErrors.context}
                  </p>
                )}
                <EncouragingCounter
                  count={context.length}
                  min={20}
                  max={500}
                  className="mt-3"
                />
              </div>

              {/* Show simple context quality tip only after good length */}
              {context.length >= 20 && context.length < 80 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm font-medium mb-1">💡 Tip for better feedback</p>
                  <p className="text-blue-700 text-sm">
                    Add more details about your goal, audience, or timeline for more specific advice.
                  </p>
                </div>
              )}

              {/* Personalization Engine - Show after context is ready */}
              {context.length >= 40 && (
                <div className="mb-8">
                  <PersonalizationEngine 
                    category={category}
                    mediaType={mediaType}
                    context={context}
                  />
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 transition"
                >
                  ← Back to judges
                </button>
                
                <div className="flex items-center gap-4">
                  {context.length >= 20 && !submitting && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Ready to submit</p>
                      <p className="text-xs text-gray-500">Get feedback in ~30 minutes</p>
                    </div>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || context.length < 20}
                    className={`px-8 py-3 rounded-xl font-semibold transition cursor-pointer text-lg ${
                      submitting || context.length < 20
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                    }`}
                  >
                    {submitting
                      ? uploading
                        ? 'Uploading...'
                        : 'Creating request...'
                      : user
                      ? `Get ${category} feedback`
                      : 'Sign up & get feedback'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
