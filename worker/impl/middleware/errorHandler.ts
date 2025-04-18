import { MiddlewareHandler } from 'hono';

export interface ErrorResponse {
  error: string;
  code: string;
}

/**
 * Error codes and their corresponding HTTP status codes and messages
 */
export const ERROR_MAP: Record<string, { status: number; message: string }> = {
  INVALID_URL: { status: 400, message: 'Invalid URL format or protocol not supported' },
  RATE_LIMIT_EXCEEDED: { status: 429, message: 'Rate limit exceeded: This domain was scanned in the last minute' },
  SCAN_TIMEOUT: { status: 504, message: 'Scan timed out after 45 seconds' },
  INTERNAL_ERROR: { status: 500, message: 'An internal error occurred' }
};

/**
 * Error handling middleware for the API
 */
export const errorHandler = (): MiddlewareHandler => async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error('API Error:', error);
    
    const errorCode = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const errorInfo = ERROR_MAP[errorCode] || ERROR_MAP.INTERNAL_ERROR;
    
    // Explicitly set content type to ensure proper JSON response
    c.header('Content-Type', 'application/json');
    
    const response: ErrorResponse = {
      error: errorInfo.message,
      code: errorCode
    };
    
    return c.json(response, errorInfo.status as 400 | 401 | 403 | 404 | 429 | 500 | 504);
  }
};

/**
 * Helper function to create a standardized error response
 * This can be used directly in route handlers that don't use middleware
 * @param errorCode Error code from ERROR_MAP
 * @param customMessage Optional custom error message to override the default
 */
export function createErrorResponse(errorCode: string, customMessage?: string): ErrorResponse {
  const errorInfo = ERROR_MAP[errorCode] || ERROR_MAP.INTERNAL_ERROR;
  return {
    error: customMessage || errorInfo.message,
    code: errorCode
  };
}
