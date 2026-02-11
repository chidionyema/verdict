export type SubmissionStepType = 'details' | 'mode' | 'payment' | 'processing' | 'success';

export interface SubmissionData {
  category: string;
  question: string;
  context: string;
  mediaType: 'photo' | 'text' | 'split_test' | 'comparison';
  mediaUrl?: string;
  visibility?: 'public' | 'private';
  mode?: 'community' | 'private';
  requestId?: string;
  roastMode?: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: string;
  bgColor: string;
  iconColor: string;
}

export const CATEGORIES: CategoryOption[] = [
  {
    id: 'appearance',
    name: 'Style & Appearance',
    icon: '👔',
    description: 'Outfits, hair, photos, looks',
    gradient: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
  },
  {
    id: 'dating',
    name: 'Dating & Relationships',
    icon: '💕',
    description: 'Dating profiles, texts, advice',
    gradient: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  {
    id: 'career',
    name: 'Career & Professional',
    icon: '💼',
    description: 'Resume, LinkedIn, workplace',
    gradient: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: 'writing',
    name: 'Creative & Writing',
    icon: '✍️',
    description: 'Content, copy, creative work',
    gradient: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    id: 'decision',
    name: 'Life Decisions',
    icon: '🤔',
    description: 'Important choices, dilemmas',
    gradient: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];
