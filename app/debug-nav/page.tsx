'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DebugNav() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [navigation, setNavigation] = useState<string[]>([]);

  useEffect(() => {
    console.log('Debug Nav: Component mounted');
    
    // Track navigation
    const trackNav = (url: string) => {
      console.log('Navigation to:', url);
      setNavigation(prev => [...prev, `${new Date().toISOString()}: ${url}`]);
    };

    // Initial load
    trackNav(window.location.href);

    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('User:', user);
      setUser(user);
      
      if (user) {
        fetch('/api/me')
          .then(res => res.json())
          .then(data => {
            console.log('Profile data:', data);
            setProfile(data.profile);
          })
          .catch(err => console.error('Profile fetch error:', err));
      }
    });
  }, []);

  const testDashboard = () => {
    console.log('Attempting to navigate to /dashboard');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Navigation Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg">
            <h2 className="font-bold mb-2">User Info</h2>
            <pre className="text-xs">{JSON.stringify(user, null, 2)}</pre>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h2 className="font-bold mb-2">Profile Info</h2>
            <pre className="text-xs">{JSON.stringify(profile, null, 2)}</pre>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg mb-6">
          <h2 className="font-bold mb-2">Navigation Log</h2>
          <div className="space-y-1 max-h-40 overflow-auto">
            {navigation.map((nav, i) => (
              <div key={i} className="text-xs font-mono">{nav}</div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={testDashboard}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
          >
            Test Dashboard Navigate
          </button>
          
          <Link
            href="/dashboard"
            className="bg-green-600 text-white px-4 py-2 rounded inline-block mr-4"
          >
            Dashboard Link
          </Link>
          
          <Link
            href="/account"
            className="bg-purple-600 text-white px-4 py-2 rounded inline-block mr-4"
          >
            Account Link
          </Link>
          
          <Link
            href="/requests"
            className="bg-orange-600 text-white px-4 py-2 rounded inline-block"
          >
            Requests Link
          </Link>
        </div>
      </div>
    </div>
  );
}