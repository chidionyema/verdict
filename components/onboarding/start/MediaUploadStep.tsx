'use client';

import { useRef } from 'react';
import { Upload, Check, Camera, Type, ArrowRight, Zap } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface MediaUploadStepProps {
  mediaType: 'photo' | 'text';
  setMediaType: (type: 'photo' | 'text') => void;
  previewUrl: string | null;
  textContent: string;
  setTextContent: (value: string) => void;
  textContentTouched: boolean;
  setTextContentTouched: (value: boolean) => void;
  dragActive: boolean;
  setDragActive: (value: boolean) => void;
  error: string;
  setError: (error: string) => void;
  onFileUpload: (file: File) => void;
  onTextSubmit: () => void;
}

export function MediaUploadStep({
  mediaType,
  setMediaType,
  previewUrl,
  textContent,
  setTextContent,
  textContentTouched,
  setTextContentTouched,
  dragActive,
  setDragActive,
  error,
  setError,
  onFileUpload,
  onTextSubmit,
}: MediaUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onFileUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          What would you like feedback on?
        </h3>
        <p className="text-sm text-gray-600 text-center mb-6">
          Upload a <span className="font-medium">photo</span> or paste your <span className="font-medium">text</span> to get started.
        </p>

        {/* Media Type Toggle */}
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

        {/* Upload Area */}
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
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload image for feedback"
              id="photo-upload"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <label htmlFor="text-content" className="sr-only">
                Your text content for feedback
              </label>
              <textarea
                id="text-content"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                onBlur={() => setTextContentTouched(true)}
                placeholder="Paste your text here... (minimum 50 characters for quality feedback)"
                className="w-full p-6 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-lg resize-none"
                rows={8}
                maxLength={2000}
                aria-describedby="text-content-count"
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
              <Tooltip
                content={textContent.length < 50 ? `Add ${50 - textContent.length} more characters` : ''}
                position="top"
                disabled={textContent.length >= 50}
              >
                <button
                  onClick={onTextSubmit}
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
              </Tooltip>
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
  );
}
