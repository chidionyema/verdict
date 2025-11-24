'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FormProgress } from '@/components/ui/form-progress';
import { FormSummary } from '@/components/ui/form-summary';
import { LoadingState, UploadingState, ProcessingState } from '@/components/ui/loading-state';
import { TouchButton } from '@/components/ui/touch-button';
import { TouchFileInput } from '@/components/ui/touch-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, FileText, ArrowLeft, ArrowRight, Sparkles, Clock, Shield } from 'lucide-react';

interface FormData {
  mediaType?: 'photo' | 'text';
  content?: string;
  fileUrl?: string;
  category?: string;
  subcategory?: string;
  context?: string;
  targetVerdictCount: number;
}

const STEPS = [
  { id: 1, title: 'Content', subtitle: 'What to review' },
  { id: 2, title: 'Category', subtitle: 'Type of feedback' },
  { id: 3, title: 'Context', subtitle: 'Additional details' },
  { id: 4, title: 'Submit', subtitle: 'Get verdicts' }
];

const CATEGORIES = [
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Photos, outfits, style choices',
    icon: Camera,
    subcategories: ['Outfit', 'Hairstyle', 'Makeup', 'General Look']
  },
  {
    id: 'writing',
    title: 'Writing',
    description: 'Text, messages, content',
    icon: FileText,
    subcategories: ['Message', 'Email', 'Post', 'Creative Writing']
  },
  {
    id: 'decision',
    title: 'Decision',
    description: 'Choices, options, dilemmas',
    icon: Sparkles,
    subcategories: ['Life Choice', 'Purchase Decision', 'Career Move', 'Relationship']
  }
];

export function StreamlinedStart() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    targetVerdictCount: 10
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear related errors when data is updated
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(updates).forEach(key => {
        delete newErrors[key];
      });
      return newErrors;
    });
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.mediaType) {
          newErrors.mediaType = 'Please select content type';
        } else if (formData.mediaType === 'text' && !formData.content) {
          newErrors.content = 'Please enter text content';
        } else if (formData.mediaType === 'text' && formData.content && formData.content.length < 10) {
          newErrors.content = 'Text must be at least 10 characters';
        } else if (formData.mediaType === 'photo' && !formData.fileUrl) {
          newErrors.fileUrl = 'Please upload a photo';
        }
        break;
      case 2:
        if (!formData.category) {
          newErrors.category = 'Please select a category';
        }
        break;
      case 3:
        if (!formData.context || formData.context.length < 20) {
          newErrors.context = 'Please provide context (minimum 20 characters)';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setUploadProgress(0);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      updateFormData({ 
        fileUrl: result.url,
        mediaType: 'photo' 
      });
      
    } catch (error) {
      setErrors({ fileUrl: 'Upload failed. Please try again.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Submission failed');

      const result = await response.json();
      router.push(`/requests/${result.id}`);
    } catch (error) {
      setErrors({ submit: 'Failed to submit request. Please try again.' });
      setIsLoading(false);
    }
  };

  if (isLoading && uploadProgress > 0) {
    return <UploadingState progress={uploadProgress} />;
  }

  if (isLoading && currentStep === 4) {
    return <ProcessingState step={2} total={3} />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Get Your Verdict
        </h1>
        <p className="text-gray-600">
          Submit your content and get honest feedback from 10 qualified reviewers
        </p>
      </div>

      {/* Progress */}
      <FormProgress
        currentStep={currentStep}
        totalSteps={4}
        steps={STEPS}
        className="mb-8"
      />

      {/* Form Summary (shows on steps 2+) */}
      {currentStep > 1 && (
        <FormSummary
          data={formData}
          onEdit={setCurrentStep}
          className="mb-6"
        />
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Content Type & Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">What would you like feedback on?</h2>
                <p className="text-sm text-gray-600 mb-4">Choose the type of content you want reviewed</p>
              </div>

              {/* Content Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TouchButton
                  variant={formData.mediaType === 'photo' ? 'default' : 'outline'}
                  onClick={() => updateFormData({ mediaType: 'photo' })}
                  className="h-auto p-4 flex-col space-y-2"
                >
                  <Camera className="w-8 h-8" />
                  <div>
                    <div className="font-medium">Upload Photo</div>
                    <div className="text-xs opacity-75">Image, outfit, appearance</div>
                  </div>
                </TouchButton>

                <TouchButton
                  variant={formData.mediaType === 'text' ? 'default' : 'outline'}
                  onClick={() => updateFormData({ mediaType: 'text' })}
                  className="h-auto p-4 flex-col space-y-2"
                >
                  <FileText className="w-8 h-8" />
                  <div>
                    <div className="font-medium">Enter Text</div>
                    <div className="text-xs opacity-75">Message, writing, content</div>
                  </div>
                </TouchButton>
              </div>

              {errors.mediaType && (
                <p className="text-sm text-red-600">{errors.mediaType}</p>
              )}

              {/* File Upload */}
              {formData.mediaType === 'photo' && (
                <div>
                  <TouchFileInput
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  {errors.fileUrl && (
                    <p className="text-sm text-red-600 mt-2">{errors.fileUrl}</p>
                  )}
                  {formData.fileUrl && (
                    <div className="mt-4">
                      <img
                        src={formData.fileUrl}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Text Input */}
              {formData.mediaType === 'text' && (
                <div>
                  <Textarea
                    placeholder="Enter the text you'd like feedback on..."
                    value={formData.content || ''}
                    onChange={(e) => updateFormData({ content: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-between mt-2">
                    {errors.content && (
                      <p className="text-sm text-red-600">{errors.content}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">
                      {formData.content?.length || 0} characters (minimum 10)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Category Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">What type of feedback do you need?</h2>
                <p className="text-sm text-gray-600 mb-4">This helps us match you with the right reviewers</p>
              </div>

              <div className="space-y-3">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isSelected = formData.category === category.id;
                  
                  return (
                    <TouchButton
                      key={category.id}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => updateFormData({ category: category.id, subcategory: undefined })}
                      className="w-full h-auto p-4 justify-start text-left"
                    >
                      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{category.title}</div>
                        <div className="text-xs opacity-75">{category.description}</div>
                      </div>
                    </TouchButton>
                  );
                })}
              </div>

              {errors.category && (
                <p className="text-sm text-red-600">{errors.category}</p>
              )}

              {/* Subcategory Selection */}
              {formData.category && (
                <div>
                  <p className="text-sm font-medium mb-3">Specific type (optional):</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.find(c => c.id === formData.category)?.subcategories.map((sub) => (
                      <Badge
                        key={sub}
                        variant={formData.subcategory === sub ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-blue-100"
                        onClick={() => updateFormData({ 
                          subcategory: formData.subcategory === sub ? undefined : sub 
                        })}
                      >
                        {sub}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Context */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Provide context</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Help reviewers give you better feedback by explaining what you're looking for
                </p>
              </div>

              <Textarea
                placeholder="What specific feedback are you looking for? What's the context or situation? Any particular concerns or questions?"
                value={formData.context || ''}
                onChange={(e) => updateFormData({ context: e.target.value })}
                rows={5}
                className="resize-none"
              />
              
              <div className="flex justify-between">
                {errors.context && (
                  <p className="text-sm text-red-600">{errors.context}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.context?.length || 0} characters (minimum 20)
                </p>
              </div>

              {/* Review Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Ready to submit</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Get 10 verdicts in 2-4 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>100% anonymous feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Qualified reviewers only</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {errors.submit && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <TouchButton
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </TouchButton>

        <TouchButton
          onClick={handleNext}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {currentStep === 4 ? 'Submit Request' : 'Continue'}
          {currentStep < 4 && <ArrowRight className="w-4 h-4" />}
        </TouchButton>
      </div>
    </div>
  );
}