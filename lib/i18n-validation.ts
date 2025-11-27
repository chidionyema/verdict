import { type Locale } from '@/i18n.config';

/**
 * Internationalized validation messages
 * These messages are used for both client and server-side validation
 */

// Validation message keys that match the translation files
export type ValidationMessageKey =
  | 'required'
  | 'email'
  | 'minLength'
  | 'maxLength'
  | 'passwordMismatch'
  | 'invalidContent'
  | 'imageTooLarge'
  | 'invalidFormat';

// Error message keys
export type ErrorMessageKey =
  | 'notLoggedIn'
  | 'apiError'
  | 'networkError'
  | 'unauthorized'
  | 'notFound'
  | 'serverError'
  | 'validationError'
  | 'paymentFailed'
  | 'uploadFailed'
  | 'sessionExpired';

/**
 * Get validation message for a specific locale
 * This is a server-side function that loads messages directly
 */
export async function getValidationMessage(
  key: ValidationMessageKey,
  locale: Locale,
  params?: Record<string, string | number>
): Promise<string> {
  const messages = await import(`@/messages/${locale}.json`);
  let message = messages.Validation[key] || key;

  // Replace placeholders like {min}, {max}, {size}
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      message = message.replace(`{${paramKey}}`, String(value));
    });
  }

  return message;
}

/**
 * Get error message for a specific locale
 */
export async function getErrorMessage(
  key: ErrorMessageKey,
  locale: Locale
): Promise<string> {
  const messages = await import(`@/messages/${locale}.json`);
  return messages.Errors[key] || key;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    messageKey: ValidationMessageKey;
    params?: Record<string, string | number>;
  }>;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate minimum length
 */
export function validateMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

/**
 * Validate maximum length
 */
export function validateMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/**
 * Validate required field
 */
export function validateRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Content validation for inappropriate words
 * This uses the existing banned words list from validations.ts
 */
export function validateContent(content: string, bannedWords: string[]): boolean {
  const lowerContent = content.toLowerCase();
  return !bannedWords.some(word => lowerContent.includes(word.toLowerCase()));
}

/**
 * Image size validation
 */
export function validateImageSize(sizeInBytes: number, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeInBytes <= maxSizeBytes;
}

/**
 * File format validation
 */
export function validateFileFormat(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
}

/**
 * Create a validation result builder
 */
export function createValidator(): {
  addError: (field: string, messageKey: ValidationMessageKey, params?: Record<string, string | number>) => void;
  isValid: () => boolean;
  getResult: () => ValidationResult;
} {
  const errors: ValidationResult['errors'] = [];

  return {
    addError(field, messageKey, params) {
      errors.push({ field, messageKey, params });
    },
    isValid() {
      return errors.length === 0;
    },
    getResult() {
      return {
        valid: errors.length === 0,
        errors,
      };
    },
  };
}

/**
 * Format validation errors for API response
 */
export async function formatValidationErrors(
  result: ValidationResult,
  locale: Locale
): Promise<Array<{ field: string; message: string }>> {
  const formatted = await Promise.all(
    result.errors.map(async (error) => ({
      field: error.field,
      message: await getValidationMessage(error.messageKey, locale, error.params),
    }))
  );

  return formatted;
}
