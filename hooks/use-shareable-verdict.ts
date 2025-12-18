import { useState } from 'react';

interface VerdictData {
  id: string;
  question: string;
  category: string;
  averageRating?: number;
  feedbackCount: number;
  highlights: string[];
  submittedAt: string;
  isPrivate?: boolean;
}

export function useShareableVerdict() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareableVerdict, setShareableVerdict] = useState<VerdictData | null>(null);

  const openShareModal = (verdict: VerdictData) => {
    if (verdict.isPrivate) {
      // Show warning for private verdicts
      const shouldShare = window.confirm(
        'This is a private verdict. Sharing it publicly will make your question visible to others. Continue?'
      );
      if (!shouldShare) return;
    }

    setShareableVerdict(verdict);
    setIsShareModalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setShareableVerdict(null);
  };

  const generateShareableData = (
    id: string,
    question: string,
    category: string,
    feedbacks: any[],
    isPrivate: boolean = false
  ): VerdictData => {
    // Calculate average rating from feedbacks
    const ratings = feedbacks
      .map(f => f.rating)
      .filter(rating => rating !== null && rating !== undefined);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : undefined;

    // Extract key highlights from feedback
    const highlights: string[] = [];
    feedbacks.forEach(feedback => {
      if (feedback.strengths && feedback.strengths.length > 0) {
        highlights.push(feedback.strengths[0]);
      }
      if (feedback.improvements && feedback.improvements.length > 0 && highlights.length < 3) {
        highlights.push(feedback.improvements[0]);
      }
    });

    return {
      id,
      question,
      category,
      averageRating,
      feedbackCount: feedbacks.length,
      highlights: highlights.slice(0, 3), // Limit to 3 highlights
      submittedAt: new Date().toISOString(),
      isPrivate
    };
  };

  return {
    isShareModalOpen,
    shareableVerdict,
    openShareModal,
    closeShareModal,
    generateShareableData
  };
}