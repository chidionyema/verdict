'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sun, Moon, Coffee, Briefcase, Heart, Clock } from 'lucide-react';

interface TimeBasedContent {
  greeting: string;
  headline: string;
  subheadline: string;
  icon: React.ReactNode;
  gradient: string;
}

interface DeviceSpecificContent {
  mobile: {
    buttonSize: string;
    spacing: string;
    fontSize: {
      headline: string;
      subheadline: string;
    };
  };
  desktop: {
    buttonSize: string;
    spacing: string;
    fontSize: {
      headline: string;
      subheadline: string;
    };
  };
}

const TIME_BASED_CONTENT: Record<string, TimeBasedContent> = {
  earlyMorning: {
    greeting: "Early bird special",
    headline: "Start your day with confidence",
    subheadline: "Get feedback while others sleep. Reviewers are most active now.",
    icon: <Coffee className="h-6 w-6" />,
    gradient: "from-orange-400 via-rose-400 to-pink-500"
  },
  morning: {
    greeting: "Good morning",
    headline: "Perfect your professional look",
    subheadline: "Peak hours for career and interview feedback. Get responses in minutes.",
    icon: <Briefcase className="h-6 w-6" />,
    gradient: "from-yellow-400 via-orange-400 to-amber-500"
  },
  afternoon: {
    greeting: "Good afternoon",
    headline: "Quick feedback break?",
    subheadline: "Lunch hour = fastest response times. Submit now, results by 2pm.",
    icon: <Sun className="h-6 w-6" />,
    gradient: "from-blue-400 via-indigo-500 to-purple-600"
  },
  evening: {
    greeting: "Good evening",
    headline: "Perfect your dating profile",
    subheadline: "Prime time for dating advice. Our best reviewers are online now.",
    icon: <Heart className="h-6 w-6" />,
    gradient: "from-purple-500 via-pink-500 to-rose-500"
  },
  night: {
    greeting: "Working late?",
    headline: "Get overnight feedback",
    subheadline: "Submit now, wake up to insights. Night owls give the best reviews.",
    icon: <Moon className="h-6 w-6" />,
    gradient: "from-indigo-600 via-purple-700 to-indigo-900"
  }
};

// Helper function to get time of day
const getTimeOfDay = (): keyof typeof TIME_BASED_CONTENT => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return 'earlyMorning';
  else if (hour >= 9 && hour < 12) return 'morning';
  else if (hour >= 12 && hour < 17) return 'afternoon';
  else if (hour >= 17 && hour < 21) return 'evening';
  else return 'night';
};

export function DynamicHero() {
  const router = useRouter();
  const [timeOfDay, setTimeOfDay] = useState<keyof typeof TIME_BASED_CONTENT>('afternoon'); // Always start with neutral
  const [isMobile, setIsMobile] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [userIntent, setUserIntent] = useState<'dating' | 'career' | 'style' | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated and set correct time
    setIsHydrated(true);
    setTimeOfDay(getTimeOfDay());

    // Detect device
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    // Check returning user
    const visited = localStorage.getItem('verdict_visited');
    if (visited) {
      setIsReturningUser(true);
      // Get their last intent
      const lastIntent = localStorage.getItem('verdict_last_intent');
      if (lastIntent) setUserIntent(lastIntent as any);
    } else {
      localStorage.setItem('verdict_visited', 'true');
    }
  }, []);

  const content = TIME_BASED_CONTENT[timeOfDay];
  
  const deviceStyles = isMobile ? {
    container: "px-4 py-16",
    headline: "text-4xl",
    subheadline: "text-lg",
    button: "w-full py-4 text-base",
    spacing: "space-y-6"
  } : {
    container: "px-8 py-24",
    headline: "text-6xl",
    subheadline: "text-xl",
    button: "px-10 py-5 text-lg",
    spacing: "space-y-8"
  };

  const getPersonalizedCTA = () => {
    if (isReturningUser) {
      if (userIntent === 'dating') return "Continue with dating feedback →";
      if (userIntent === 'career') return "Get more career insights →";
      if (userIntent === 'style') return "Check another outfit →";
      return "Welcome back! Get started →";
    }
    return "Get honest feedback now →";
  };

  // Don't render until hydrated to prevent flash
  if (!isHydrated) {
    return <div className={`${deviceStyles.container} opacity-0 pointer-events-none`} style={{ height: '600px' }} />;
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${content.gradient} ${deviceStyles.container} animate-in fade-in duration-300`}>
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full filter blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className={deviceStyles.spacing}>
          {/* Time-based greeting */}
          <div className="flex items-center gap-2 text-white/90">
            {content.icon}
            <span className="text-sm font-medium uppercase tracking-wider">
              {content.greeting}
            </span>
          </div>

          {/* Core Value Proposition - Always visible first */}
          <h1 className={`${deviceStyles.headline} font-bold text-white leading-tight`}>
            Get honest feedback from real people
          </h1>

          {/* Clear explanation */}
          <p className={`${deviceStyles.subheadline} text-white/90 max-w-2xl`}>
            Submit anything. Get 3 detailed feedback reports in under 2 hours.
            <span className="font-semibold"> 100% anonymous.</span>
          </p>

          {/* Time-based secondary message */}
          <p className="text-white/70 text-sm max-w-xl">
            {content.subheadline}
          </p>

          {/* Personalized CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                localStorage.setItem('verdict_hero_timeOfDay', timeOfDay);
                router.push('/submit');
              }}
              className={`bg-white text-gray-900 ${deviceStyles.button} rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2`}
            >
              {getPersonalizedCTA()}
            </button>

            {isReturningUser && (
              <button
                onClick={() => router.push('/dashboard')}
                className={`bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 ${deviceStyles.button} rounded-xl font-bold hover:bg-white/30 transition-all duration-300`}
              >
                View your dashboard
              </button>
            )}
          </div>

          {/* Dynamic social proof based on time */}
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Clock className="h-4 w-4" />
            <span>
              {timeOfDay === 'earlyMorning' && "23 early risers active now"}
              {timeOfDay === 'morning' && "156 professionals reviewing now"}
              {timeOfDay === 'afternoon' && "89 people getting lunch break feedback"}
              {timeOfDay === 'evening' && "234 dating experts online"}
              {timeOfDay === 'night' && "67 night owls giving detailed reviews"}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.1); }
        }
        
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}