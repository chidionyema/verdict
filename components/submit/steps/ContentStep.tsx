'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Type, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import {
  StepProps,
  REQUEST_TYPES,
  RequestType,
  MediaType,
  getRequestTypeConfig,
} from '../types';

interface ContentStepProps extends StepProps {
  onFileUpload: (file: File) => Promise<string>; // Returns uploaded URL
}

export function ContentStep({
  data,
  onUpdate,
  onNext,
  userCredits,
  isOnline,
  onFileUpload,
}: ContentStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestConfig = getRequestTypeConfig(data.requestType);
  const requiredFiles = requestConfig.fileCount;
  const hasEnoughContent = data.mediaType === 'text'
    ? data.textContent.length >= 50
    : data.mediaUrls.length >= requiredFiles;

  // Handle request type change
  const handleTypeChange = (type: RequestType) => {
    const config = getRequestTypeConfig(type);
    onUpdate({
      requestType: type,
      mediaUrls: [], // Clear uploads when changing type
      textContent: '',
    });
  };

  // Handle media type change
  const handleMediaTypeChange = (mediaType: MediaType) => {
    onUpdate({
      mediaType,
      mediaUrls: [],
      textContent: '',
    });
    setUploadError(null);
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const url = await onFileUpload(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to mediaUrls
      const newUrls = [...data.mediaUrls, url].slice(0, requiredFiles);
      onUpdate({ mediaUrls: newUrls });

      // Haptic feedback on success
      if (navigator.vibrate) navigator.vibrate(10);

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [data.mediaUrls, onFileUpload, onUpdate, requiredFiles]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Remove uploaded image
  const handleRemoveImage = (index: number) => {
    onUpdate({
      mediaUrls: data.mediaUrls.filter((_, i) => i !== index),
    });
  };

  // Handle continue
  const handleContinue = () => {
    if (hasEnoughContent) {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      {/* Credit notice if 0 credits */}
      {userCredits === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">You have 0 credits</p>
              <p className="text-sm text-amber-700 mt-1">
                Complete your submission below. You can earn a credit for free or pay at checkout.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Request Type Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What type of feedback do you need?
        </h3>
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          role="radiogroup"
          aria-label="Request type"
        >
          {REQUEST_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              role="radio"
              aria-checked={data.requestType === type.id}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                data.requestType === type.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {type.popular && (
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              {type.badge && !type.popular && (
                <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {type.badge}
                </span>
              )}

              <div className="text-2xl mb-2">{type.icon}</div>
              <h4 className="font-semibold text-gray-900">{type.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{type.description}</p>

              {data.requestType === type.id && (
                <div className="absolute top-3 right-3">
                  <Check className="h-5 w-5 text-indigo-600" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Media Type Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What are you sharing?
        </h3>
        <div className="flex gap-4" role="radiogroup" aria-label="Content type">
          <button
            onClick={() => handleMediaTypeChange('photo')}
            role="radio"
            aria-checked={data.mediaType === 'photo'}
            className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
              data.mediaType === 'photo'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              data.mediaType === 'photo' ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
              <ImageIcon className={`h-5 w-5 ${
                data.mediaType === 'photo' ? 'text-indigo-600' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Photo / Image</p>
              <p className="text-sm text-gray-600">Upload photos, screenshots, designs</p>
            </div>
          </button>

          <button
            onClick={() => handleMediaTypeChange('text')}
            role="radio"
            aria-checked={data.mediaType === 'text'}
            className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
              data.mediaType === 'text'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              data.mediaType === 'text' ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
              <Type className={`h-5 w-5 ${
                data.mediaType === 'text' ? 'text-indigo-600' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Text / Writing</p>
              <p className="text-sm text-gray-600">Messages, bios, essays, copy</p>
            </div>
          </button>
        </div>
      </div>

      {/* Upload Area or Text Input */}
      {data.mediaType === 'photo' ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload your {data.requestType === 'standard' ? 'photo' : 'photos'}
            {data.requestType !== 'standard' && (
              <span className="text-gray-500 font-normal"> ({data.mediaUrls.length}/{requiredFiles})</span>
            )}
          </h3>

          {/* Uploaded Images */}
          {data.mediaUrls.length > 0 && (
            <div className={`grid gap-4 mb-4 ${
              data.requestType === 'standard' ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {data.mediaUrls.map((url, index) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {data.requestType !== 'standard' && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm">
                      Option {String.fromCharCode(65 + index)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Dropzone */}
          {data.mediaUrls.length < requiredFiles && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              } ${isUploading ? 'pointer-events-none opacity-75' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="sr-only"
                disabled={isUploading}
              />

              {isUploading ? (
                <div className="space-y-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium">
                    {dragActive ? 'Drop your image here' : 'Click or drag to upload'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    JPEG, PNG, or WebP up to 5MB
                  </p>
                </>
              )}
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="mt-3 flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{uploadError}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Paste or type your content
          </h3>
          <textarea
            value={data.textContent}
            onChange={(e) => onUpdate({ textContent: e.target.value })}
            placeholder="Enter the text you want feedback on..."
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-describedby="text-help"
          />
          <div className="flex justify-between items-center mt-2">
            <p id="text-help" className="text-sm text-gray-500">
              Minimum 50 characters for meaningful feedback
            </p>
            <p className={`text-sm ${
              data.textContent.length >= 50 ? 'text-green-600' : 'text-gray-500'
            }`}>
              {data.textContent.length}/50
              {data.textContent.length >= 50 && (
                <Check className="inline h-4 w-4 ml-1" />
              )}
            </p>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={handleContinue}
          disabled={!hasEnoughContent || !isOnline}
          className={`px-8 py-3 rounded-xl font-semibold text-white transition-all flex items-center gap-2 ${
            hasEnoughContent && isOnline
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:-translate-y-0.5'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Continue
          <span className="text-white/70">→</span>
        </button>
      </div>

      {/* Offline notice */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-amber-800">You're offline. Your draft is saved and will sync when you reconnect.</p>
        </div>
      )}
    </div>
  );
}
