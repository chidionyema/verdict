'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Global App State Interface
interface AppState {
  // User State
  user: any | null;
  userProfile: any | null;
  
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  
  // Dashboard State
  dashboardView: 'overview' | 'active' | 'history' | 'analytics';
  dashboardFilter: 'all' | 'open' | 'closed' | 'cancelled';
  dashboardSearch: string;
  dashboardSort: 'newest' | 'oldest' | 'status' | 'progress';
  dashboardDisplay: 'grid' | 'list' | 'compact';
  
  // Create Form State
  createFormData: {
    requestType: 'verdict' | 'comparison' | 'split_test';
    mediaType: 'photo' | 'text' | 'audio';
    category: string;
    context: string;
    textContent: string;
    targetVerdictCount: number;
    creditsToUse: number;
    draft: boolean;
  };
  
  // Judge State
  judgeQueueType: 'expert' | 'community';
  judgeFilter: string;
  judgeSort: 'newest' | 'oldest' | 'earnings';
  judgeSearch: string;
  
  // Navigation State
  breadcrumbs: Array<{ label: string; href: string }>;
  lastVisitedPage: string;
  
  // Notification State
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>;
  
  // Feature Discovery State
  onboardingCompleted: boolean;
  featuresDiscovered: string[];
  lastFeaturePrompt: number;
  
  // Analytics & Performance
  pageLoadTimes: Record<string, number>;
  userInteractions: Array<{
    action: string;
    element: string;
    timestamp: number;
    metadata?: any;
  }>;
}

interface AppActions {
  // User Actions
  setUser: (user: any) => void;
  setUserProfile: (profile: any) => void;
  clearUser: () => void;
  
  // UI Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  
  // Dashboard Actions
  setDashboardView: (view: AppState['dashboardView']) => void;
  setDashboardFilter: (filter: AppState['dashboardFilter']) => void;
  setDashboardSearch: (search: string) => void;
  setDashboardSort: (sort: AppState['dashboardSort']) => void;
  setDashboardDisplay: (display: AppState['dashboardDisplay']) => void;
  setDashboardState: (state: Partial<Pick<AppState, 'dashboardView' | 'dashboardFilter' | 'dashboardSearch' | 'dashboardSort' | 'dashboardDisplay'>>) => void;
  
  // Create Form Actions
  setCreateFormData: (data: Partial<AppState['createFormData']>) => void;
  clearCreateForm: () => void;
  saveDraft: () => void;
  loadDraft: () => void;
  
  // Judge Actions
  setJudgeQueueType: (type: AppState['judgeQueueType']) => void;
  setJudgeFilter: (filter: string) => void;
  setJudgeSort: (sort: AppState['judgeSort']) => void;
  setJudgeSearch: (search: string) => void;
  setJudgeState: (state: Partial<Pick<AppState, 'judgeQueueType' | 'judgeFilter' | 'judgeSort' | 'judgeSearch'>>) => void;
  
  // Navigation Actions
  setBreadcrumbs: (breadcrumbs: AppState['breadcrumbs']) => void;
  addBreadcrumb: (breadcrumb: { label: string; href: string }) => void;
  setLastVisitedPage: (page: string) => void;
  
  // Notification Actions
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Feature Discovery Actions
  setOnboardingCompleted: (completed: boolean) => void;
  addDiscoveredFeature: (feature: string) => void;
  setLastFeaturePrompt: (timestamp: number) => void;
  
  // Analytics Actions
  recordPageLoad: (page: string, loadTime: number) => void;
  recordInteraction: (action: string, element: string, metadata?: any) => void;
  
  // Utility Actions
  resetState: () => void;
}

const initialState: AppState = {
  // User State
  user: null,
  userProfile: null,
  
  // UI State
  sidebarOpen: false,
  theme: 'light',
  
  // Dashboard State
  dashboardView: 'overview',
  dashboardFilter: 'all',
  dashboardSearch: '',
  dashboardSort: 'newest',
  dashboardDisplay: 'grid',
  
  // Create Form State
  createFormData: {
    requestType: 'verdict',
    mediaType: 'photo',
    category: 'appearance',
    context: '',
    textContent: '',
    targetVerdictCount: 5,
    creditsToUse: 2,
    draft: false,
  },
  
  // Judge State
  judgeQueueType: 'community',
  judgeFilter: 'all',
  judgeSort: 'newest',
  judgeSearch: '',
  
  // Navigation State
  breadcrumbs: [],
  lastVisitedPage: '/',
  
  // Notification State
  notifications: [],
  
  // Feature Discovery State
  onboardingCompleted: false,
  featuresDiscovered: [],
  lastFeaturePrompt: 0,
  
  // Analytics & Performance
  pageLoadTimes: {},
  userInteractions: [],
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // User Actions
      setUser: (user) => set({ user }),
      setUserProfile: (userProfile) => set({ userProfile }),
      clearUser: () => set({ user: null, userProfile: null }),
      
      // UI Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setTheme: (theme) => set({ theme }),
      
      // Dashboard Actions
      setDashboardView: (dashboardView) => set({ dashboardView }),
      setDashboardFilter: (dashboardFilter) => set({ dashboardFilter }),
      setDashboardSearch: (dashboardSearch) => set({ dashboardSearch }),
      setDashboardSort: (dashboardSort) => set({ dashboardSort }),
      setDashboardDisplay: (dashboardDisplay) => set({ dashboardDisplay }),
      setDashboardState: (updates) => set((state) => ({ ...state, ...updates })),
      
      // Create Form Actions
      setCreateFormData: (data) => set((state) => ({ 
        createFormData: { ...state.createFormData, ...data } 
      })),
      clearCreateForm: () => set({ createFormData: initialState.createFormData }),
      saveDraft: () => {
        const { createFormData } = get();
        if (typeof window !== 'undefined') {
          localStorage.setItem('verdict_create_draft', JSON.stringify(createFormData));
        }
        set((state) => ({ createFormData: { ...state.createFormData, draft: true } }));
      },
      loadDraft: () => {
        if (typeof window !== 'undefined') {
          const draft = localStorage.getItem('verdict_create_draft');
          if (draft) {
            try {
              const parsedDraft = JSON.parse(draft);
              set({ createFormData: { ...parsedDraft, draft: true } });
            } catch (error) {
              console.error('Error loading draft:', error);
            }
          }
        }
      },
      
      // Judge Actions
      setJudgeQueueType: (judgeQueueType) => set({ judgeQueueType }),
      setJudgeFilter: (judgeFilter) => set({ judgeFilter }),
      setJudgeSort: (judgeSort) => set({ judgeSort }),
      setJudgeSearch: (judgeSearch) => set({ judgeSearch }),
      setJudgeState: (updates) => set((state) => ({ ...state, ...updates })),
      
      // Navigation Actions
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      addBreadcrumb: (breadcrumb) => set((state) => ({ 
        breadcrumbs: [...state.breadcrumbs, breadcrumb] 
      })),
      setLastVisitedPage: (lastVisitedPage) => set({ lastVisitedPage }),
      
      // Notification Actions
      addNotification: (notification) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newNotification = {
          ...notification,
          id,
          timestamp: Date.now(),
          read: false,
        };
        set((state) => ({ 
          notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep only last 50
        }));
      },
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      })),
      clearNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      clearAllNotifications: () => set({ notifications: [] }),
      
      // Feature Discovery Actions
      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),
      addDiscoveredFeature: (feature) => set((state) => ({
        featuresDiscovered: [...new Set([...state.featuresDiscovered, feature])]
      })),
      setLastFeaturePrompt: (lastFeaturePrompt) => set({ lastFeaturePrompt }),
      
      // Analytics Actions
      recordPageLoad: (page, loadTime) => set((state) => ({
        pageLoadTimes: { ...state.pageLoadTimes, [page]: loadTime }
      })),
      recordInteraction: (action, element, metadata) => {
        const interaction = {
          action,
          element,
          timestamp: Date.now(),
          metadata,
        };
        set((state) => ({
          userInteractions: [...state.userInteractions, interaction].slice(-1000) // Keep only last 1000
        }));
      },
      
      // Utility Actions
      resetState: () => set(initialState),
    }),
    {
      name: 'verdict-app-state',
      partialize: (state) => ({
        // Only persist certain parts of the state
        theme: state.theme,
        dashboardView: state.dashboardView,
        dashboardFilter: state.dashboardFilter,
        dashboardSort: state.dashboardSort,
        dashboardDisplay: state.dashboardDisplay,
        createFormData: state.createFormData,
        judgeQueueType: state.judgeQueueType,
        judgeFilter: state.judgeFilter,
        judgeSort: state.judgeSort,
        onboardingCompleted: state.onboardingCompleted,
        featuresDiscovered: state.featuresDiscovered,
        lastFeaturePrompt: state.lastFeaturePrompt,
        lastVisitedPage: state.lastVisitedPage,
      }),
    }
  )
);

// Selectors for commonly used state combinations
export const useDashboardState = () => {
  const {
    dashboardView,
    dashboardFilter,
    dashboardSearch,
    dashboardSort,
    dashboardDisplay,
    setDashboardView,
    setDashboardFilter,
    setDashboardSearch,
    setDashboardSort,
    setDashboardDisplay,
    setDashboardState,
  } = useAppStore();
  
  return {
    view: dashboardView,
    filter: dashboardFilter,
    search: dashboardSearch,
    sort: dashboardSort,
    display: dashboardDisplay,
    setView: setDashboardView,
    setFilter: setDashboardFilter,
    setSearch: setDashboardSearch,
    setSort: setDashboardSort,
    setDisplay: setDashboardDisplay,
    setState: setDashboardState,
  };
};

// Legacy compatibility - redirect to dashboard state
export const useWorkspaceState = useDashboardState;

export const useJudgeState = () => {
  const {
    judgeQueueType,
    judgeFilter,
    judgeSort,
    judgeSearch,
    setJudgeQueueType,
    setJudgeFilter,
    setJudgeSort,
    setJudgeSearch,
    setJudgeState,
  } = useAppStore();
  
  return {
    queueType: judgeQueueType,
    filter: judgeFilter,
    sort: judgeSort,
    search: judgeSearch,
    setQueueType: setJudgeQueueType,
    setFilter: setJudgeFilter,
    setSort: setJudgeSort,
    setSearch: setJudgeSearch,
    setState: setJudgeState,
  };
};

export const useNotifications = () => {
  const {
    notifications,
    addNotification,
    markNotificationAsRead,
    clearNotification,
    clearAllNotifications,
  } = useAppStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return {
    notifications,
    unreadCount,
    addNotification,
    markNotificationAsRead,
    clearNotification,
    clearAllNotifications,
  };
};

// Analytics hooks
export const useAnalytics = () => {
  const {
    pageLoadTimes,
    userInteractions,
    recordPageLoad,
    recordInteraction,
  } = useAppStore();
  
  return {
    pageLoadTimes,
    userInteractions,
    recordPageLoad,
    recordInteraction,
    getAverageLoadTime: () => {
      const times = Object.values(pageLoadTimes);
      return times.length ? times.reduce((a, b) => a + b) / times.length : 0;
    },
    getInteractionCount: (action?: string) => {
      return action 
        ? userInteractions.filter(i => i.action === action).length
        : userInteractions.length;
    },
  };
};