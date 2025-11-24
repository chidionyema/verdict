import React from 'react';

interface EncouragingCounterProps {
  count: number;
  min?: number;
  max: number;
  className?: string;
}

export function EncouragingCounter({
  count,
  min = 100,
  max,
  className = '',
}: EncouragingCounterProps) {
  const getEncouragement = () => {
    if (count < min) {
      return {
        text: `Keep going (${count}/${min} minimum)`,
        color: 'text-gray-500',
      };
    } else if (count < 300) {
      return {
        text: `Good start (${count})`,
        color: 'text-blue-600',
      };
    } else if (count < 500) {
      return {
        text: `Great detail (${count})`,
        color: 'text-green-600',
      };
    } else {
      return {
        text: `Excellent context (${count})`,
        color: 'text-purple-600',
      };
    }
  };

  const encouragement = getEncouragement();
  const isOverLimit = count > max;

  return (
    <div className={`flex items-center justify-between text-sm ${className}`}>
      <span className={isOverLimit ? 'text-red-600' : encouragement.color}>
        {isOverLimit
          ? `Too long (${count}/${max})`
          : encouragement.text}
      </span>
      {!isOverLimit && count >= min && (
        <span className="text-gray-500">
          The more detail, the better advice
        </span>
      )}
    </div>
  );
}
