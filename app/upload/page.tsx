'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Image, FileText } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function UploadPage() {
  const router = useRouter();
  const setUploadedMedia = useStore((state) => state.setUploadedMedia);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaType, setMediaType] = useState<'image' | 'text'>('image');
  const [textContent, setTextContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Simulate upload progress with realistic increments
    const progressSteps = [15, 30, 45, 60, 75, 90, 100];
    for (let i = 0; i < progressSteps.length; i++) {
      setTimeout(() => {
        setUploadProgress(progressSteps[i]);
        
        // Complete upload when progress reaches 100%
        if (progressSteps[i] === 100) {
          setTimeout(() => {
            setUploadedMedia({ url, type: 'image' });
            router.push('/context');
          }, 200);
        }
      }, i * 200);
    }
  };

  const handleTextSubmit = () => {
    if (textContent.length < 120) {
      alert('Please write at least 50 characters');
      return;
    }

    setUploadedMedia({ url: textContent, type: 'text' });
    router.push('/context');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          What would you like feedback on?
        </h2>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setMediaType('image')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition cursor-pointer ${
                mediaType === 'image'
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

          {mediaType === 'image' ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              {previewUrl ? (
                <div className="mb-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  {uploading && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-indigo-600 mb-2">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-indigo-100 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    Drag and drop your image here, or click to browse
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className={`inline-block px-6 py-3 rounded-lg font-medium cursor-pointer transition ${
                  uploading
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {uploading ? 'Uploading...' : 'Choose File'}
              </label>
            </div>
          ) : (
            <div>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Write what you'd like feedback on... (minimum 50 characters)"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={6}
              />
              <div className="flex justify-between items-center mt-4">
                <span
                  className={`text-sm ${
                    textContent.length < 120 ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  {textContent.length}/500 characters
                </span>
                <button
                  onClick={handleTextSubmit}
                  disabled={textContent.length < 120}
                  className={`px-6 py-3 rounded-lg font-medium transition cursor-pointer ${
                    textContent.length < 120
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
