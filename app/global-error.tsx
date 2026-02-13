'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  
  useEffect(() => {
    // Log error to console (Better Stack captures server-side)
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            maxWidth: '500px',
            width: '100%',
          }}>
            <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#111827' }}>
              We Hit a Snag
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
              An unexpected error occurred. This might be a temporary issue with our servers. Our team has been automatically notified. You can try refreshing the page or going back to continue using Verdict.
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
            }}>
              <button
                onClick={() => reset()}
                style={{
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  width: '100%',
                }}
              >
                Try again
              </button>
              <button
                onClick={() => router.push('/')}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '12px 24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  width: '100%',
                }}
              >
                Go Home
              </button>
              <button
                onClick={() => router.back()}
                style={{
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '400',
                  width: '100%',
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
