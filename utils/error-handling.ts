import { ApiError } from '@/lib/enhanced-api-client';

/**
 * Shared error details
 */
export interface ErrorDetails {
  message: string;
  code?: string;
  status?: number;
  field?: string;
  suggestions?: string[];
}

/**
 * Custom application error wrapper
 */
export class AppError extends Error {
  public code?: string;
  public status?: number;
  public field?: string;
  public suggestions?: string[];
  public isRetryable: boolean;

  constructor(
    message: string,
    code?: string,
    status?: number,
    field?: string,
    suggestions?: string[],
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.field = field;
    this.suggestions = suggestions;
    this.isRetryable = isRetryable;
  }
}

/**
 * Convert any error into a standardized AppError
 */
export function parseApiError(error: unknown): AppError {
  if (error instanceof ApiError) {
    return new AppError(
      error.message,
      error.code ?? 'API_ERROR',
      error.status ?? 500,
      undefined,
      getErrorSuggestions(error),
      isRetryableError(error)
    );
  }

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      undefined,
      undefined,
      ['Please try again or contact support if the problem persists'],
      false
    );
  }

  if (typeof error === 'string') {
    return new AppError(
      error,
      'STRING_ERROR',
      undefined,
      undefined,
      ['Please try again or contact support'],
      false
    );
  }

  return new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    undefined,
    undefined,
    ['Please try again or contact support'],
    false
  );
}

/**
 * Suggest recovery actions depending on error type/status
 */
export function getErrorSuggestions(error: ApiError): string[] {
  const suggestions: string[] = [];

  switch (error.status) {
    case 400:
      suggestions.push('Please check your input and try again');
      break;
    case 401:
      suggestions.push('Please log in again');
      break;
    case 403:
      suggestions.push('You do not have permission to perform this action');
      break;
    case 404:
      suggestions.push('The requested resource was not found');
      break;
    case 409:
      suggestions.push('This resource already exists or conflicts with existing data');
      break;
    case 422:
      suggestions.push('Please check your input format and try again');
      break;
    case 429:
      suggestions.push('Too many requests. Please wait a moment and try again');
      break;
    case 500:
      suggestions.push('Server error. Please try again later');
      break;
    case 502:
    case 503:
    case 504:
      suggestions.push('Service temporarily unavailable. Please try again later');
      break;
    default:
      if (error.code === 'NETWORK_ERROR') {
        suggestions.push('Check your internet connection');
        suggestions.push('Try refreshing the page');
      } else {
        suggestions.push('Please try again or contact support');
      }
  }

  return suggestions;
}

/**
 * Decide if error can be retried
 */
export function isRetryableError(error: ApiError): boolean {
  if (error.code === 'NETWORK_ERROR') return true;
  if (error.status && error.status >= 500) return true;
  if (error.status === 429) return true;
  if ([502, 503, 504].includes(error.status ?? 0)) return true;
  return false;
}

/**
 * Get a friendly user-facing error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

/**
 * Get a friendly error title
 */
export function getErrorTitle(error: unknown): string {
  const parsed = parseApiError(error);

  switch (parsed.status) {
    case 400: return 'Invalid Request';
    case 401: return 'Authentication Required';
    case 403: return 'Access Denied';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Validation Error';
    case 429: return 'Too Many Requests';
    case 500: return 'Server Error';
    case 502:
    case 503:
    case 504: return 'Service Unavailable';
    default: return 'Error';
  }
}

/**
 * Should UI show a retry button
 */
export function shouldShowRetryButton(error: unknown): boolean {
  const parsed = parseApiError(error);
  return parsed.isRetryable;
}

/**
 * Retry delay logic
 */
export function getRetryDelay(error: unknown): number {
  const parsed = parseApiError(error);

  if (parsed.status === 429) return 5000; // rate limiting
  if (typeof parsed.status === 'number' && parsed.status >= 500) return 2000; // server errors
  return 1000; // default fast retry
}

/**
 * Simple form validation helpers
 */
export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters long';
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} is required`;
  return null;
}

/**
 * Async wrapper with unified error handling
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  errorHandler?: (error: AppError) => void
): Promise<T | null> {
  try {
    return await asyncFn();
  } catch (error) {
    const appError = parseApiError(error);
    if (errorHandler) errorHandler(appError);
    return null;
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;

      const parsed = parseApiError(error);

      if (attempt === maxRetries) throw parsed;
      if (!parsed.isRetryable) throw parsed;

      const delay = getRetryDelay(parsed) * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}