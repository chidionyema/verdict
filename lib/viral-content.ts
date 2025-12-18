export interface ShareableContent {
  question: string;
  category: string;
  avgRating?: number;
  totalResponses: number;
  isRoastMode: boolean;
  highlights?: string[];
}

export function generateViralShareText(content: ShareableContent): string {
  const { question, category, avgRating, totalResponses, isRoastMode, highlights } = content;
  
  if (isRoastMode) {
    return `I asked strangers to roast my ${category} and got DESTROYED 🔥

"${question}"

${highlights?.slice(0, 2).map((h, i) => `${i + 1}. ${h}`).join('\n') || ''}

Average brutality: ${avgRating?.toFixed(1) || 'TBD'}/10 💀
${totalResponses} savage responses

Try it yourself at askverdict.com 👀

#roasted #honestfeedback #brutal #verdict`;
  }
  
  return `I asked strangers for honest feedback on my ${category} 💭

"${question}"

${highlights?.slice(0, 2).map((h, i) => `${i + 1}. ${h}`).join('\n') || ''}

${avgRating ? `Average rating: ${avgRating.toFixed(1)}/10` : ''}
${totalResponses} honest responses

Get your own feedback at askverdict.com ✨

#feedback #honestopinions #askverdict`;
}

export function getShareUrls(shareText: string) {
  const encodedText = encodeURIComponent(shareText);
  
  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=askverdict.com&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=askverdict.com&summary=${encodedText}`,
    reddit: `https://reddit.com/submit?url=askverdict.com&title=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}`,
    telegram: `https://t.me/share/url?url=askverdict.com&text=${encodedText}`
  };
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}

export function trackViralShare(platform: string, isRoastMode: boolean, contentId?: string) {
  // Track viral sharing events for analytics
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('viral_share', {
      detail: {
        platform,
        isRoastMode,
        contentId,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }
}

// Determine if content has viral potential
export function assessViralPotential(content: ShareableContent): 'HIGH' | 'MEDIUM' | 'LOW' {
  const { isRoastMode, avgRating, totalResponses, highlights } = content;
  
  let score = 0;
  
  // Roast mode is inherently more viral
  if (isRoastMode) score += 3;
  
  // Low ratings (brutal feedback) are more engaging
  if (avgRating && avgRating < 5) score += 2;
  else if (avgRating && avgRating < 7) score += 1;
  
  // More responses = more content to share
  if (totalResponses >= 5) score += 2;
  else if (totalResponses >= 3) score += 1;
  
  // Quality highlights make content more shareable
  if (highlights && highlights.some(h => h.length > 30)) score += 1;
  
  if (score >= 5) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
}