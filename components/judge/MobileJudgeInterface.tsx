'use client';

import { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Navigation } from 'swiper/modules';
import { ThumbsUp, ThumbsDown, Star, Send, MoreHorizontal, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';

interface JudgeRequest {
  id: string;
  type: 'verdict' | 'comparison' | 'split_test';
  media_type: string;
  media_url?: string;
  text_content?: string;
  context: string;
  category: string;
  // Split test specific
  split_test_data?: {
    photo_a_url: string;
    photo_b_url: string;
  };
  // Comparison specific
  comparison_data?: {
    option_a_title: string;
    option_b_title: string;
    option_a_image_url?: string;
    option_b_image_url?: string;
  };
}

interface MobileJudgeInterfaceProps {
  requests: JudgeRequest[];
  onSubmitVerdict: (requestId: string, verdict: any) => Promise<void>;
  onSkip: (requestId: string) => void;
  isLoading?: boolean;
}

export function MobileJudgeInterface({ 
  requests, 
  onSubmitVerdict, 
  onSkip, 
  isLoading = false 
}: MobileJudgeInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const swiperRef = useRef<any>(null);

  const currentRequest = requests[currentIndex];

  const handleQuickAction = async (action: 'approve' | 'reject' | 'skip') => {
    if (!currentRequest || isSubmitting) return;

    if (action === 'skip') {
      onSkip(currentRequest.id);
      goToNext();
      return;
    }

    // For quick actions, provide minimal verdict
    const quickVerdict = {
      rating: action === 'approve' ? 8 : 3,
      feedback: action === 'approve' ? 'Looks great!' : 'Needs improvement',
      verdict: action === 'approve' ? 'positive' : 'negative'
    };

    await submitVerdict(quickVerdict);
  };

  const handleDetailedReview = () => {
    setShowFeedbackForm(true);
  };

  const submitVerdict = async (verdictData: any) => {
    if (!currentRequest) return;

    setIsSubmitting(true);
    try {
      await onSubmitVerdict(currentRequest.id, verdictData);
      
      // Reset form
      setRating(0);
      setFeedback('');
      setSelectedChoice(null);
      setShowFeedbackForm(false);
      
      goToNext();
    } catch (error) {
      console.error('Failed to submit verdict:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailedSubmit = async () => {
    if (!currentRequest) return;

    let verdictData: any = {
      rating: rating || 5,
      feedback: feedback || 'No specific feedback provided'
    };

    // Handle different request types
    if (currentRequest.type === 'split_test') {
      verdictData = {
        ...verdictData,
        chosen_photo: selectedChoice || 'A'
      };
    } else if (currentRequest.type === 'comparison') {
      verdictData = {
        ...verdictData,
        chosen_option: selectedChoice || 'A',
        confidence_score: rating || 5
      };
    } else {
      // Standard verdict
      verdictData = {
        ...verdictData,
        verdict: rating >= 6 ? 'positive' : 'negative'
      };
    }

    await submitVerdict(verdictData);
  };

  const goToNext = () => {
    if (currentIndex < requests.length - 1) {
      setCurrentIndex(currentIndex + 1);
      swiperRef.current?.slideNext();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="text-center py-16 px-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
        <p className="text-gray-600 mb-6">No more requests to review right now.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium"
        >
          Refresh Queue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Judge Queue</h2>
            <p className="text-xs text-gray-500">
              {currentIndex + 1} of {requests.length}
            </p>
          </div>
          <div className="flex space-x-1">
            {requests.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-indigo-600' : 
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative h-[calc(100vh-120px)]">
        <Swiper
          effect="cards"
          grabCursor={true}
          modules={[EffectCards]}
          className="h-full"
          onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
          ref={swiperRef}
          allowTouchMove={!showFeedbackForm}
        >
          {requests.map((request, index) => (
            <SwiperSlide key={request.id}>
              <RequestCard 
                request={request}
                isActive={index === currentIndex}
                onQuickAction={handleQuickAction}
                onDetailedReview={handleDetailedReview}
                showFeedbackForm={showFeedbackForm}
                rating={rating}
                setRating={setRating}
                feedback={feedback}
                setFeedback={setFeedback}
                selectedChoice={selectedChoice}
                setSelectedChoice={setSelectedChoice}
                onSubmit={handleDetailedSubmit}
                onCancel={() => setShowFeedbackForm(false)}
                isSubmitting={isSubmitting}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

// Individual Request Card Component
function RequestCard({ 
  request, 
  isActive, 
  onQuickAction, 
  onDetailedReview,
  showFeedbackForm,
  rating,
  setRating,
  feedback,
  setFeedback,
  selectedChoice,
  setSelectedChoice,
  onSubmit,
  onCancel,
  isSubmitting
}: any) {
  
  const renderRequestContent = () => {
    if (request.type === 'split_test' && request.split_test_data) {
      return (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 text-center">Which photo is better?</h3>
          <div className="grid grid-cols-2 gap-3">
            {['A', 'B'].map((option) => (
              <button
                key={option}
                onClick={() => setSelectedChoice(option)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  selectedChoice === option 
                    ? 'border-indigo-600 shadow-lg scale-105' 
                    : 'border-gray-200'
                }`}
              >
                <img
                  src={option === 'A' ? request.split_test_data.photo_a_url : request.split_test_data.photo_b_url}
                  alt={`Option ${option}`}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  selectedChoice === option ? 'bg-indigo-600' : 'bg-gray-400'
                }`}>
                  {option}
                </div>
              </button>
            ))}
          </div>
          <p className="text-gray-600 text-sm text-center">{request.context}</p>
        </div>
      );
    }

    if (request.type === 'comparison' && request.comparison_data) {
      return (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 text-center">Which option is better?</h3>
          <div className="space-y-3">
            {['A', 'B'].map((option) => (
              <button
                key={option}
                onClick={() => setSelectedChoice(option)}
                className={`w-full p-4 border-2 rounded-xl transition-all text-left ${
                  selectedChoice === option 
                    ? 'border-indigo-600 bg-indigo-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    selectedChoice === option ? 'bg-indigo-600' : 'bg-gray-400'
                  }`}>
                    {option}
                  </div>
                  <div>
                    <p className="font-medium">
                      {option === 'A' ? request.comparison_data.option_a_title : request.comparison_data.option_b_title}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-gray-600 text-sm text-center">{request.context}</p>
        </div>
      );
    }

    // Standard verdict request
    return (
      <div className="space-y-4">
        <div className="text-center">
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium mb-3">
            {request.category.replace('_', ' ')}
          </span>
          <h3 className="font-medium text-gray-900 mb-2">{request.context}</h3>
        </div>
        
        {request.media_type === 'photo' && request.media_url && (
          <div className="aspect-square rounded-xl overflow-hidden">
            <img 
              src={request.media_url} 
              alt="Content to review"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {request.text_content && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-700">{request.text_content}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Content */}
        <div className="flex-1 p-6">
          {renderRequestContent()}
        </div>

        {/* Feedback Form */}
        <AnimatePresence>
          {showFeedbackForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 bg-gray-50 p-4 space-y-4"
            >
              {/* Rating */}
              {(request.type === 'verdict' || request.type === 'comparison') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (1-10)
                  </label>
                  <div className="flex space-x-2">
                    {[...Array(10)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setRating(i + 1)}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                          rating >= i + 1
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  disabled={isSubmitting || (request.type === 'split_test' && !selectedChoice) || (request.type === 'comparison' && !selectedChoice)}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        {!showFeedbackForm && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            {/* Quick action buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => onQuickAction('reject')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-colors"
              >
                <ThumbsDown className="h-4 w-4" />
                No
              </button>
              <button
                onClick={() => onQuickAction('approve')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition-colors"
              >
                <ThumbsUp className="h-4 w-4" />
                Yes
              </button>
            </div>

            {/* Detailed review option */}
            <div className="flex space-x-2">
              <button
                onClick={onDetailedReview}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Star className="h-4 w-4" />
                Detailed Review
              </button>
              <button
                onClick={() => onQuickAction('skip')}
                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}