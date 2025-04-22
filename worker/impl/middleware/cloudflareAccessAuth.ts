import { MiddlewareHandler } from 'hono';
import { createErrorResponse } from './errorHandler';
import { Logger } from '../utils/Logger';

/**
 * Middleware to verify Cloudflare Access authentication
 * This middleware checks for the presence of Cloudflare Access headers
 * and validates that the request is coming from an authenticated user
 * @param options Configuration options for the middleware
 */
export const cloudflareAccessAuth = (options: { devMode?: boolean } = {}): MiddlewareHandler => async (c, next) => {
  // In development mode, bypass authentication
  if (options.devMode) {
    // Set a default admin email for development
    c.set('authenticatedEmail', 'dev-admin@example.com');
    Logger.warn('CloudflareAccess', 'Authentication bypassed in development mode');
    return await next();
  }
  // Get the requested path for logging
  const requestPath = c.req.path;
  
  // Cloudflare Access sets these headers when a request is authenticated
  const cfAccessJwt = c.req.header('Cf-Access-Jwt-Assertion');
  const cfAccessEmail = c.req.header('Cf-Access-Authenticated-User-Email');
  
  // If the headers are missing, the request is not authenticated
  if (!cfAccessJwt || !cfAccessEmail) {
    // Log the failed access attempt
    Logger.access('CloudflareAccess', requestPath, null, false);
    
    c.header('Content-Type', 'application/json');
    return c.json(
      createErrorResponse('UNAUTHORIZED', 'Authentication required'),
      401
    );
  }
  
  // In a production environment, you would validate the JWT token here
  // For now, we'll just check that the headers exist
  
  // Log the successful access attempt
  Logger.access('CloudflareAccess', requestPath, cfAccessEmail, true);
  
  // Add the authenticated user's email to the context for logging
  c.set('authenticatedEmail', cfAccessEmail);
  
  // Continue to the next middleware or route handler
  await next();
};
