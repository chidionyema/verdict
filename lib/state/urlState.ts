'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// URL State Management for Deep Linking
export interface URLStateOptions {
  shallow?: boolean;
  scroll?: boolean;
  replace?: boolean;
}

export function useURLState<T>(
  key: string,
  defaultValue: T,
  options: URLStateOptions = {}
): [T, (value: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [state, setState] = useState<T>(() => {
    const urlValue = searchParams.get(key);
    if (urlValue === null) return defaultValue;
    
    try {
      return JSON.parse(urlValue);
    } catch {
      return urlValue as unknown as T;
    }
  });

  const setURLState = useCallback((value: T) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === defaultValue || value === null || value === undefined) {
      params.delete(key);
    } else {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      params.set(key, stringValue);
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    
    if (options.replace) {
      router.replace(newUrl, { scroll: options.scroll ?? false });
    } else {
      router.push(newUrl, { scroll: options.scroll ?? false });
    }
    
    setState(value);
  }, [key, defaultValue, pathname, searchParams, router, options]);

  // Sync state when URL changes externally (back/forward navigation)
  useEffect(() => {
    const urlValue = searchParams.get(key);
    if (urlValue === null) {
      setState(defaultValue);
      return;
    }
    
    try {
      const parsedValue = JSON.parse(urlValue);
      setState(parsedValue);
    } catch {
      setState(urlValue as unknown as T);
    }
  }, [searchParams, key, defaultValue]);

  return [state, setURLState];
}

// Multiple URL parameters management
export function useMultiURLState(
  stateConfig: Record<string, any>,
  options: URLStateOptions = {}
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [states, setStates] = useState(() => {
    const initialStates: Record<string, any> = {};
    
    Object.entries(stateConfig).forEach(([key, defaultValue]) => {
      const urlValue = searchParams.get(key);
      if (urlValue === null) {
        initialStates[key] = defaultValue;
      } else {
        try {
          initialStates[key] = JSON.parse(urlValue);
        } catch {
          initialStates[key] = urlValue;
        }
      }
    });
    
    return initialStates;
  });

  const updateURLState = useCallback((updates: Record<string, any>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      const defaultValue = stateConfig[key];
      
      if (value === defaultValue || value === null || value === undefined) {
        params.delete(key);
      } else {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        params.set(key, stringValue);
      }
    });

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    
    if (options.replace) {
      router.replace(newUrl, { scroll: options.scroll ?? false });
    } else {
      router.push(newUrl, { scroll: options.scroll ?? false });
    }
    
    setStates(prev => ({ ...prev, ...updates }));
  }, [stateConfig, pathname, searchParams, router, options]);

  const setSingleState = useCallback((key: string, value: any) => {
    updateURLState({ [key]: value });
  }, [updateURLState]);

  // Sync with URL changes
  useEffect(() => {
    const newStates: Record<string, any> = {};
    let hasChanges = false;
    
    Object.entries(stateConfig).forEach(([key, defaultValue]) => {
      const urlValue = searchParams.get(key);
      let parsedValue;
      
      if (urlValue === null) {
        parsedValue = defaultValue;
      } else {
        try {
          parsedValue = JSON.parse(urlValue);
        } catch {
          parsedValue = urlValue;
        }
      }
      
      if (states[key] !== parsedValue) {
        hasChanges = true;
      }
      newStates[key] = parsedValue;
    });
    
    if (hasChanges) {
      setStates(newStates);
    }
  }, [searchParams, stateConfig, states]);

  return {
    states,
    updateState: updateURLState,
    setSingleState,
  };
}

// Shareable URL generator
export function generateShareableURL(baseUrl: string, params: Record<string, any>): string {
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      url.searchParams.set(key, stringValue);
    }
  });
  
  return url.toString();
}

// URL parameter validation
export function validateURLParams(
  searchParams: URLSearchParams,
  schema: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    options?: any[];
    required?: boolean;
    default?: any;
  }>
): { valid: boolean; errors: string[]; params: Record<string, any> } {
  const errors: string[] = [];
  const params: Record<string, any> = {};

  Object.entries(schema).forEach(([key, config]) => {
    const value = searchParams.get(key);
    
    if (config.required && !value) {
      errors.push(`Parameter '${key}' is required`);
      return;
    }
    
    if (!value) {
      params[key] = config.default;
      return;
    }

    try {
      switch (config.type) {
        case 'string':
          if (config.options && !config.options.includes(value)) {
            errors.push(`Parameter '${key}' must be one of: ${config.options.join(', ')}`);
          } else {
            params[key] = value;
          }
          break;
          
        case 'number':
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            errors.push(`Parameter '${key}' must be a number`);
          } else {
            params[key] = numValue;
          }
          break;
          
        case 'boolean':
          if (!['true', 'false'].includes(value.toLowerCase())) {
            errors.push(`Parameter '${key}' must be true or false`);
          } else {
            params[key] = value.toLowerCase() === 'true';
          }
          break;
          
        case 'array':
        case 'object':
          try {
            const parsed = JSON.parse(value);
            if (config.type === 'array' && !Array.isArray(parsed)) {
              errors.push(`Parameter '${key}' must be an array`);
            } else if (config.type === 'object' && (Array.isArray(parsed) || typeof parsed !== 'object')) {
              errors.push(`Parameter '${key}' must be an object`);
            } else {
              params[key] = parsed;
            }
          } catch {
            errors.push(`Parameter '${key}' must be valid JSON`);
          }
          break;
      }
    } catch (error) {
      errors.push(`Error parsing parameter '${key}': ${error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    params,
  };
}

// Browser history management
export function useBrowserHistory() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const updateHistoryState = () => {
      setCanGoBack(window.history.length > 1);
      // Note: canGoForward is not reliably detectable in modern browsers
      setCanGoForward(false);
    };

    updateHistoryState();
    window.addEventListener('popstate', updateHistoryState);
    
    return () => window.removeEventListener('popstate', updateHistoryState);
  }, []);

  const goBack = useCallback(() => {
    if (canGoBack) {
      router.back();
    }
  }, [router, canGoBack]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      router.forward();
    }
  }, [router, canGoForward]);

  return {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
  };
}

// Deep link utilities
export const deepLinkUtils = {
  // Create a deep link to a specific request
  createRequestLink: (requestId: string, tab?: string) => {
    const url = new URL(`/requests/${requestId}`, window.location.origin);
    if (tab) url.searchParams.set('tab', tab);
    return url.toString();
  },

  // Create a deep link to dashboard with filters
  createDashboardLink: (filters: {
    view?: string;
    filter?: string;
    search?: string;
    sort?: string;
    display?: string;
  }) => {
    const url = new URL('/dashboard', window.location.origin);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.toString();
  },

  // Legacy compatibility - redirect workspace to dashboard
  createWorkspaceLink: (filters: {
    view?: string;
    filter?: string;
    search?: string;
    sort?: string;
    display?: string;
  }) => {
    const url = new URL('/dashboard', window.location.origin);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.toString();
  },

  // Create a deep link to create page with pre-filled data
  createRequestCreationLink: (data: {
    type?: string;
    category?: string;
    media?: string;
  }) => {
    const url = new URL('/create', window.location.origin);
    Object.entries(data).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.toString();
  },

  // Create a deep link to judge queue with filters
  createJudgeLink: (filters: {
    category?: string;
    type?: string;
    sort?: string;
  }) => {
    const url = new URL('/judge', window.location.origin);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.toString();
  },

  // Parse current URL for state restoration
  parseCurrentURL: () => {
    if (typeof window === 'undefined') return {};
    
    const url = new URL(window.location.href);
    const params: Record<string, any> = {};
    
    url.searchParams.forEach((value, key) => {
      try {
        params[key] = JSON.parse(value);
      } catch {
        params[key] = value;
      }
    });
    
    return params;
  },
};