'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  Camera, 
  Type, 
  Mic,
  Upload,
  Eye,
  X,
  Plus,
  Check,
  ArrowRight
} from 'lucide-react';

interface MobileCreateOptimizationsProps {
  formData: any;
  updateFormData: (updates: any) => void;
  currentStep: number;
  onFileUpload: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  canContinue: () => boolean;
  onNext: () => void;
  onBack: () => void;
}

export function MobileCreateOptimizations({
  formData,
  updateFormData,
  currentStep,
  onFileUpload,
  onRemoveFile,
  canContinue,
  onNext,
  onBack
}: MobileCreateOptimizationsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Keyboard detection for mobile
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setShowKeyboard(heightDiff > 150);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  if (!isMobile) {
    return null; // Only show optimizations on mobile
  }

  return (
    <div className="lg:hidden"> {/* Only show on mobile */}
      
      {/* Mobile-Optimized Media Type Selector */}
      {currentStep === 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'photo', icon: Camera, label: 'Photo', color: 'green' },
              { id: 'text', icon: Type, label: 'Text', color: 'blue' },
              { id: 'audio', icon: Mic, label: 'Audio', color: 'purple' }
            ].map(({ id, icon: Icon, label, color }) => (
              <button
                key={id}
                onClick={() => updateFormData({ mediaType: id })}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  formData.mediaType === id
                    ? `border-${color}-300 bg-${color}-50`
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-${color}-100 flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 text-${color}-600`} />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile File Upload */}
      {currentStep === 0 && formData.mediaType !== 'text' && (
        <div className="mb-6">
          <input
            type="file"
            multiple={formData.requestType === 'verdict'}
            accept={formData.mediaType === 'photo' ? 'image/*' : 'audio/*'}
            onChange={(e) => onFileUpload(e.target.files)}
            className="hidden"
            id="mobile-file-upload"
          />
          <label 
            htmlFor="mobile-file-upload" 
            className="block w-full p-6 border-2 border-dashed border-gray-300 rounded-xl text-center bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-600 font-medium">
              Tap to {formData.mediaType === 'photo' ? 'take photo or choose from gallery' : 'record or choose audio'}
            </span>
          </label>

          {/* Mobile File Preview */}
          {formData.mediaFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {formData.mediaFiles.map((file: File, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="ml-2 p-1 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Text Input with Character Count */}
      {currentStep === 0 && formData.mediaType === 'text' && (
        <div className="mb-6">
          <div className="relative">
            <textarea
              value={formData.textContent}
              onChange={(e) => updateFormData({ textContent: e.target.value })}
              placeholder="Type or paste your content here..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
              maxLength={5000}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {formData.textContent.length}/5000
            </div>
          </div>
        </div>
      )}

      {/* Mobile Context Input with Expandable Area */}
      {currentStep === 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What do you want to know?
          </label>
          <div className="relative">
            <textarea
              value={formData.context}
              onChange={(e) => updateFormData({ context: e.target.value })}
              placeholder="Be specific about what feedback you want..."
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base transition-all ${
                showKeyboard ? 'h-20' : 'h-24'
              }`}
              rows={showKeyboard ? 3 : 4}
            />
            {formData.context.length > 0 && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-green-500" />
              </div>
            )}
          </div>
          
          {/* Helpful hints for mobile */}
          <div className="mt-2 text-xs text-gray-500">
            💡 Tip: Mention what you'll use this for (work, dating, etc.)
          </div>
        </div>
      )}

      {/* Mobile Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>Step {currentStep + 1} of 4</span>
          <span>{Math.round(((currentStep + 1) / 4) * 100)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Sticky Mobile Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30 ${
        showKeyboard ? 'hidden' : 'block'
      }`}>
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Back
          </button>

          <div className="flex-1 mx-4">
            <button
              onClick={onNext}
              disabled={!canContinue()}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                canContinue()
                  ? 'bg-blue-600 text-white shadow-lg active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentStep === 3 ? 'Submit Request' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-Specific Spacing for Fixed Navigation */}
      <div className="h-20" /> {/* Spacer for fixed navigation */}

      {/* Mobile Quick Actions */}
      {currentStep === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 text-sm mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateFormData({ 
                  context: formData.context + (formData.context ? ' ' : '') + 'Is this good for dating apps?' 
                })}
                className="p-2 bg-white rounded-lg border text-xs text-gray-700 active:bg-gray-50"
              >
                + Dating question
              </button>
              <button 
                onClick={() => updateFormData({ 
                  context: formData.context + (formData.context ? ' ' : '') + 'Does this look professional?' 
                })}
                className="p-2 bg-white rounded-lg border text-xs text-gray-700 active:bg-gray-50"
              >
                + Work question
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}