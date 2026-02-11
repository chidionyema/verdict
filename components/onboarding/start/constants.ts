import { Heart, Briefcase, FileText, HelpCircle, MessageSquare, Star, Clock } from 'lucide-react';

export const categories = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Heart,
    description: 'Dating photos, interview looks, event outfits',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-gradient-to-br from-rose-50 to-pink-50',
    iconColor: 'text-rose-600'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: Briefcase,
    description: 'LinkedIn, resume, dating profiles, bios',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    iconColor: 'text-blue-600'
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: FileText,
    description: 'Emails, messages, content, proposals',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    iconColor: 'text-emerald-600'
  },
  {
    id: 'decision',
    label: 'Decision',
    icon: HelpCircle,
    description: 'Life choices, purchases, career moves',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50',
    iconColor: 'text-violet-600'
  },
];

export const socialProof = [
  { metric: "500+", label: "Expert reviews delivered", icon: MessageSquare },
  { metric: "4.9★", label: "Average rating", icon: Star },
  { metric: "15min", label: "Average response time", icon: Clock },
];

export const subcategories: Record<string, string[]> = {
  appearance: ['dating', 'interview', 'event', 'casual', 'professional'],
  profile: ['linkedin', 'resume', 'dating', 'portfolio'],
  writing: ['email', 'message', 'content', 'proposal'],
  decision: ['purchase', 'career', 'relationship', 'lifestyle'],
};
