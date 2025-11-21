'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Upload, Image, FileText, Briefcase, Heart, Palette, HelpCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const categories = [
  { id: 'appearance', label: 'Appearance', icon: Heart, description: 'Dating, events, professional looks' },
  { id: 'profile', label: 'Profile', icon: Briefcase, description: 'Resume, LinkedIn, dating profiles' },
  { id: 'writing', label: 'Writing', icon: FileText, description: 'Emails, messages, content' },
  { id: 'decision', label: 'Decision', icon: HelpCircle, description: 'Life choices, purchases' },
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
  const [context, setContext] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
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
        context,
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

        const { url } = await uploadRes.json();
        mediaUrl = url;
        setUploading(false);
      }

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
          context,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create request');
      }

      const { request } = await res.json();

      // Clean up
      (window as Window & { pendingFile?: File }).pendingFile = undefined;
      sessionStorage.removeItem('pendingFile');
      sessionStorage.removeItem('draftRequest');

      // Redirect to request page
      router.push(`/requests/${request.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                What would you like feedback on?
              </h2>

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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What type of feedback?</h2>
              <div className="grid grid-cols-2 gap-4">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className="p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-500 transition cursor-pointer text-left"
                    >
                      <Icon className="h-8 w-8 mb-2 text-indigo-600" />
                      <h4 className="font-semibold">{cat.label}</h4>
                      <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setStep(1)}
                className="mt-6 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Back
              </button>
            </>
          )}

          {/* Step 3: Context */}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add context</h2>

              {/* Subcategory */}
              {subcategories[category] && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {subcategories[category].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSubcategory(sub)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
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

              {/* Context */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What&apos;s this for? (helps judges give relevant feedback)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., 'Job interview at a tech company' or 'First date at a coffee shop'"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {context.length}/500 characters (minimum 20)
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || context.length < 20}
                  className={`px-8 py-3 rounded-lg font-semibold transition cursor-pointer ${
                    submitting || context.length < 20
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {submitting
                    ? uploading
                      ? 'Uploading...'
                      : 'Creating...'
                    : user
                    ? 'Get 10 Verdicts'
                    : 'Sign up to continue'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
