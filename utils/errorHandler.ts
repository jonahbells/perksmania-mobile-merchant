import { AxiosError } from 'axios';

// Error types enum
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Enhanced error interface
export interface EnhancedError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  originalError?: any;
  statusCode?: number;
  canRetry: boolean;
  shouldShowNotification: boolean;
  shouldLog: boolean;
  context?: Record<string, any>;
  timestamp: Date;
}

// Network error detection patterns
const NETWORK_ERROR_PATTERNS = [
  'network error',
  'network request failed',
  'failed to fetch',
  'fetch error',
  'connection error',
  'no internet',
  'offline',
  'net::err_internet_disconnected',
  'net::err_name_not_resolved',
  'net::err_network_changed',
];

const TIMEOUT_ERROR_PATTERNS = [
  'timeout',
  'request timeout',
  'econnaborted',
  'etimedout',
  'request timed out',
];

// User-friendly error messages
const USER_FRIENDLY_MESSAGES = {
  [ErrorType.NETWORK_ERROR]: {
    title: 'Connection Issue',
    message: 'Unable to connect to the internet. Please check your connection and try again.',
    action: 'Retry',
  },
  [ErrorType.TIMEOUT_ERROR]: {
    title: 'Request Timeout',
    message: 'The request is taking too long. Please try again.',
    action: 'Retry',
  },
  [ErrorType.SERVER_ERROR]: {
    title: 'Server Issue',
    message: 'Our servers are experiencing issues. Please try again later.',
    action: 'Retry',
  },
  [ErrorType.AUTHENTICATION_ERROR]: {
    title: 'Authentication Required',
    message: 'Please sign in to continue.',
    action: 'Sign In',
  },
  [ErrorType.AUTHORIZATION_ERROR]: {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.',
    action: 'OK',
  },
  [ErrorType.VALIDATION_ERROR]: {
    title: 'Invalid Data',
    message: 'Please check your input and try again.',
    action: 'OK',
  },
  [ErrorType.NOT_FOUND_ERROR]: {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    action: 'OK',
  },
  [ErrorType.RATE_LIMIT_ERROR]: {
    title: 'Too Many Requests',
    message: 'You\'re making requests too quickly. Please wait a moment and try again.',
    action: 'OK',
  },
  [ErrorType.UNKNOWN_ERROR]: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    action: 'Retry',
  },
};

/**
 * Analyzes an error and categorizes it for better handling
 */
export function analyzeError(error: any, context?: Record<string, any>): EnhancedError {
  const timestamp = new Date();
  let type = ErrorType.UNKNOWN_ERROR;
  let severity = ErrorSeverity.MEDIUM;
  let statusCode: number | undefined;
  let originalMessage = '';
  let canRetry = true;
  let shouldShowNotification = true;
  let shouldLog = true;

  // Handle Axios errors
  if (error?.isAxiosError || error?.response || error?.request) {
    const axiosError = error as AxiosError;
    statusCode = axiosError.response?.status;
    originalMessage = axiosError.message || '';

    // Check for network errors
    if (!axiosError.response && axiosError.request) {
      // Request was made but no response received
      if (isNetworkError(originalMessage)) {
        type = ErrorType.NETWORK_ERROR;
        severity = ErrorSeverity.HIGH;
        canRetry = true;
      } else if (isTimeoutError(originalMessage)) {
        type = ErrorType.TIMEOUT_ERROR;
        severity = ErrorSeverity.MEDIUM;
        canRetry = true;
      } else {
        type = ErrorType.NETWORK_ERROR; // Default to network error for no response
        severity = ErrorSeverity.HIGH;
        canRetry = true;
      }
    } else if (axiosError.response) {
      // Server responded with error status
      switch (statusCode) {
        case 400:
          type = ErrorType.VALIDATION_ERROR;
          severity = ErrorSeverity.LOW;
          canRetry = false;
          break;
        case 401:
          type = ErrorType.AUTHENTICATION_ERROR;
          severity = ErrorSeverity.HIGH;
          canRetry = false;
          shouldShowNotification = true;
          break;
        case 403:
          type = ErrorType.AUTHORIZATION_ERROR;
          severity = ErrorSeverity.MEDIUM;
          canRetry = false;
          break;
        case 404:
          type = ErrorType.NOT_FOUND_ERROR;
          severity = ErrorSeverity.LOW;
          canRetry = false;
          break;
        case 429:
          type = ErrorType.RATE_LIMIT_ERROR;
          severity = ErrorSeverity.MEDIUM;
          canRetry = true;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          type = ErrorType.SERVER_ERROR;
          severity = ErrorSeverity.HIGH;
          canRetry = true;
          break;
        default:
          if (statusCode >= 500) {
            type = ErrorType.SERVER_ERROR;
            severity = ErrorSeverity.HIGH;
            canRetry = true;
          } else if (statusCode >= 400) {
            type = ErrorType.VALIDATION_ERROR;
            severity = ErrorSeverity.LOW;
            canRetry = false;
          }
      }

      // Extract error message from response
      const responseData = axiosError.response.data;
      if (typeof responseData === 'string') {
        originalMessage = responseData;
      } else if (responseData?.message) {
        originalMessage = responseData.message;
      } else if (responseData?.error) {
        originalMessage = responseData.error;
      }
    }
  } else {
    // Handle non-axios errors
    originalMessage = error?.message || error?.toString() || 'Unknown error';

    if (isNetworkError(originalMessage)) {
      type = ErrorType.NETWORK_ERROR;
      severity = ErrorSeverity.HIGH;
      canRetry = true;
    } else if (isTimeoutError(originalMessage)) {
      type = ErrorType.TIMEOUT_ERROR;
      severity = ErrorSeverity.MEDIUM;
      canRetry = true;
    }
  }

  const userFriendlyMessage = USER_FRIENDLY_MESSAGES[type];

  return {
    type,
    severity,
    message: originalMessage,
    userMessage: userFriendlyMessage.message,
    originalError: error,
    statusCode,
    canRetry,
    shouldShowNotification,
    shouldLog,
    context,
    timestamp,
  };
}

/**
 * Checks if an error message indicates a network connectivity issue
 */
function isNetworkError(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return NETWORK_ERROR_PATTERNS.some(pattern => lowerMessage.includes(pattern));
}

/**
 * Checks if an error message indicates a timeout issue
 */
function isTimeoutError(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return TIMEOUT_ERROR_PATTERNS.some(pattern => lowerMessage.includes(pattern));
}

/**
 * Gets user-friendly error information for display
 */
export function getUserFriendlyErrorInfo(error: EnhancedError) {
  const info = USER_FRIENDLY_MESSAGES[error.type];
  
  return {
    title: info.title,
    message: error.userMessage || info.message,
    action: info.action,
    canRetry: error.canRetry,
    severity: error.severity,
  };
}

/**
 * Generates a unique error ID for tracking
 */
export function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Logs error information for debugging
 */
export function logError(error: EnhancedError, errorId?: string) {
  if (!error.shouldLog) return;

  const logData = {
    id: errorId || generateErrorId(),
    type: error.type,
    severity: error.severity,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: error.timestamp.toISOString(),
    context: error.context,
    originalError: error.originalError,
  };

  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      console.error('[CRITICAL ERROR]', logData);
      break;
    case ErrorSeverity.HIGH:
      console.error('[HIGH ERROR]', logData);
      break;
    case ErrorSeverity.MEDIUM:
      console.warn('[MEDIUM ERROR]', logData);
      break;
    case ErrorSeverity.LOW:
      console.log('[LOW ERROR]', logData);
      break;
  }
}

/**
 * Determines if an error should trigger a retry queue entry
 */
export function shouldQueueForRetry(error: EnhancedError): boolean {
  return error.canRetry && (
    error.type === ErrorType.NETWORK_ERROR ||
    error.type === ErrorType.TIMEOUT_ERROR ||
    error.type === ErrorType.SERVER_ERROR
  );
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: any, context?: Record<string, any>) {
  const enhancedError = analyzeError(error, context);
  const errorId = generateErrorId();
  
  logError(enhancedError, errorId);
  
  return {
    error: enhancedError,
    errorId,
    userInfo: getUserFriendlyErrorInfo(enhancedError),
  };
}
