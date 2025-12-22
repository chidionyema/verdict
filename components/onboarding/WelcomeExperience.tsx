'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { 
  Sparkles, 
  ArrowRight, 
  Play,
  Users,
  MessageSquare,
  Heart,
  Zap,
  Gift
} from 'lucide-react';
import { motion } from 'framer-motion';

interface WelcomeOption {
  id: string;
  title: string;
  description: string;
  action: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  benefit: string;
  time: string;
}

const WELCOME_OPTIONS: WelcomeOption[] = [
  {
    id: 'try-now',
    title: 'Get Feedback Right Now',
    description: 'Ask about anything - dating profile, outfit, decision, email',
    action: 'Start Free Request',
    href: '/create',
    icon: <Zap className="h-6 w-6" />,
    color: 'from-amber-500 to-orange-500',
    benefit: 'Instant value - see how it works',
    time: '2 min'
  },
  {
    id: 'help-others',
    title: 'Help Others & Earn Credits',
    description: 'Give feedback to real people and earn free submission credits',
    action: 'Browse Requests',
    href: '/review',
    icon: <Heart className="h-6 w-6" />,
    color: 'from-pink-500 to-rose-500',
    benefit: 'Build karma, earn credits',
    time: '5 min'
  },
  {
    id: 'explore',
    title: 'See What Others Ask About',
    description: 'Browse community requests to get inspired',
    action: 'Explore Community',
    href: '/feed',
    icon: <Users className="h-6 w-6" />,
    color: 'from-blue-500 to-indigo-500',
    benefit: 'Find inspiration, no commitment',
    time: '1 min'
  }
];

interface WelcomeExperienceProps {
  user: User;
  onComplete: () => void;
}

export function WelcomeExperience({ user, onComplete }: WelcomeExperienceProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string>('try-now');
  
  useEffect(() => {
    // Track that user saw welcome experience
    localStorage.setItem(`welcome-shown-${user.id}`, Date.now().toString());
  }, [user.id]);

  const handleOptionSelect = (optionId: string) => {
    const option = WELCOME_OPTIONS.find(opt => opt.id === optionId);
    if (option) {
      // Track selection
      localStorage.setItem(`welcome-choice-${user.id}`, optionId);
      
      // Go directly to the experience
      router.push(option.href);
      
      // Mark welcome as complete
      onComplete();
    }
  };

  const selectedOptionData = WELCOME_OPTIONS.find(opt => opt.id === selectedOption);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Welcome to AskVerdict! 🎉
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600"
          >
            How would you like to start?
          </motion.p>
        </div>

        <div className="space-y-4 mb-8">
          {WELCOME_OPTIONS.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              onClick={() => setSelectedOption(option.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedOption === option.id
                  ? 'border-indigo-300 bg-indigo-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${option.color} rounded-xl flex items-center justify-center text-white`}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{option.title}</h3>
                    <p className="text-gray-600">{option.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-green-600 font-medium">✨ {option.benefit}</span>
                      <span className="text-sm text-gray-500">⏱ {option.time}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                  selectedOption === option.id
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-gray-300'
                }`}>
                  {selectedOption === option.id && (
                    <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <button
            onClick={() => handleOptionSelect(selectedOption)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-3"
          >
            {selectedOptionData?.action}
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Gift className="h-4 w-4" />
              <span>No setup required</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>Instant value</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>Real community</span>
            </div>
          </div>
        </motion.div>

        {/* Skip option - but make it less prominent */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6"
        >
          <button
            onClick={onComplete}
            className="text-gray-400 hover:text-gray-600 text-sm underline"
          >
            Skip for now
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}