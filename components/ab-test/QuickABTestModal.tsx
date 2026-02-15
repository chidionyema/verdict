'use client';

import { useState, useCallback } from 'react';
import { X, Upload, Zap, ArrowRight, Check, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/components/ui/toast';

interface QuickABTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (testId: string) => void;
}

const VERDICT_OPTIONS = [
  { count: 3, label: '3 verdicts', credits: 1, speed: 'Quick signal' },
  { count: 5, label: '5 verdicts', credits: 2, speed: 'Confident' },
  { count: 10, label: '10 verdicts', credits: 3, speed: 'Statistical' },
];

const CATEGORIES = [
  { value: 'dating', label: 'Dating Profile', icon: '💕' },
  { value: 'professional', label: 'Professional', icon: '💼' },
  { value: 'social', label: 'Social Media', icon: '📱' },
  { value: 'product', label: 'Product Photo', icon: '🛍️' },
  { value: 'creative', label: 'Creative/Art', icon: '🎨' },
  { value: 'other', label: 'Other', icon: '📸' },
];

export function QuickABTestModal({ isOpen, onClose, onSuccess }: QuickABTestModalProps) {
  const [step, setStep] = useState(1);
  const [photoA, setPhotoA] = useState<{ file: File; preview: string } | null>(null);
  const [photoB, setPhotoB] = useState<{ file: File; preview: string } | null>(null);
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [verdictCount, setVerdictCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const onDropA = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setPhotoA({
        file: acceptedFiles[0],
        preview: URL.createObjectURL(acceptedFiles[0]),
      });
    }
  }, []);

  const onDropB = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setPhotoB({
        file: acceptedFiles[0],
        preview: URL.createObjectURL(acceptedFiles[0]),
      });
    }
  }, []);

  const dropzoneA = useDropzone({
    onDrop: onDropA,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const dropzoneB = useDropzone({
    onDrop: onDropB,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const canProceed = () => {
    if (step === 1) return photoA && photoB;
    if (step === 2) return question.trim().length >= 10 && category;
    return true;
  };

  const handleSubmit = async () => {
    if (!photoA || !photoB) return;

    setSubmitting(true);
    try {
      // Convert files to base64
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

      const [photoAData, photoBData] = await Promise.all([
        toBase64(photoA.file),
        toBase64(photoB.file),
      ]);

      const response = await fetch('/api/split-tests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          question: question.trim(),
          context: '',
          photoAFile: {
            name: photoA.file.name,
            type: photoA.file.type,
            size: photoA.file.size,
            data: photoAData,
          },
          photoBFile: {
            name: photoB.file.name,
            type: photoB.file.type,
            size: photoB.file.size,
            data: photoBData,
          },
          targetVerdicts: verdictCount,
          testType: 'ab', // Mark as simple A/B test
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create test');
      }

      const data = await response.json();
      toast.success('A/B Test created! Results coming soon.');
      onSuccess?.(data.splitTestId);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create test');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedVerdictOption = VERDICT_OPTIONS.find((o) => o.count === verdictCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Quick A/B Test</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s < step
                    ? 'bg-orange-500 text-white'
                    : s === step
                    ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${s < step ? 'bg-orange-500' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
          <span className="text-sm text-gray-600 ml-2">
            {step === 1 && 'Upload photos'}
            {step === 2 && 'Add context'}
            {step === 3 && 'Launch'}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {/* Step 1: Upload Photos */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload two photos to compare. Judges will pick which one is better.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Photo A */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                      A
                    </span>
                    Photo A
                  </div>
                  <div
                    {...dropzoneA.getRootProps()}
                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${
                      dropzoneA.isDragActive
                        ? 'border-green-500 bg-green-50'
                        : photoA
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...dropzoneA.getInputProps()} />
                    {photoA ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={photoA.preview}
                          alt="Photo A"
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoA(null);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Drop or tap</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Photo B */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                      B
                    </span>
                    Photo B
                  </div>
                  <div
                    {...dropzoneB.getRootProps()}
                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${
                      dropzoneB.isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : photoB
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...dropzoneB.getInputProps()} />
                    {photoB ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={photoB.preview}
                          alt="Photo B"
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoB(null);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Drop or tap</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Context */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`p-3 rounded-lg border text-center transition cursor-pointer ${
                        category === cat.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <div className="text-xs mt-1">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you deciding?
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Which photo should I use for my dating profile?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {question.length}/100 characters (min 10)
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configure */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many verdicts?
                </label>
                <div className="space-y-2">
                  {VERDICT_OPTIONS.map((option) => (
                    <button
                      key={option.count}
                      onClick={() => setVerdictCount(option.count)}
                      className={`w-full p-3 rounded-lg border flex items-center justify-between transition cursor-pointer ${
                        verdictCount === option.count
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            verdictCount === option.count
                              ? 'border-orange-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {verdictCount === option.count && (
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.speed}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-orange-600">{option.credits} credit{option.credits > 1 ? 's' : ''}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Preview</div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {photoA && (
                      <Image
                        src={photoA.preview}
                        alt="A"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-white"
                      />
                    )}
                    {photoB && (
                      <Image
                        src={photoB.preview}
                        alt="B"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-white"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{question || 'Your question'}</div>
                    <div className="text-sm text-gray-500">
                      {CATEGORIES.find((c) => c.value === category)?.label || 'Category'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition cursor-pointer ${
                canProceed()
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 flex items-center gap-2 transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Launch Test • {selectedVerdictOption?.credits} credit{(selectedVerdictOption?.credits || 0) > 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
