'use client';

import { useState, useEffect } from 'react';

interface RoastData {
  id: string;
  question: string;
  category: string;
  avgRating: number;
  totalRoasts: number;
  roasts: Array<{
    feedback: string;
    rating: number;
  }>;
}

export function useViralSharing() {
  const [shouldShowViralPopup, setShouldShowViralPopup] = useState(false);
  const [currentRoastData, setCurrentRoastData] = useState<RoastData | null>(null);

  // Check if user should be prompted to share
  const triggerViralShare = (roastData: RoastData) => {
    // Don't show popup if user has already shared recently
    const lastSharedKey = `last_shared_${roastData.id}`;
    const lastShared = localStorage.getItem(lastSharedKey);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    if (lastShared && parseInt(lastShared) > oneHourAgo) {
      return; // Don't spam the user
    }

    // Show popup for engaging roast results
    const isHighEngagement = roastData.avgRating < 6 || roastData.totalRoasts >= 3;
    const hasGoodContent = roastData.roasts.some(r => r.feedback.length > 50);
    
    if (isHighEngagement && hasGoodContent) {
      setCurrentRoastData(roastData);
      setShouldShowViralPopup(true);
    }
  };

  // Generate shareable content
  const generateShareContent = (roastData: RoastData): string => {
    const { question, category, avgRating, roasts } = roastData;
    
    // Create engaging share text
    const shareTemplate = `I asked strangers to roast my ${category} and got DESTROYED 🔥

Question: "${question}"

The verdicts:
${roasts.slice(0, 3).map((r, i) => `${i + 1}. "${r.feedback.slice(0, 100)}${r.feedback.length > 100 ? '...' : ''}" - ${r.rating}/10`).join('\n')}

Average brutality: ${avgRating.toFixed(1)}/10 💀

Try it yourself at askverdict.com 👀

#roasted #honestfeedback #verdict #brutal`;

    return shareTemplate;
  };

  // Track share completion
  const markAsShared = (roastId: string, platform: string) => {
    const lastSharedKey = `last_shared_${roastId}`;
    localStorage.setItem(lastSharedKey, Date.now().toString());
    
    // Track sharing analytics (could send to analytics service)
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('roast_shared', {
        detail: { roastId, platform, timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    }
  };

  // Auto-prompt logic for completed roasts
  useEffect(() => {
    // Listen for roast completion events
    const handleRoastCompleted = (event: any) => {
      const roastData = event.detail as RoastData;
      
      // Wait a bit before showing popup (let user see results first)
      setTimeout(() => {
        triggerViralShare(roastData);
      }, 3000);
    };

    window.addEventListener('roast_completed', handleRoastCompleted);
    return () => window.removeEventListener('roast_completed', handleRoastCompleted);
  }, []);

  return {
    shouldShowViralPopup,
    setShouldShowViralPopup,
    currentRoastData,
    generateShareContent,
    triggerViralShare,
    markAsShared
  };
}