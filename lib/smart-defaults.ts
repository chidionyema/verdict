// Smart Defaults and Progress Saving for Better UX

interface FormProgress {
  step: number;
  mediaType: 'photo' | 'text' | null;
  question: string;
  file?: File;
  timestamp: number;
}

export class ProgressManager {
  private static STORAGE_KEY = 'verdict_form_progress';
  private static EXPIRY_HOURS = 24;

  static saveProgress(progress: Omit<FormProgress, 'timestamp'>) {
    if (typeof window === 'undefined') return;
    
    const progressWithTimestamp = {
      ...progress,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(
        this.STORAGE_KEY, 
        JSON.stringify(progressWithTimestamp)
      );
    } catch (error) {
      console.warn('Failed to save form progress:', error);
    }
  }

  static getProgress(): FormProgress | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const progress: FormProgress = JSON.parse(stored);
      
      // Check if progress is expired (24 hours)
      const isExpired = Date.now() - progress.timestamp > this.EXPIRY_HOURS * 60 * 60 * 1000;
      if (isExpired) {
        this.clearProgress();
        return null;
      }

      return progress;
    } catch (error) {
      console.warn('Failed to retrieve form progress:', error);
      this.clearProgress();
      return null;
    }
  }

  static clearProgress() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static hasProgress(): boolean {
    return this.getProgress() !== null;
  }
}

// Smart category detection based on content
export class CategoryDetector {
  private static CATEGORY_KEYWORDS = {
    appearance: [
      'outfit', 'photo', 'picture', 'look', 'dress', 'style', 'hair', 'makeup',
      'dating profile', 'tinder', 'bumble', 'hinge', 'fashion', 'clothing',
      'professional look', 'interview attire', 'headshot', 'linkedin photo'
    ],
    
    career: [
      'job', 'career', 'resume', 'cv', 'linkedin', 'interview', 'promotion',
      'salary', 'offer', 'workplace', 'boss', 'colleague', 'work', 'professional',
      'meeting', 'presentation', 'networking', 'cover letter', 'application'
    ],
    
    communication: [
      'email', 'message', 'text', 'letter', 'writing', 'response', 'reply',
      'conversation', 'chat', 'communication', 'tone', 'wording', 'phrasing',
      'aggressive', 'polite', 'formal', 'casual', 'awkward', 'clear'
    ],
    
    relationships: [
      'dating', 'relationship', 'partner', 'girlfriend', 'boyfriend', 'marriage',
      'friends', 'family', 'breakup', 'romantic', 'love', 'attraction',
      'chemistry', 'compatibility', 'conflict', 'argument', 'date'
    ],
    
    decisions: [
      'should i', 'what should', 'help me decide', 'choice', 'decision', 'option',
      'pick', 'choose', 'select', 'better', 'best', 'worth it', 'advice',
      'opinion', 'thoughts on', 'what do you think', 'recommendation'
    ],

    business: [
      'business', 'startup', 'company', 'pitch', 'investor', 'funding',
      'marketing', 'strategy', 'product', 'service', 'pricing', 'customer',
      'client', 'proposal', 'contract', 'negotiation', 'partnership'
    ]
  };

  static detectCategory(text: string): string {
    if (!text || text.length < 10) return 'general';
    
    const lowerText = text.toLowerCase();
    const scores: Record<string, number> = {};

    // Initialize scores
    Object.keys(this.CATEGORY_KEYWORDS).forEach(category => {
      scores[category] = 0;
    });

    // Score each category based on keyword matches
    Object.entries(this.CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          scores[category] += keyword.length; // Longer keywords get higher weight
        }
      });
    });

    // Find category with highest score
    const bestCategory = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)[0];

    return bestCategory ? bestCategory[0] : 'general';
  }

  static suggestTitle(text: string, maxLength = 50): string {
    if (!text || text.length < 10) return 'My Request';
    
    // Remove common question prefixes
    let cleanText = text
      .replace(/^(should i|what should|help me|can you|do you think)/i, '')
      .trim();

    // Take first sentence or clause
    const firstSentence = cleanText.split(/[.!?]/)[0];
    const firstClause = firstSentence.split(/[,;]/)[0];
    
    let title = firstClause.trim();
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    // Truncate if too long
    if (title.length > maxLength) {
      title = title.substring(0, maxLength - 3) + '...';
    }
    
    return title || 'My Request';
  }
}

// Smart subcategory detection
export class SubcategoryDetector {
  private static SUBCATEGORY_KEYWORDS = {
    // Appearance subcategories
    'dating-photo': ['dating', 'tinder', 'bumble', 'hinge', 'profile photo', 'attractive'],
    'interview-outfit': ['interview', 'job', 'professional', 'formal', 'business'],
    'casual-style': ['casual', 'everyday', 'weekend', 'going out'],
    'formal-event': ['formal', 'wedding', 'gala', 'party', 'event', 'ceremony'],
    
    // Career subcategories
    'resume-review': ['resume', 'cv', 'experience', 'skills', 'education'],
    'job-decision': ['job offer', 'position', 'role', 'opportunity', 'career move'],
    'workplace-issue': ['boss', 'colleague', 'workplace', 'conflict', 'politics'],
    'interview-prep': ['interview', 'questions', 'answers', 'preparation'],
    
    // Communication subcategories
    'email-tone': ['email', 'message', 'tone', 'aggressive', 'professional'],
    'text-message': ['text', 'message', 'chat', 'response', 'reply'],
    'formal-letter': ['letter', 'formal', 'application', 'proposal'],
    'casual-conversation': ['casual', 'chat', 'conversation', 'talk'],
    
    // Relationship subcategories
    'dating-advice': ['dating', 'date', 'romantic', 'attraction', 'chemistry'],
    'relationship-issue': ['relationship', 'partner', 'conflict', 'argument'],
    'breakup-help': ['breakup', 'break up', 'end relationship', 'split'],
    'family-matter': ['family', 'parents', 'siblings', 'relatives'],
    
    // Decision subcategories
    'major-decision': ['major', 'important', 'life-changing', 'big decision'],
    'purchase-decision': ['buy', 'purchase', 'worth it', 'expensive', 'investment'],
    'lifestyle-choice': ['lifestyle', 'habit', 'routine', 'change', 'improve'],
    'quick-decision': ['quick', 'simple', 'easy', 'straightforward']
  };

  static detectSubcategory(text: string, category: string): string {
    if (!text || text.length < 10) return 'general';
    
    const lowerText = text.toLowerCase();
    const scores: Record<string, number> = {};

    // Only consider subcategories relevant to the detected category
    const relevantSubcategories = Object.keys(this.SUBCATEGORY_KEYWORDS).filter(sub => {
      const prefix = sub.split('-')[0];
      return category.includes(prefix) || prefix === 'general';
    });

    // Initialize scores
    relevantSubcategories.forEach(subcategory => {
      scores[subcategory] = 0;
    });

    // Score subcategories based on keyword matches
    Object.entries(this.SUBCATEGORY_KEYWORDS).forEach(([subcategory, keywords]) => {
      if (!relevantSubcategories.includes(subcategory)) return;
      
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          scores[subcategory] += keyword.length;
        }
      });
    });

    // Find subcategory with highest score
    const bestSubcategory = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)[0];

    return bestSubcategory ? bestSubcategory[0] : 'general';
  }
}

// Smart tier recommendation based on content complexity
export class TierRecommendation {
  static recommendTier(text: string, hasImage: boolean): 'community' | 'standard' | 'pro' {
    if (!text || text.length < 20) return 'community';

    let complexity = 0;
    const lowerText = text.toLowerCase();

    // Length-based complexity
    if (text.length > 200) complexity += 2;
    else if (text.length > 100) complexity += 1;

    // Complex decision indicators
    const complexKeywords = [
      'important', 'crucial', 'major', 'life-changing', 'significant',
      'expensive', 'investment', 'career', 'relationship', 'future',
      'difficult', 'complicated', 'complex', 'detailed', 'thorough'
    ];

    complexKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) complexity += 1;
    });

    // Image adds complexity
    if (hasImage) complexity += 1;

    // Multiple questions/aspects
    const questionMarkers = (text.match(/[?]/g) || []).length;
    if (questionMarkers > 1) complexity += 1;

    // Determine tier based on complexity score
    if (complexity >= 5) return 'pro';
    if (complexity >= 3) return 'standard';
    return 'community';
  }

  static getRecommendationReason(tier: 'community' | 'standard' | 'pro'): string {
    switch (tier) {
      case 'pro':
        return 'Recommended for complex or important decisions';
      case 'standard':
        return 'Good balance of feedback and value';
      case 'community':
        return 'Perfect for quick feedback';
    }
  }
}

// Auto-save functionality for forms
export class AutoSaver {
  private static saveTimeouts: Record<string, NodeJS.Timeout> = {};
  private static SAVE_DELAY = 1000; // 1 second delay

  static scheduleAutoSave(
    key: string, 
    data: any, 
    onSave?: (data: any) => void
  ) {
    // Clear existing timeout
    if (this.saveTimeouts[key]) {
      clearTimeout(this.saveTimeouts[key]);
    }

    // Schedule new save
    this.saveTimeouts[key] = setTimeout(() => {
      try {
        if (onSave) {
          onSave(data);
        } else {
          // Default: save to localStorage
          localStorage.setItem(`autosave_${key}`, JSON.stringify(data));
        }
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, this.SAVE_DELAY);
  }

  static getAutoSaved(key: string): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to retrieve auto-saved data:', error);
      return null;
    }
  }

  static clearAutoSaved(key: string) {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(`autosave_${key}`);
    
    if (this.saveTimeouts[key]) {
      clearTimeout(this.saveTimeouts[key]);
      delete this.saveTimeouts[key];
    }
  }
}

// Export all utilities as a single smart defaults manager
export class SmartDefaults {
  static progress = ProgressManager;
  static category = CategoryDetector;
  static subcategory = SubcategoryDetector;
  static tier = TierRecommendation;
  static autoSave = AutoSaver;
  
  // Generate smart defaults for a new request
  static generateDefaults(text: string, hasImage: boolean = false) {
    const category = this.category.detectCategory(text);
    const subcategory = this.subcategory.detectSubcategory(text, category);
    const title = this.category.suggestTitle(text);
    const tier = this.tier.recommendTier(text, hasImage);
    
    return {
      category,
      subcategory,
      title,
      tier,
      tierReason: this.tier.getRecommendationReason(tier)
    };
  }
}