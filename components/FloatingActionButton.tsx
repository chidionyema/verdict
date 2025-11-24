'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, X, MessageSquare, Camera, FileText, Zap } from 'lucide-react';

interface FloatingActionButtonProps {
  className?: string;
}

export default function FloatingActionButton({ className = '' }: FloatingActionButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Hide on certain pages where it's not needed
  useEffect(() => {
    const hiddenPaths = ['/start', '/auth/login', '/auth/signup', '/welcome'];
    const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));
    setIsVisible(!shouldHide && !!user);
  }, [pathname, user]);

  const quickActions = [
    {
      id: 'photo',
      label: 'Photo Verdict',
      icon: Camera,
      description: 'Get feedback on photos',
      action: () => router.push('/start?type=photo'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'text',
      label: 'Text Verdict',
      icon: MessageSquare,
      description: 'Get feedback on text',
      action: () => router.push('/start?type=text'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'decision',
      label: 'Quick Decision',
      icon: Zap,
      description: 'Help with choices',
      action: () => router.push('/start?category=decision'),
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Quick Action Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-4 space-y-3">
          {quickActions.map((action, index) => (
            <div
              key={action.id}
              className={`transform transition-all duration-300 ease-out ${
                isOpen 
                  ? 'translate-y-0 opacity-100 scale-100' 
                  : 'translate-y-4 opacity-0 scale-95'
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center space-x-3">
                {/* Action Label */}
                <div className="bg-white rounded-lg shadow-lg px-4 py-2 text-right border">
                  <div className="text-sm font-medium text-gray-900">{action.label}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
                
                {/* Action Button */}
                <button
                  onClick={() => {
                    action.action();
                    setIsOpen(false);
                  }}
                  className={`w-12 h-12 rounded-full shadow-lg text-white transition-all duration-200 flex items-center justify-center ${action.color} hover:shadow-xl hover:scale-110`}
                  aria-label={action.label}
                >
                  <action.icon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
          isOpen ? 'rotate-45 scale-110' : 'rotate-0 scale-100'
        }`}
        aria-label={isOpen ? 'Close quick actions' : 'Quick actions'}
      >
        <Plus className={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
      </button>

      {/* Background overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 -z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}