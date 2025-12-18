'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ModeSelectionCards } from '@/components/mode/ModeSelectionCards';
import type { Mode } from '@/lib/mode-colors';

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Check for special modes in URL
  const mode = searchParams.get('mode');

  // Check user credits on load and handle special modes
  useEffect(() => {
    async function checkCredits() {
      if (typeof window === 'undefined') return;
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();
        
        if (profile && 'credits' in profile) {
          setUserCredits((profile as any).credits || 0);
        }
      }
      
      // Handle special submission modes
      if (mode === 'comparison') {
        // For now, redirect to start-simple with comparison mode
        router.push('/start-simple?type=comparison');
        return;
      } else if (mode === 'split_test') {
        // For now, redirect to start-simple with split test mode
        router.push('/start-simple?type=split_test');
        return;
      }
      
      setLoading(false);
    }
    
    checkCredits();
  }, [mode, router]);

  const handleModeSelect = (mode: Mode) => {
    setSelectedMode(mode);
    
    // Map mode types: 'community' = 'public', 'private' = 'private'
    if (mode === 'community') {
      // Always allow submission attempt - let the submission flow handle credits
      router.push('/start-simple?visibility=public');
    } else if (mode === 'private') {
      router.push('/start-simple?visibility=private'); // Goes to paid flow
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Submit for Feedback
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose how you want to get honest feedback from real people
          </p>
        </div>

        {/* User Status */}
        {userCredits > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                You have {userCredits} {userCredits === 1 ? 'credit' : 'credits'} available
              </span>
            </div>
          </div>
        )}

        {/* Mode Selection - Using War Room Components */}
        <ModeSelectionCards
          onSelectMode={handleModeSelect}
          selectedMode={selectedMode || undefined}
          className="mb-12"
        />

        {/* Help Section */}
        <div className="mt-16 bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            How It Works
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-indigo-600 font-bold text-lg">1</span>
              </div>
              <h4 className="font-semibold mb-2">Choose Mode</h4>
              <p className="text-sm text-gray-600">Public (free with credits) or Private (£3)</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold text-lg">2</span>
              </div>
              <h4 className="font-semibold mb-2">Submit Content</h4>
              <p className="text-sm text-gray-600">Upload photo, text, or describe your decision</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-lg">3</span>
              </div>
              <h4 className="font-semibold mb-2">Get Feedback</h4>
              <p className="text-sm text-gray-600">Receive honest opinions and ratings</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Need credits?{' '}
            <Link href="/feed" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Judge others in the community feed
            </Link>
          </p>
          
          <p className="text-sm text-gray-500">
            Judge 3 submissions = Earn 1 credit • Private mode skips judging requirement
          </p>
        </div>
      </div>
    </div>
  );
}
