'use client';

import { Card, CardContent } from '@/components/ui/card';
import { modeClasses, type Mode } from '@/lib/mode-colors';
import { cn } from '@/lib/utils';
import { ModeBadge } from './ModeBadge';

interface ModeCardProps {
  mode: Mode;
  title: string;
  description?: string;
  features?: string[];
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function ModeCard({
  mode,
  title,
  description,
  features,
  children,
  className,
  onClick,
  selected = false,
}: ModeCardProps) {
  const cardClasses = modeClasses[mode].card;
  const isInteractive = !!onClick;

  return (
    <Card
      className={cn(
        cardClasses,
        'transition-all duration-300',
        isInteractive && 'cursor-pointer hover:shadow-xl transform hover:-translate-y-1',
        selected && 'ring-2 ring-offset-2',
        selected && mode === 'community' && 'ring-green-500',
        selected && mode === 'private' && 'ring-purple-500',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <ModeBadge mode={mode} />
        </div>
        
        {description && (
          <p className="text-gray-600 mb-4">{description}</p>
        )}
        
        {features && features.length > 0 && (
          <ul className="space-y-2 mb-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className={mode === 'community' ? 'text-green-600' : 'text-purple-600'}>
                  {feature.startsWith('✅') || feature.startsWith('⏱️') || feature.startsWith('👁️') || feature.startsWith('💰') 
                    ? feature.charAt(0) 
                    : '•'}
                </span>
                <span>{feature.replace(/^[✅⏱️👁️💰]+\s*/, '')}</span>
              </li>
            ))}
          </ul>
        )}
        
        {children}
      </CardContent>
    </Card>
  );
}

