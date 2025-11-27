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
  Mic,
} from 'lucide-react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import type { User } from '@supabase/supabase-js';

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
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState<'photo' | 'text' | 'audio'>('photo');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [context, setContext] = useState('');
  const [uploading, setUploading] = useState(false);
  const [judgePreferences, setJudgePreferences] = useState<{ type: string; category: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase?.auth]);

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
    const audioTypes = ['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg'];
    const isImage = imageTypes.includes(file.type);
    const isAudio = audioTypes.includes(file.type);

    if (!isImage && !isAudio) {
      setError('Only JPEG, PNG, HEIC, WebP images or supported audio (webm, mp3, mp4, ogg) are allowed');
      return;
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller');
      return;
    }

    if (isAudio && file.size > 10 * 1024 * 1024) {
      setError('Audio must be 10MB or smaller');
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
      sessionStorage.setItem('draftRequest', JSON.stringify({
        mediaType,
        textContent: mediaType === 'text' ? textContent : null,
        category,
        subcategory,
        context,
      }));
      router.push('/auth/signup?redirect=/start');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let mediaUrl = null;

      if (mediaType === 'photo' || mediaType === 'audio') {
        const file = (window as any).pendingFile;
        if (!file) {
          setError(mediaType === 'photo' ? 'Please upload an image' : 'Please record a voice note');
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || 'Failed to create request');
      }

      const { request } = await res.json();
      
      // Success animation
      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/waiting?request=${request.id}`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Share what you'd like feedback on";
      case 2: return "What type of feedback do you need?";
      case 3: return "Who should give you feedback?";
      case 4: return "Add context for personalized insights";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return "Upload a photo or paste your text to get started";
      case 2: return "Choose the area where you need expert guidance";
      case 3: return "Select your ideal reviewer preferences";
      case 4: return "Help experts understand your specific situation";
      default: return "";
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
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
            {[1, 2, 3, 4].map((s) => (
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
            <span>Upload</span>
            <span>Category</span>
            <span>Preferences</span>
            <span>Context</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
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
                    : mediaType === 'audio'
                    ? 'Voice note attached – judges will be able to listen.'
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
                {mediaType === 'audio' && previewUrl && (
                  <audio controls src={previewUrl} className="w-40 flex-shrink-0" />
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
              
              <div className="grid grid-cols-3 gap-4 mb-8">
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

                <button
                  onClick={() => setMediaType('audio')}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    mediaType === 'audio'
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      mediaType === 'audio' 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }`}>
                      <Mic className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h4 className={`font-semibold ${mediaType === 'audio' ? 'text-indigo-900' : 'text-gray-900'}`}>
                        Voice note
                      </h4>
                      <p className={`text-sm ${mediaType === 'audio' ? 'text-indigo-600' : 'text-gray-600'}`}>
                        Record up to 2 minutes
                      </p>
                    </div>
                  </div>
                  {mediaType === 'audio' && (
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
              ) : mediaType === 'text' ? (
                <div className="space-y-6">
                  <div className="relative">
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste your text here... (minimum 50 characters)"
                      className="w-full p-6 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-lg resize-none"
                      rows={8}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        textContent.length < 50 ? 'text-red-500' : 'text-green-600'
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
              ) : (
                <div className="space-y-6">
                  <VoiceRecorder
                    onRecorded={(file) => {
                      handleFile(file);
                    }}
                    maxDurationSeconds={120}
                  />
                  {previewUrl && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm text-green-800 font-semibold mb-2">
                        Voice note ready
                      </p>
                      <audio controls src={previewUrl} className="w-full" />
                    </div>
                  )}
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

        {/* Step 2: Category */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                      setTimeout(() => setStep(3), 600);
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
                            Selected - Moving to next step
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
          </div>
        )}

        {/* Step 3: Quick Judge Preferences */}
        {step === 3 && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Who should review your {category}?
                </h3>
                <p className="text-gray-600">
                  We'll match you with the perfect experts for your needs
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Industry Experts</h4>
                    <p className="text-sm text-gray-600">Professionals in your field</p>
                  </div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <Star className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Top Rated</h4>
                    <p className="text-sm text-gray-600">Highest rated reviewers</p>
                  </div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Quick Response</h4>
                    <p className="text-sm text-gray-600">Fastest turnaround time</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setJudgePreferences({ type: 'auto', category });
                    setTimeout(() => setStep(4), 400);
                  }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                >
                  Auto-match me with perfect experts
                  <Sparkles className="w-5 h-5" />
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  We'll select the best 3 experts based on your {category} request
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Context */}
        {step === 4 && (
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