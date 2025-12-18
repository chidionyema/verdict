'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UserBehaviorData {
  preferences: {
    preferredCategories: string[];
    averageSessionTime: number;
    preferredFeedbackTone: 'honest' | 'constructive' | 'encouraging';
    deviceType: 'mobile' | 'desktop';
    timeOfDayUsage: { [hour: number]: number };
    featureUsage: { [feature: string]: number };
  };
  patterns: {
    dropOffPoints: string[];
    mostUsedFeatures: string[];
    skipFrequency: { [step: string]: number };
    errorRecoverySuccess: number;
  };
  expertise: {
    level: 'novice' | 'intermediate' | 'expert';
    confidenceScore: number;
    specializations: string[];
    consistencyRating: number;
  };
}

interface AdaptiveUIContextType {
  userData: UserBehaviorData | null;
  trackEvent: (event: string, data?: any) => void;
  getAdaptations: () => UIAdaptations;
  updatePreference: (key: string, value: any) => void;
}

interface UIAdaptations {
  navigation: {
    showAdvancedFeatures: boolean;
    defaultView: 'simple' | 'detailed';
    suggestedActions: Array<{ label: string; action: string; priority: number }>;
  };
  forms: {
    showTooltips: boolean;
    defaultValues: { [field: string]: any };
    skipOptionalFields: boolean;
    validationLevel: 'basic' | 'strict';
  };
  content: {
    detailLevel: 'minimal' | 'standard' | 'comprehensive';
    showExamples: boolean;
    personalizedSuggestions: string[];
  };
  layout: {
    density: 'compact' | 'comfortable' | 'spacious';
    sidebarCollapsed: boolean;
    prioritizedSections: string[];
  };
}

const AdaptiveUIContext = createContext<AdaptiveUIContextType | null>(null);

const DEFAULT_USER_DATA: UserBehaviorData = {
  preferences: {
    preferredCategories: [],
    averageSessionTime: 0,
    preferredFeedbackTone: 'constructive',
    deviceType: 'desktop',
    timeOfDayUsage: {},
    featureUsage: {}
  },
  patterns: {
    dropOffPoints: [],
    mostUsedFeatures: [],
    skipFrequency: {},
    errorRecoverySuccess: 0
  },
  expertise: {
    level: 'novice',
    confidenceScore: 0,
    specializations: [],
    consistencyRating: 0
  }
};

export function AdaptiveUIProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserBehaviorData | null>(null);
  const [sessionStart] = useState(Date.now());

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Save session data on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSessionData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveSessionData();
    };
  }, [userData]);

  const loadUserData = () => {
    try {
      const stored = localStorage.getItem('verdict_user_behavior');
      if (stored) {
        setUserData(JSON.parse(stored));
      } else {
        setUserData(DEFAULT_USER_DATA);
      }
    } catch (error) {
      console.error('Failed to load user behavior data:', error);
      setUserData(DEFAULT_USER_DATA);
    }
  };

  const saveUserData = (data: UserBehaviorData) => {
    try {
      localStorage.setItem('verdict_user_behavior', JSON.stringify(data));
      setUserData(data);
    } catch (error) {
      console.error('Failed to save user behavior data:', error);
    }
  };

  const saveSessionData = () => {
    if (!userData) return;

    const sessionDuration = Date.now() - sessionStart;
    const currentHour = new Date().getHours();
    
    const updatedData: UserBehaviorData = {
      ...userData,
      preferences: {
        ...userData.preferences,
        averageSessionTime: (userData.preferences.averageSessionTime + sessionDuration) / 2,
        timeOfDayUsage: {
          ...userData.preferences.timeOfDayUsage,
          [currentHour]: (userData.preferences.timeOfDayUsage[currentHour] || 0) + 1
        }
      }
    };

    saveUserData(updatedData);
  };

  const trackEvent = useCallback((event: string, data?: any) => {
    if (!userData) return;

    const updatedData = { ...userData };

    switch (event) {
      case 'feature_used':
        updatedData.preferences.featureUsage[data.feature] = 
          (updatedData.preferences.featureUsage[data.feature] || 0) + 1;
        
        // Update most used features
        const sortedFeatures = Object.entries(updatedData.preferences.featureUsage)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([feature]) => feature);
        updatedData.patterns.mostUsedFeatures = sortedFeatures;
        break;

      case 'category_selected':
        if (!updatedData.preferences.preferredCategories.includes(data.category)) {
          updatedData.preferences.preferredCategories.unshift(data.category);
          updatedData.preferences.preferredCategories = 
            updatedData.preferences.preferredCategories.slice(0, 5);
        }
        break;

      case 'form_abandoned':
        if (!updatedData.patterns.dropOffPoints.includes(data.step)) {
          updatedData.patterns.dropOffPoints.push(data.step);
        }
        break;

      case 'step_skipped':
        updatedData.patterns.skipFrequency[data.step] = 
          (updatedData.patterns.skipFrequency[data.step] || 0) + 1;
        break;

      case 'judgment_accuracy':
        // Update expertise based on accuracy
        const accuracy = data.accuracy;
        updatedData.expertise.confidenceScore = 
          (updatedData.expertise.confidenceScore + accuracy) / 2;
        
        if (updatedData.expertise.confidenceScore > 0.8) {
          updatedData.expertise.level = 'expert';
        } else if (updatedData.expertise.confidenceScore > 0.6) {
          updatedData.expertise.level = 'intermediate';
        }
        break;

      case 'error_recovered':
        updatedData.patterns.errorRecoverySuccess += 1;
        break;
    }

    // Detect device type
    if (typeof window !== 'undefined') {
      updatedData.preferences.deviceType = 
        /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    }

    saveUserData(updatedData);
  }, [userData]);

  const updatePreference = useCallback((key: string, value: any) => {
    if (!userData) return;

    const keys = key.split('.');
    const updatedData = { ...userData };
    
    // Navigate to nested property
    let current: any = updatedData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    saveUserData(updatedData);
  }, [userData]);

  const getAdaptations = useCallback((): UIAdaptations => {
    if (!userData) return getDefaultAdaptations();

    const expertiseLevel = userData.expertise.level;
    const deviceType = userData.preferences.deviceType;
    const mostUsedFeatures = userData.patterns.mostUsedFeatures;
    const dropOffPoints = userData.patterns.dropOffPoints;

    return {
      navigation: {
        showAdvancedFeatures: expertiseLevel !== 'novice',
        defaultView: expertiseLevel === 'expert' ? 'detailed' : 'simple',
        suggestedActions: getSuggestedActions(userData)
      },
      forms: {
        showTooltips: expertiseLevel === 'novice' || dropOffPoints.length > 2,
        defaultValues: getSmartDefaults(userData),
        skipOptionalFields: expertiseLevel === 'expert',
        validationLevel: dropOffPoints.length > 3 ? 'strict' : 'basic'
      },
      content: {
        detailLevel: expertiseLevel === 'expert' ? 'comprehensive' : 'standard',
        showExamples: expertiseLevel === 'novice',
        personalizedSuggestions: getPersonalizedSuggestions(userData)
      },
      layout: {
        density: deviceType === 'mobile' ? 'compact' : 'comfortable',
        sidebarCollapsed: deviceType === 'mobile',
        prioritizedSections: getPrioritizedSections(userData)
      }
    };
  }, [userData]);

  return (
    <AdaptiveUIContext.Provider value={{
      userData,
      trackEvent,
      getAdaptations,
      updatePreference
    }}>
      {children}
    </AdaptiveUIContext.Provider>
  );
}

export function useAdaptiveUI() {
  const context = useContext(AdaptiveUIContext);
  if (!context) {
    throw new Error('useAdaptiveUI must be used within AdaptiveUIProvider');
  }
  return context;
}

// Helper functions
function getDefaultAdaptations(): UIAdaptations {
  return {
    navigation: {
      showAdvancedFeatures: false,
      defaultView: 'simple',
      suggestedActions: []
    },
    forms: {
      showTooltips: true,
      defaultValues: {},
      skipOptionalFields: false,
      validationLevel: 'basic'
    },
    content: {
      detailLevel: 'standard',
      showExamples: true,
      personalizedSuggestions: []
    },
    layout: {
      density: 'comfortable',
      sidebarCollapsed: false,
      prioritizedSections: []
    }
  };
}

function getSuggestedActions(userData: UserBehaviorData) {
  const suggestions = [];
  
  // Based on preferred categories
  if (userData.preferences.preferredCategories.includes('dating')) {
    suggestions.push({
      label: 'Review dating photos',
      action: '/judge?category=dating',
      priority: 3
    });
  }

  // Based on time of day
  const currentHour = new Date().getHours();
  if (currentHour >= 9 && currentHour <= 17) {
    suggestions.push({
      label: 'Professional photo review',
      action: '/judge?category=professional',
      priority: 2
    });
  }

  return suggestions.sort((a, b) => b.priority - a.priority);
}

function getSmartDefaults(userData: UserBehaviorData) {
  const defaults: any = {};
  
  if (userData.preferences.preferredCategories.length > 0) {
    defaults.category = userData.preferences.preferredCategories[0];
  }
  
  if (userData.preferences.preferredFeedbackTone) {
    defaults.tone = userData.preferences.preferredFeedbackTone;
  }

  return defaults;
}

function getPersonalizedSuggestions(userData: UserBehaviorData): string[] {
  const suggestions = [];

  if (userData.expertise.level === 'expert') {
    suggestions.push('Try reviewing complex career decisions');
    suggestions.push('Mentor new users in your specializations');
  } else if (userData.expertise.level === 'novice') {
    suggestions.push('Start with simple photo reviews');
    suggestions.push('Read the feedback guide for better reviews');
  }

  return suggestions;
}

function getPrioritizedSections(userData: UserBehaviorData): string[] {
  const sections = [];

  // Prioritize based on most used features
  if (userData.patterns.mostUsedFeatures.includes('judge')) {
    sections.push('judge-queue');
  }
  
  if (userData.patterns.mostUsedFeatures.includes('submit')) {
    sections.push('my-requests');
  }

  return sections;
}

// Component for adaptive form fields
export function AdaptiveFormField({
  field,
  children,
  className = ''
}: {
  field: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { getAdaptations, trackEvent } = useAdaptiveUI();
  const adaptations = getAdaptations();

  useEffect(() => {
    trackEvent('field_focused', { field });
  }, [field, trackEvent]);

  // Skip optional fields for experts
  if (adaptations.forms.skipOptionalFields && field.includes('optional')) {
    return null;
  }

  return (
    <div className={`adaptive-form-field ${className}`}>
      {children}
      
      {/* Enhanced validation for users who struggle */}
      {adaptations.forms.validationLevel === 'strict' && (
        <div className="mt-1 text-xs text-gray-500">
          This field is required for best results
        </div>
      )}
    </div>
  );
}

// Adaptive navigation component
export function AdaptiveNavigation({ children }: { children: React.ReactNode }) {
  const { getAdaptations } = useAdaptiveUI();
  const adaptations = getAdaptations();

  return (
    <nav className={`adaptive-nav ${
      adaptations.layout.density === 'compact' ? 'nav-compact' :
      adaptations.layout.density === 'spacious' ? 'nav-spacious' : 'nav-comfortable'
    }`}>
      {children}
      
      {/* Show suggested actions for experienced users */}
      {adaptations.navigation.suggestedActions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 mb-2">Quick Actions</h3>
          {adaptations.navigation.suggestedActions.slice(0, 3).map((action, i) => (
            <button
              key={i}
              onClick={() => window.location.href = action.action}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// Adaptive content component
export function AdaptiveContent({
  content,
  examples,
  details,
  className = ''
}: {
  content: React.ReactNode;
  examples?: React.ReactNode;
  details?: React.ReactNode;
  className?: string;
}) {
  const { getAdaptations } = useAdaptiveUI();
  const adaptations = getAdaptations();

  return (
    <div className={`adaptive-content ${className}`}>
      {content}
      
      {adaptations.content.showExamples && examples}
      
      {adaptations.content.detailLevel === 'comprehensive' && details}
    </div>
  );
}

// Styles for adaptive layouts
export function AdaptiveUIStyles() {
  return (
    <style jsx global>{`
      .nav-compact {
        padding: 0.5rem;
        font-size: 0.875rem;
      }
      
      .nav-comfortable {
        padding: 1rem;
        font-size: 1rem;
      }
      
      .nav-spacious {
        padding: 1.5rem;
        font-size: 1.125rem;
        line-height: 1.6;
      }
      
      .adaptive-form-field {
        transition: all 0.2s ease;
      }
      
      .adaptive-content {
        transition: all 0.3s ease;
      }
    `}</style>
  );
}