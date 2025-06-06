import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DependencyFactory } from './impl/factories/DependencyFactory';
import { ERROR_MAP, ErrorResponse, createErrorResponse } from './impl/middleware/errorHandler';
import { cloudflareAccessAuth } from './impl/middleware/cloudflareAccessAuth';
import { shareRoute } from './routes/shareRoute';

// Define environment interface
interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  CDN_DOMAIN: string;
}

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Add CORS middleware
app.use('*', cors());

// Add social sharing route
app.route('/share', shareRoute);

// Create API router for grouping routes under /api prefix
const api = new Hono<{ Bindings: Env }>();

// Set up API routes
api.post('/scan', async (c) => {
  // Create controller using factory
  const scanController = DependencyFactory.createScanController(c.env);
  
  // Handle request
  return scanController.handleScan(c);
});

// Add endpoint to fetch a report by hash
api.get('/report/:hash', async (c) => {
  // Create controller using factory
  const reportController = DependencyFactory.createReportController(c.env);
  
  // Handle request
  return reportController.handleFetchReport(c);
});

// Add endpoint to fetch paginated reports
api.get('/reports', async (c) => {
  // Create controller using factory
  const reportsController = DependencyFactory.createReportsController(c.env);
  
  // Handle request
  return reportsController.handleFetchReports(c);
});

// Add endpoint to delete a report
api.post('/report/delete', async (c) => {
  // Create controller using factory
  const deleteReportController = DependencyFactory.createDeleteReportController(c.env);
  
  // Handle request
  return deleteReportController.handleDeleteReport(c);
});

// Add admin stats endpoint with authentication middleware
// In development, we can enable devMode for easier testing
// For Cloudflare Workers, we can detect development mode based on hostname
api.get('/admin/stats', (c, next) => {
  // Check if running locally (localhost or 127.0.0.1)
  const host = c.req.header('host') || '';
  const isDevelopment = host.includes('localhost') || host.includes('127.0.0.1');
  return cloudflareAccessAuth({ devMode: isDevelopment })(c, next);
}, async (c) => {
  // Create controller using factory
  const adminStatsController = DependencyFactory.createAdminStatsController(c.env);
  
  // Handle request
  return adminStatsController.handleFetchStats(c);
});

// Add endpoint to serve images from R2
api.get('/images/:key', async (c) => {
  const key = c.req.param('key');
  const imagesBucket = c.env.IMAGES;
    
  try {
    // Get the image from R2
    const image = await imagesBucket.get(key);
    
    if (!image) {
      return c.json(createErrorResponse('NOT_FOUND', 'Image not found'), 404);
    }
    
    // Check if it's an SVG image by looking at the first few bytes
    const buffer = await image.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isTextBased = bytes[0] === 60; // '<' character in ASCII
    
    // Set appropriate content type and headers
    const headers = new Headers();
    if (isTextBased) {
      headers.set('Content-Type', 'image/svg+xml');
    } else {
      headers.set('Content-Type', 'image/png');
    }
    
    // Set cache control
    headers.set('Cache-Control', 'public, max-age=2592000'); // 30 days
    
    // Add CORS headers to allow embedding in other sites
    headers.set('Access-Control-Allow-Origin', '*');
    
    // Add Content-Disposition header to help browsers display the image
    headers.set('Content-Disposition', 'inline');
    
    // Add Content-Length header
    headers.set('Content-Length', buffer.byteLength.toString());
    
    return new Response(buffer, { headers });
  } catch (error) {
    console.error('Error serving image:', error);
    return c.json(createErrorResponse('INTERNAL_ERROR', 'Failed to serve image'), 500);
  }
});

app.onError((err, c) => {
  console.error('Application error:', err);
  
  const errorCode = err instanceof Error ? err.message : 'INTERNAL_ERROR';
  const errorInfo = ERROR_MAP[errorCode] || ERROR_MAP.INTERNAL_ERROR;
  const response: ErrorResponse = {
    error: errorInfo.message,
    code: errorCode
  };
  
  return c.json(response, errorInfo.status as 400 | 401 | 403 | 404 | 429 | 500 | 504);
});

// Add API routes to main app with /api prefix
app.route('/api', api);

// Export worker handler
export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
