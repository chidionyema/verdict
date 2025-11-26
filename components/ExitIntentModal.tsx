'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ExitIntentModalProps {
  className?: string;
}

const STORAGE_KEY = 'verdict_exit_intent_shown';

export function ExitIntentModal({ className = '' }: ExitIntentModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const alreadyShown = window.localStorage.getItem(STORAGE_KEY);
    if (alreadyShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setOpen(true);
        window.localStorage.setItem(STORAGE_KEY, '1');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">
          Before you go
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Get your first verdict free
        </h2>
        <p className="text-gray-600 mb-4 text-sm">
          Try Verdict on one decision—job offer, outfit, email, or profile—completely free. No
          credit card required.
        </p>

        <ul className="text-sm text-gray-700 space-y-1 mb-5">
          <li>• 3 expert opinions in under an hour</li>
          <li>• 100% anonymous & private</li>
          <li>• Money‑back guarantee if you’re not happy</li>
        </ul>

        <button
          onClick={() => {
            window.location.href = '/start';
          }}
          className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition min-h-[44px]"
        >
          Claim My Free Verdict
        </button>
      </div>
    </div>
  );
}