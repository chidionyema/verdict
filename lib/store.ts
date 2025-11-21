import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Verdict {
  id: string;
  judgeId: string;
  rating?: number;
  feedback: string;
  tone: 'honest' | 'constructive' | 'encouraging';
  demographics: {
    ageRange: string;
    gender: string;
    location: string;
  };
  createdAt: Date;
}

export interface VerdictRequest {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'text';
  category: string;
  context: string;
  status: 'pending' | 'in_progress' | 'completed';
  verdicts: Verdict[];
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  credits: number;
  role: 'seeker' | 'judge' | 'both';
}

interface StoreState {
  // User state
  user: User | null;
  setUser: (user: User) => void;

  // Request state
  currentRequest: VerdictRequest | null;
  setCurrentRequest: (request: VerdictRequest) => void;
  addVerdict: (verdict: Verdict) => void;

  // Upload state
  uploadedMedia: { url: string; type: string } | null;
  setUploadedMedia: (media: { url: string; type: string }) => void;

  // Judge state
  availableRequests: VerdictRequest[];
  addAvailableRequest: (request: VerdictRequest) => void;
  claimRequest: (requestId: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  currentRequest: null,
  setCurrentRequest: (request) => set({ currentRequest: request }),
  addVerdict: (verdict) =>
    set((state) => ({
      currentRequest: state.currentRequest
        ? {
            ...state.currentRequest,
            verdicts: [...state.currentRequest.verdicts, verdict],
            status:
              state.currentRequest.verdicts.length + 1 >= 10
                ? 'completed'
                : 'in_progress',
          }
        : null,
    })),

  uploadedMedia: null,
  setUploadedMedia: (media) => set({ uploadedMedia: media }),

  availableRequests: [],
  addAvailableRequest: (request) =>
    set((state) => ({
      availableRequests: [...state.availableRequests, request],
    })),
  claimRequest: (requestId) =>
    set((state) => ({
      availableRequests: state.availableRequests.filter(
        (r) => r.id !== requestId
      ),
    })),
}));
