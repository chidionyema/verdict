'use client';

import { Shield, CheckCircle, Briefcase, GraduationCap, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type VerificationLevel = 'linkedin' | 'expert' | 'elite';
export type ProfessionalCategory = 'hr' | 'tech' | 'design' | 'marketing' | 'finance' | 'general';

interface VerifiedBadgeProps {
  isVerified: boolean;
  level?: VerificationLevel;
  category?: ProfessionalCategory;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CATEGORY_LABELS: Record<ProfessionalCategory, { label: string; icon: React.ReactNode }> = {
  hr: { label: 'HR Professional', icon: <Users className="h-3 w-3" /> },
  tech: { label: 'Tech Expert', icon: <Briefcase className="h-3 w-3" /> },
  design: { label: 'Design Professional', icon: <GraduationCap className="h-3 w-3" /> },
  marketing: { label: 'Marketing Expert', icon: <Briefcase className="h-3 w-3" /> },
  finance: { label: 'Finance Professional', icon: <Briefcase className="h-3 w-3" /> },
  general: { label: 'Verified Professional', icon: <Shield className="h-3 w-3" /> },
};

const LEVEL_STYLES: Record<VerificationLevel, { bg: string; text: string; border: string }> = {
  linkedin: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  expert: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  elite: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
};

const SIZE_STYLES = {
  sm: { icon: 'h-3 w-3', text: 'text-xs', padding: 'px-2 py-0.5' },
  md: { icon: 'h-4 w-4', text: 'text-sm', padding: 'px-3 py-1' },
  lg: { icon: 'h-5 w-5', text: 'text-base', padding: 'px-4 py-2' },
};

export function VerifiedBadge({ 
  isVerified, 
  level = 'linkedin', 
  category = 'general', 
  className = '',
  showText = true,
  size = 'md'
}: VerifiedBadgeProps) {
  if (!isVerified) {
    return null;
  }

  const levelStyle = LEVEL_STYLES[level];
  const categoryData = CATEGORY_LABELS[category];
  const sizeStyle = SIZE_STYLES[size];

  if (!showText) {
    // Icon-only version
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className={`rounded-full p-1 ${levelStyle.bg} ${levelStyle.border} border`}>
          <CheckCircle className={`${sizeStyle.icon} ${levelStyle.text}`} />
        </div>
      </div>
    );
  }

  return (
    <Badge 
      className={`inline-flex items-center gap-1.5 font-medium border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border} ${sizeStyle.padding} ${sizeStyle.text} ${className}`}
    >
      <CheckCircle className={sizeStyle.icon} />
      {categoryData.icon}
      <span>{categoryData.label}</span>
    </Badge>
  );
}

// Preset configurations for common use cases
export function VerifiedHRBadge({ isVerified, level = 'linkedin', size = 'md', className = '' }: { 
  isVerified: boolean; 
  level?: VerificationLevel; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <VerifiedBadge 
      isVerified={isVerified} 
      level={level} 
      category="hr" 
      size={size}
      className={className}
    />
  );
}

export function VerifiedTechBadge({ isVerified, level = 'linkedin', size = 'md', className = '' }: { 
  isVerified: boolean; 
  level?: VerificationLevel; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <VerifiedBadge 
      isVerified={isVerified} 
      level={level} 
      category="tech" 
      size={size}
      className={className}
    />
  );
}

export function VerifiedIconOnly({ isVerified, level = 'linkedin', size = 'md', className = '' }: { 
  isVerified: boolean; 
  level?: VerificationLevel; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <VerifiedBadge 
      isVerified={isVerified} 
      level={level} 
      showText={false} 
      size={size}
      className={className}
    />
  );
}