import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/my-requests',
  '/requests',
  '/results',
  '/waiting',
  '/account',
  '/reviewer',
  '/become-reviewer',
  '/start',
  '/success',
];

// Routes that require admin access
const ADMIN_ROUTES = ['/admin'];

// Routes that require reviewer access
const REVIEWER_ROUTES = ['/reviewer/dashboard', '/reviewer/feedback', '/reviewer/my-feedback', '/reviewer/performance'];

// Auth pages
const AUTH_ROUTES = ['/auth/login', '/auth/signup'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Note: Reverted judge→reviewer migration due to incomplete implementation

  // Apply rate limiting to API routes and sensitive endpoints
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/auth/') ||
      pathname.includes('/upload')) {
    
    const rateLimitResult = await checkRateLimit(request);
    
    if (!rateLimitResult.success) {
      const retryAfter = rateLimitResult.reset 
        ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        : 60;
      
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: rateLimitResult.reason || 'Rate limit exceeded. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '60',
            'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }
  }

  let response = NextResponse.next({ request });

  // Add comprehensive security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Response-Time', Date.now().toString());
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https://api.stripe.com https://api.openai.com https://*.supabase.co https://vitals.vercel-insights.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // Add cache headers for static assets
  if (pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    // Never allow wildcard CORS in production - require APP_URL to be configured
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;
    if (!allowedOrigin) {
      console.error('NEXT_PUBLIC_APP_URL not configured - CORS will be restrictive');
    }
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin || 'null');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  // Create Supabase client - fallback for when env vars aren't set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });

          // Reapply headers after creating new response
          response.headers.set('X-DNS-Prefetch-Control', 'on');
          response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
          response.headers.set('X-Frame-Options', 'DENY');
          response.headers.set('X-Content-Type-Options', 'nosniff');
          response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          response.headers.set('X-Response-Time', Date.now().toString());

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session and get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check route type
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isReviewerRoute = REVIEWER_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Check admin access
  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Check reviewer access for reviewer-specific routes
  if (isReviewerRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_reviewer')
      .eq('id', user.id)
      .single();

    if (!profile?.is_reviewer) {
      const url = request.nextUrl.clone();
      url.pathname = '/become-reviewer';
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
