'use client';

import { useState, useEffect } from 'react';
import { Activity, MapPin } from 'lucide-react';

interface ActivityItem {
  id: string;
  location: string;
  type: string;
  category: string;
  timeAgo: string;
}

// Sample activities that rotate (in production, this would come from real-time data)
const SAMPLE_ACTIVITIES: ActivityItem[] = [
  { id: '1', location: 'London', type: 'submitted', category: 'Dating Profile', timeAgo: '2 min ago' },
  { id: '2', location: 'New York', type: 'received feedback on', category: 'Outfit Check', timeAgo: '5 min ago' },
  { id: '3', location: 'Paris', type: 'submitted', category: 'Career Decision', timeAgo: '8 min ago' },
  { id: '4', location: 'Toronto', type: 'received feedback on', category: 'Wedding Speech', timeAgo: '10 min ago' },
  { id: '5', location: 'Sydney', type: 'submitted', category: 'First Date Outfit', timeAgo: '12 min ago' },
  { id: '6', location: 'Berlin', type: 'received feedback on', category: 'Job Interview Look', timeAgo: '15 min ago' },
  { id: '7', location: 'Tokyo', type: 'submitted', category: 'LinkedIn Photo', timeAgo: '18 min ago' },
  { id: '8', location: 'Mumbai', type: 'received feedback on', category: 'Business Email', timeAgo: '20 min ago' },
];

export function LiveActivityTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % SAMPLE_ACTIVITIES.length);
        setIsVisible(true);
      }, 300);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const currentActivity = SAMPLE_ACTIVITIES[currentIndex];

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <Activity className="h-4 w-4 animate-pulse" />
        <div className={`text-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <span className="font-medium">Someone in {currentActivity.location}</span>
          <span className="opacity-90"> just {currentActivity.type} their </span>
          <span className="font-semibold">{currentActivity.category}</span>
          <span className="opacity-75 ml-2">• {currentActivity.timeAgo}</span>
        </div>
        <MapPin className="h-3 w-3 opacity-75" />
      </div>
    </div>
  );
}