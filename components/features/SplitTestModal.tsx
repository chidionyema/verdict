'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Zap, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { TouchButton } from '@/components/ui/touch-button';
import { InsufficientCreditsModal } from '@/components/modals/InsufficientCreditsModal';
import { toast } from '@/components/ui/toast';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface SplitTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  label: string;
}

const splitTestCategories = {
  dating: {
    title: 'Dating Photo Split Test',
    description: 'Find out which photo gets better results',
    suggestions: ['Profile photos', 'Different outfits', 'Various poses', 'Indoor vs outdoor']
  },
  professional: {
    title: 'Professional Photo Split Test',
    description: 'Compare LinkedIn headshots and business photos',
    suggestions: ['Headshots', 'Business attire', 'Background settings', 'Formal vs casual']
  },
  outfit: {
    title: 'Outfit Comparison',
    description: 'Get feedback on which look works better',
    suggestions: ['Date night outfits', 'Interview attire', 'Casual vs dressy', 'Color combinations']
  },
  general: {
    title: 'Photo A/B Test',
    description: 'Compare any two photos for feedback',
    suggestions: ['Different angles', 'Lighting variations', 'Styling choices', 'Background options']
  }
};

export function SplitTestModal({ isOpen, onClose, category }: SplitTestModalProps) {
  const [images, setImages] = useState<{ A: UploadedImage | null; B: UploadedImage | null }>({
    A: null,
    B: null
  });
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  const fileInputRefs = {
    A: useRef<HTMLInputElement>(null),
    B: useRef<HTMLInputElement>(null)
  };

  const config = splitTestCategories[category as keyof typeof splitTestCategories] || splitTestCategories.general;

  useEffect(() => {
    if (isOpen) {
      fetchUserCredits();
    }
  }, [isOpen]);

  const fetchUserCredits = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        setUserCredits((data as any)?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const handleImageUpload = (side: 'A' | 'B', file: File) => {
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setImages(prev => ({
        ...prev,
        [side]: {
          file,
          preview,
          label: `Photo ${side}`
        }
      }));
    }
  };

  const handleFileInputChange = (side: 'A' | 'B') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(side, file);
    }
  };

  const handleDrop = (side: 'A' | 'B') => (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(side, file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = (side: 'A' | 'B') => {
    if (images[side]) {
      URL.revokeObjectURL(images[side]!.preview);
      setImages(prev => ({
        ...prev,
        [side]: null
      }));
    }
  };

  const handleSubmit = async () => {
    if (!images.A || !images.B || !question.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Prepare the request data
      const requestData = {
        category,
        question: question.trim(),
        context: '', // Could add a context field later
        photoAFile: {
          name: images.A.file.name,
          type: images.A.file.type,
          size: images.A.file.size,
          data: await convertFileToBase64(images.A.file),
        },
        photoBFile: {
          name: images.B.file.name,
          type: images.B.file.type,
          size: images.B.file.size,
          data: await convertFileToBase64(images.B.file),
        },
        visibility: 'public',
        targetVerdicts: 3,
      };

      const response = await fetch('/api/split-tests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle insufficient credits specifically
        if (response.status === 402) {
          setShowCreditsModal(true);
          setIsSubmitting(false);
          return;
        }

        throw new Error(errorData.error || 'Failed to create split test');
      }

      const { splitTestId, estimatedCompletion } = await response.json();
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        // Redirect to the split test results page
        window.location.href = `/split-tests/${splitTestId}`;
      }, 3000);
    } catch (error) {
      console.error('Error submitting split test:', error);
      toast.error(
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const resetModal = () => {
    // Clean up preview URLs
    if (images.A) URL.revokeObjectURL(images.A.preview);
    if (images.B) URL.revokeObjectURL(images.B.preview);
    
    setImages({ A: null, B: null });
    setQuestion('');
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        requiredCredits={1}
        currentCredits={userCredits}
        onPurchaseSuccess={() => {
          fetchUserCredits();
          setShowCreditsModal(false);
        }}
      />

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6" />
              {config.title}
            </h2>
            <button
              onClick={resetModal}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-purple-100 mt-2">{config.description}</p>
        </div>

        <div className="p-6">
          {!showSuccess ? (
            <div className="space-y-6">
              {/* Question Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to compare?
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Which photo works better for my dating profile?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Upload Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['A', 'B'].map((side) => (
                  <div key={side} className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Photo {side}
                    </label>
                    
                    {images[side as 'A' | 'B'] ? (
                      /* Image Preview */
                      <div className="relative border-2 border-purple-200 rounded-xl overflow-hidden group">
                        <div className="aspect-square relative bg-gray-100">
                          <Image
                            src={images[side as 'A' | 'B']!.preview}
                            alt={`Photo ${side}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex gap-2">
                            <TouchButton
                              onClick={() => fileInputRefs[side as 'A' | 'B'].current?.click()}
                              className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Replace
                            </TouchButton>
                            <TouchButton
                              onClick={() => removeImage(side as 'A' | 'B')}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </TouchButton>
                          </div>
                        </div>

                        {/* Photo Label */}
                        <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {side}
                        </div>
                      </div>
                    ) : (
                      /* Upload Area */
                      <div
                        onDrop={handleDrop(side as 'A' | 'B')}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRefs[side as 'A' | 'B'].current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors group"
                      >
                        <div className="text-center">
                          <Upload className="h-12 w-12 text-gray-400 group-hover:text-purple-500 mx-auto mb-4 transition-colors" />
                          <p className="text-gray-600 font-medium mb-2">Upload Photo {side}</p>
                          <p className="text-sm text-gray-500">
                            Drop image here or click to browse
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            PNG, JPG up to 10MB
                          </p>
                        </div>

                        {/* Large letter indicator */}
                        <div className="absolute top-4 right-4 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                          {side}
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRefs[side as 'A' | 'B']}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange(side as 'A' | 'B')}
                      className="hidden"
                    />
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">💡 Great for comparing:</h4>
                <ul className="text-sm text-gray-600 grid grid-cols-2 gap-1">
                  {config.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span className="text-gray-400">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* How it Works */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">How Split Testing Works</h4>
                <div className="flex items-center gap-4 text-sm text-purple-700">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>3 judges compare both photos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Clear winner declared</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Detailed improvement tips</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <TouchButton
                onClick={handleSubmit}
                disabled={!images.A || !images.B || !question.trim() || isSubmitting}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white disabled:opacity-50 py-4"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Creating Split Test...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Start Split Test (1 Credit)
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </TouchButton>

              <p className="text-xs text-gray-500 text-center">
                Your photos will be shown to judges anonymously for comparison feedback
              </p>
            </div>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Split Test Created!</h3>
              <p className="text-gray-600 mb-6">
                Your A/B comparison is now live. You'll get detailed feedback on which photo
                performs better and why within the next hour.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  🎯 <strong>What to expect:</strong> Judges will see both photos side-by-side
                  and provide specific feedback on which one works better for your goal.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}