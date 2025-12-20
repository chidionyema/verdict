/**
 * Environment variable validation for production deployments
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const optionalEnvVars = [
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'RESEND_API_KEY',
] as const;

export function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] || process.env[envVar]?.startsWith('placeholder')) {
      missing.push(envVar);
    }
  }

  // Check optional but recommended variables
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please configure these variables in your deployment settings.`
    );
    error.name = 'EnvironmentError';
    throw error;
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn(
      `Warning: Optional environment variables not configured: ${warnings.join(', ')}\n` +
      `Some features may not work correctly.`
    );
  }

  return {
    valid: true,
    missing,
    warnings,
  };
}

// Validate environment on import in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    // Don't throw in production to allow build to complete
  }
}