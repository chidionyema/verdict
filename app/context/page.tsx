'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Briefcase, Heart, Palette, HelpCircle } from 'lucide-react';

const categories = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Heart,
    description: 'Dating, events, professional looks',
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: Briefcase,
    description: 'Resume, LinkedIn, work emails',
  },
  {
    id: 'creative',
    label: 'Creative',
    icon: Palette,
    description: 'Art, writing, design work',
  },
  {
    id: 'decisions',
    label: 'Decisions',
    icon: HelpCircle,
    description: 'Life choices, purchases',
  },
];

export default function ContextPage() {
  const router = useRouter();
  const uploadedMedia = useStore((state) => state.uploadedMedia);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [context, setContext] = useState('');

  useEffect(() => {
    if (!uploadedMedia) {
      router.push('/upload');
    }
  }, [uploadedMedia, router]);

  if (!uploadedMedia) {
    return null;
  }

  const handleContinue = () => {
    if (!selectedCategory || context.length < 20) {
      alert('Please select a category and provide context (at least 20 characters)');
      return;
    }

    // Store the request details temporarily in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'pendingRequest',
        JSON.stringify({
          mediaUrl: uploadedMedia.url,
          mediaType: uploadedMedia.type,
          category: selectedCategory,
          context,
        })
      );
    }

    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Help judges understand your needs
        </h2>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Preview */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-4">Your submission:</h3>
            {uploadedMedia.type === 'image' ? (
              <img
                src={uploadedMedia.url}
                alt="Upload preview"
                className="w-full max-w-md mx-auto rounded-lg"
              />
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{uploadedMedia.url}</p>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-4">Select a category:</h3>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                    <h4 className="font-semibold">{cat.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context Input */}
          <div className="mb-8">
            <label
              htmlFor="context"
              className="block font-semibold text-gray-700 mb-2"
            >
              What&apos;s this for? (helps judges give relevant feedback)
            </label>
            <input
              id="context"
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., 'Job interview at a tech company' or 'First date'"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              {context.length}/200 characters (minimum 20)
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition cursor-pointer"
          >
            Continue to Get Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
