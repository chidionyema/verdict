/**
 * API Utilities for Production
 *
 * - Error handling wrapper
 * - Request timeout
 * - Standard error responses
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Fetch with automatic timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Standard error responses for API routes
 */
export const ApiError = {
  badRequest: (message = 'Bad request') =>
    NextResponse.json({ error: message }, { status: 400 }),

  unauthorized: (message = 'Unauthorized') =>
    NextResponse.json({ error: message }, { status: 401 }),

  forbidden: (message = 'Forbidden') =>
    NextResponse.json({ error: message }, { status: 403 }),

  notFound: (message = 'Not found') =>
    NextResponse.json({ error: message }, { status: 404 }),

  conflict: (message = 'Conflict') =>
    NextResponse.json({ error: message }, { status: 409 }),

  tooManyRequests: (message = 'Too many requests') =>
    NextResponse.json({ error: message }, { status: 429 }),

  internal: (message = 'Internal server error') =>
    NextResponse.json({ error: message }, { status: 500 }),
};

/**
 * Wrapper for API route handlers with error handling
 *
 * Usage:
 *   export const GET = withErrorHandling(async (req) => {
 *     // Your handler logic
 *     return NextResponse.json({ data });
 *   });
 */
export function withErrorHandling(
  handler: (req: Request, context?: any) => Promise<Response>
) {
  return async (req: Request, context?: any): Promise<Response> => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      // Log the full error server-side
      logger.error('API route error', error, {
        path: req.url,
        method: req.method,
      });

      // Return sanitized error to client
      if (error.message && error.message.includes('auth')) {
        return ApiError.unauthorized('Authentication required');
      }

      if (error.message && error.message.includes('permission')) {
        return ApiError.forbidden('Insufficient permissions');
      }

      // Default: Don't expose internal errors to client - provide helpful message
      return ApiError.internal('We encountered an unexpected error. Please try again or contact support if the problem persists.');
    }
  };
}

/**
 * Parse and validate JSON body
 */
export async function parseJsonBody<T = any>(req: Request): Promise<T | null> {
  try {
    const body = await req.json();
    return body as T;
  } catch (error) {
    logger.warn('Failed to parse JSON body', { error });
    return null;
  }
}

/**
 * Get user ID from request (assuming Supabase auth)
 */
export function getUserIdFromRequest(req: Request): string | null {
  // TODO: Extract from Supabase auth header
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  // This is simplified - actual implementation depends on your auth setup
  return null;
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields<T extends Record<string, any>>(
  body: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter((field) => !body[field]);

  return {
    valid: missing.length === 0,
    missing: missing as string[],
  };
}
