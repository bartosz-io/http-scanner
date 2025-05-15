import { Hono } from 'hono';
import { DependencyFactory } from '../impl/factories/DependencyFactory';
import { PublicReportDTO } from '../../src/types';

// Define environment interface
interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  CDN_DOMAIN: string;
}

/**
 * Route for social media sharing with proper OG metadata
 * This endpoint provides an HTML page with Open Graph tags for proper LinkedIn/Twitter previews
 */
export const shareRoute = new Hono<{ Bindings: Env }>();

shareRoute.get('/:hash', async (c) => {
  const hash = c.req.param('hash');
  
  try {
    // Create report controller using factory
    const reportController = DependencyFactory.createReportController(c.env);
    
    // Get the report data
    const reportResponse = await reportController.handleFetchReport(c);
    const reportData = await reportResponse.json() as PublicReportDTO;
    
    // Check if the report was found
    if (reportResponse.status !== 200) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>HTTP Scanner - Report Not Found</title>
            <meta http-equiv="refresh" content="0;url=/">
          </head>
          <body>
            <p>Redirecting to home page...</p>
          </body>
        </html>
      `);
    }
    
    // Extract the data needed for OG metadata
    const { url, score, share_image_url } = reportData;
    const roundedScore = Math.round(score);
    
    // Generate OG metadata and HTML for social platforms
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${url} scored ${roundedScore}/100 on HTTP Scanner</title>
          
          <!-- Essential Open Graph metadata -->
          <meta property="og:title" content="${url} scored ${roundedScore}/100 on HTTP Scanner" />
          <meta property="og:description" content="Check how your website performs on HTTP security headers with HTTP Scanner" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="${c.req.url}" />
          ${share_image_url ? `<meta property="og:image" content="${share_image_url}" />` : ''}
          
          <!-- Twitter Card metadata -->
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${url} scored ${roundedScore}/100 on HTTP Scanner">
          <meta name="twitter:description" content="Check how your website performs on HTTP security headers with HTTP Scanner">
          ${share_image_url ? `<meta name="twitter:image" content="${share_image_url}" />` : ''}
          
          <!-- LinkedIn specific -->
          <meta property="og:site_name" content="HTTP Scanner" />
          
          <!-- Redirect to the hash-based URL after metadata is picked up -->
          <meta http-equiv="refresh" content="0;url=/#/report/${hash}">
          
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f9fafb;
              color: #111827;
            }
            div {
              text-align: center;
              padding: 2rem;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              background-color: white;
            }
            h1 {
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 1rem;
            }
            p {
              margin-bottom: 1.5rem;
            }
            a {
              text-decoration: none;
              color: #3b82f6;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div>
            <h1>${url} scored ${roundedScore}/100 on HTTP Scanner</h1>
            <p>Redirecting to full report...</p>
            <p>If you are not redirected automatically, <a href="/#/report/${hash}">click here</a>.</p>
          </div>
        </body>
      </html>
    `;
    
    return c.html(html);
  } catch (error) {
    console.error('Error generating social share page:', error);
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HTTP Scanner - Error</title>
          <meta http-equiv="refresh" content="3;url=/">
        </head>
        <body>
          <p>An error occurred. Redirecting to home page...</p>
        </body>
      </html>
    `, 500);
  }
});
