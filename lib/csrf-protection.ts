/**
 * CSRF Protection for API Routes
 *
 * Validates that requests come from allowed origins using Origin/Referer headers.
 * This is a defense-in-depth measure alongside SameSite cookies.
 */
import { NextRequest } from 'next/server';
import { log } from '@/lib/logger';

// Allowed origins - should match your domain(s)
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Add configured app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  // Add localhost for development
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:3000');
  }

  // Add Vercel preview URLs pattern
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  return origins;
};

interface CSRFValidationResult {
  valid: boolean;
  error?: string;
  origin?: string;
}

/**
 * Validate CSRF by checking Origin/Referer headers
 * @param request - The incoming request
 * @returns Validation result
 */
export function validateCSRF(request: NextRequest): CSRFValidationResult {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // For same-origin requests, origin header might not be present
  // In that case, check the referer
  const requestOrigin = origin || (referer ? new URL(referer).origin : null);

  if (!requestOrigin) {
    // No origin/referer - could be a direct API call
    // For strict security, reject. For flexibility, you might allow with other checks.
    log.warn('CSRF: Request missing Origin/Referer headers', {
      method: request.method,
      url: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent')
    });

    // Allow requests without origin if they have a valid auth cookie
    // This handles mobile apps and legitimate API clients
    const hasAuthCookie = request.cookies.has('sb-access-token') ||
                          request.cookies.has('sb-refresh-token');

    if (hasAuthCookie) {
      return { valid: true, origin: 'cookie-auth' };
    }

    return {
      valid: false,
      error: 'Missing origin header'
    };
  }

  const allowedOrigins = getAllowedOrigins();

  // Check if origin is allowed
  const isAllowed = allowedOrigins.some(allowed => {
    // Exact match
    if (requestOrigin === allowed) return true;

    // Allow Vercel preview deployments
    if (requestOrigin.includes('.vercel.app') && process.env.VERCEL) return true;

    return false;
  });

  if (!isAllowed) {
    log.warn('CSRF: Request from disallowed origin', {
      origin: requestOrigin,
      allowedOrigins,
      method: request.method,
      url: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent')
    });

    return {
      valid: false,
      error: 'Invalid origin',
      origin: requestOrigin
    };
  }

  return { valid: true, origin: requestOrigin };
}

/**
 * Higher-order function to wrap route handlers with CSRF protection
 * @param handler - The route handler to wrap
 * @param options - Configuration options
 */
export function withCSRFProtection<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>,
  options: {
    strict?: boolean;  // If true, reject all requests without valid origin
    logOnly?: boolean; // If true, log but don't block (for testing)
  } = {}
): (request: NextRequest, ...args: any[]) => Promise<T | Response> {
  return async (request: NextRequest, ...args: any[]) => {
    // Only check CSRF for state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const csrfResult = validateCSRF(request);

      if (!csrfResult.valid) {
        if (options.logOnly) {
          log.warn('CSRF validation failed (log-only mode)', {
            error: csrfResult.error,
            origin: csrfResult.origin,
            url: request.nextUrl.pathname
          });
        } else if (options.strict) {
          log.error('CSRF validation failed - request blocked', null, {
            error: csrfResult.error,
            origin: csrfResult.origin,
            url: request.nextUrl.pathname
          });

          return new Response(
            JSON.stringify({ error: 'CSRF validation failed' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    return handler(request, ...args);
  };
}
