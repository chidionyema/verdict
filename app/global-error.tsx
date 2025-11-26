'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
            maxWidth: '400px',
          }}>
            <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#111827' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
              We apologize for the inconvenience. Our team has been notified and is working on a fix.
            </p>
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
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
