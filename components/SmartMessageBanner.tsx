'use client';

import { useState, useEffect } from 'react';
import { X, Clock, TrendingUp, Star, Zap } from 'lucide-react';

interface SmartMessage {
  id: string;
  type: 'urgency' | 'social_proof' | 'quality' | 'motivation';
  message: string;
  subtext?: string;
  icon: any;
  background: string;
  border: string;
  textColor: string;
  duration?: number;
}

const messages: SmartMessage[] = [
  {
    id: '1',
    type: 'social_proof',
    message: '23 people improved their appearance today',
    subtext: 'Join the improvement wave',
    icon: TrendingUp,
    background: 'bg-green-50',
    border: 'border-green-200',
    textColor: 'text-green-800',
    duration: 5000
  },
  {
    id: '2',
    type: 'urgency',
    message: '3 expert judges available now',
    subtext: 'Get feedback within 30 minutes',
    icon: Clock,
    background: 'bg-orange-50',
    border: 'border-orange-200',
    textColor: 'text-orange-800',
    duration: 4000
  },
  {
    id: '3',
    type: 'quality',
    message: 'Last 10 verdicts averaged 9.2/10 rating',
    subtext: 'Our judges deliver exceptional feedback',
    icon: Star,
    background: 'bg-yellow-50',
    border: 'border-yellow-200',
    textColor: 'text-yellow-800',
    duration: 6000
  },
  {
    id: '4',
    type: 'motivation',
    message: 'Small changes, big impact',
    subtext: '87% see results within 1 week',
    icon: Zap,
    background: 'bg-purple-50',
    border: 'border-purple-200',
    textColor: 'text-purple-800',
    duration: 5000
  }
];

interface SmartMessageBannerProps {
  currentStep?: number;
  category?: string;
}

export default function SmartMessageBanner({ currentStep, category }: SmartMessageBannerProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [fadeClass, setFadeClass] = useState('opacity-100');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isVisible || isPaused) return;

    const message = messages[currentMessage];
    const timer = setTimeout(() => {
      setFadeClass('opacity-0');
      
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
        setFadeClass('opacity-100');
      }, 300);
    }, message.duration || 5000);

    return () => clearTimeout(timer);
  }, [currentMessage, isVisible, isPaused]);

  // Pause on user interaction
  useEffect(() => {
    const handleUserActivity = () => {
      setIsPaused(true);
      // Resume after 3 seconds of inactivity
      setTimeout(() => setIsPaused(false), 3000);
    };

    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);

    return () => {
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
    };
  }, []);

  if (!isVisible) return null;

  const message = messages[currentMessage];
  const Icon = message.icon;

  // Context-specific messages
  const getContextualMessage = () => {
    if (currentStep === 1) {
      return {
        ...message,
        message: 'Upload quality affects feedback quality',
        subtext: 'Good lighting = better verdicts'
      };
    }
    if (currentStep === 2) {
      return {
        ...message,
        message: `${category} experts are our most experienced`,
        subtext: 'Average 5+ years in the field'
      };
    }
    if (currentStep === 3) {
      return {
        ...message,
        message: 'Context helps judges give specific advice',
        subtext: 'More details = more actionable feedback'
      };
    }
    return message;
  };

  const contextMessage = getContextualMessage();

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-300 ${fadeClass}`}>
      <div className={`${contextMessage.background} ${contextMessage.border} border rounded-lg px-4 py-3 shadow-lg max-w-md`}>
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${contextMessage.textColor}`} />
          <div className="flex-1">
            <p className={`font-medium text-sm ${contextMessage.textColor}`}>
              {contextMessage.message}
            </p>
            {contextMessage.subtext && (
              <p className={`text-xs ${contextMessage.textColor} opacity-75`}>
                {contextMessage.subtext}
              </p>
            )}
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className={`${contextMessage.textColor} opacity-50 hover:opacity-75 transition`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}