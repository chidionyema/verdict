/**
 * Security-focused input validation and sanitization
 */
import { log } from '@/lib/logger';

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /(\b(OR|AND)\b.*=.*)/gi,
  /(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\(/gi,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /<img[^>]+src[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%252e%252e%252f/gi,
];

// Command injection patterns
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$()]/g,
  /\${.*}/g,
  /`.*`/g,
];

interface ValidationResult {
  valid: boolean;
  sanitized?: string;
  threats?: string[];
  error?: string;
}

/**
 * Comprehensive input validation and sanitization
 */
export function validateAndSanitizeInput(input: string, context: 'text' | 'email' | 'url' | 'filename' | 'json' = 'text'): ValidationResult {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  const threats: string[] = [];
  let sanitized = input;

  // Length validation
  const maxLengths = {
    text: 10000,
    email: 255,
    url: 2048,
    filename: 255,
    json: 50000
  };

  if (input.length > maxLengths[context]) {
    return { 
      valid: false, 
      error: `Input too long. Maximum ${maxLengths[context]} characters allowed.` 
    };
  }

  // Check for SQL injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push('SQL_INJECTION');
      log.warn('SQL injection attempt detected', { input: input.substring(0, 100) });
      break;
    }
  }

  // Check for XSS
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      threats.push('XSS');
      log.warn('XSS attempt detected', { input: input.substring(0, 100) });
      // Sanitize XSS
      sanitized = sanitized.replace(pattern, '');
      break;
    }
  }

  // Check for path traversal
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(input)) {
      threats.push('PATH_TRAVERSAL');
      log.warn('Path traversal attempt detected', { input: input.substring(0, 100) });
      sanitized = sanitized.replace(pattern, '');
      break;
    }
  }

  // Check for command injection
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push('COMMAND_INJECTION');
      log.warn('Command injection attempt detected', { input: input.substring(0, 100) });
      sanitized = sanitized.replace(pattern, '');
      break;
    }
  }

  // Context-specific validation
  switch (context) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitized)) {
        return { valid: false, error: 'Invalid email format' };
      }
      break;

    case 'url':
      try {
        new URL(sanitized);
      } catch {
        return { valid: false, error: 'Invalid URL format' };
      }
      break;

    case 'filename':
      const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
      if (!fileNameRegex.test(sanitized)) {
        sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
      }
      break;

    case 'json':
      try {
        JSON.parse(sanitized);
      } catch {
        return { valid: false, error: 'Invalid JSON format' };
      }
      break;
  }

  // Block if critical threats found
  if (threats.includes('SQL_INJECTION') || threats.includes('COMMAND_INJECTION')) {
    return {
      valid: false,
      error: 'Input contains potentially malicious content',
      threats
    };
  }

  // Additional sanitization
  sanitized = sanitized
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();

  return {
    valid: true,
    sanitized,
    threats: threats.length > 0 ? threats : undefined
  };
}

/**
 * Validate request body structure
 */
export function validateRequestBody(body: any, requiredFields: string[], allowedFields?: string[]): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in body) || body[field] === null || body[field] === undefined) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // Check for extra fields (if allowedFields specified)
  if (allowedFields) {
    const bodyFields = Object.keys(body);
    for (const field of bodyFields) {
      if (!allowedFields.includes(field)) {
        return { valid: false, error: `Unexpected field: ${field}` };
      }
    }
  }

  // Validate each field
  const threats: string[] = [];
  const sanitizedBody: any = {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      const validation = validateAndSanitizeInput(value, 'text');
      if (!validation.valid) {
        return { valid: false, error: `Invalid field ${key}: ${validation.error}` };
      }
      sanitizedBody[key] = validation.sanitized;
      if (validation.threats) {
        threats.push(...validation.threats.map(t => `${key}:${t}`));
      }
    } else {
      sanitizedBody[key] = value;
    }
  }

  return {
    valid: true,
    sanitized: sanitizedBody,
    threats: threats.length > 0 ? threats : undefined
  };
}

/**
 * Rate limiting by user and IP
 */
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();

export function checkSecurityRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const window = rateLimitStore.get(identifier);

  if (!window || now - window.lastReset > windowMs) {
    rateLimitStore.set(identifier, { count: 1, lastReset: now });
    return true;
  }

  if (window.count >= maxAttempts) {
    return false;
  }

  window.count++;
  return true;
}

/**
 * Audit security events
 */
export function auditSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  log.warn(`Security event: ${event}`, {
    event,
    severity,
    details,
    timestamp: new Date().toISOString()
  });

  // For critical events, could trigger immediate alerts
  if (severity === 'critical') {
    // TODO: Implement real-time alerting
    console.error(`CRITICAL SECURITY EVENT: ${event}`, details);
  }
}