/**
 * Simple logger utility for the application
 * Provides consistent logging format and levels
 */
export class Logger {
  /**
   * Log an informational message
   * @param context The context or component generating the log
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  static info(context: string, message: string, data?: Record<string, unknown>): void {
    console.log(`[INFO][${context}] ${message}`, data ? data : '');
  }

  /**
   * Log a warning message
   * @param context The context or component generating the log
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  static warn(context: string, message: string, data?: Record<string, unknown>): void {
    console.warn(`[WARN][${context}] ${message}`, data ? data : '');
  }

  /**
   * Log an error message
   * @param context The context or component generating the log
   * @param message The message to log
   * @param error Optional error object to include in the log
   */
  static error(context: string, message: string, error?: Error | unknown): void {
    console.error(`[ERROR][${context}] ${message}`, error ? error : '');
  }

  /**
   * Log an access attempt to a protected resource
   * @param context The context or component generating the log
   * @param resource The resource being accessed
   * @param email The email of the user attempting access
   * @param success Whether the access attempt was successful
   */
  static access(context: string, resource: string, email: string | null, success: boolean): void {
    const status = success ? 'SUCCESS' : 'DENIED';
    console.log(`[ACCESS][${context}][${status}] ${resource} by ${email || 'unknown'}`);
  }
}
