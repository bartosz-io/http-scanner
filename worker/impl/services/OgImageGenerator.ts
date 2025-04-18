import { ImageResponse } from 'workers-og';

/**
 * Service responsible for generating Open Graph images using workers-og
 */
export class OgImageGenerator {
  /**
   * Creates an OG image using workers-og
   * @param domain The domain name
   * @param scoreText The score text to display
   * @param scoreColor The color of the score circle
   * @returns Promise with image buffer
   */
  async createImage(domain: string, scoreText: string, scoreColor: string): Promise<Uint8Array | null> {
    try {
      console.log(`[OgImageGenerator] Creating OG image with workers-og`);
      
      // Create a date string for the footer
      const dateString = new Date().toISOString().split('T')[0];
      
      // Generate OG image using workers-og
      const html = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100vw; height: 100vh; background-color: #1E293B; padding: 40px; box-sizing: border-box;">
          <div style="display: flex; flex-direction: column; width: 100%; color: white; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;">
            <h1 style="font-size: 48px; font-weight: 700; margin: 0 0 20px 0;">HTTP Scanner</h1>
            
            <div style="display: flex; flex-direction: column; margin-bottom: 30px;">
              <h2 style="font-size: 36px; font-weight: 400; margin: 0 0 10px 0;">Domain:</h2>
              <p style="font-size: 48px; font-weight: 700; margin: 0; word-break: break-all;">${domain}</p>
            </div>
            
            <div style="display: flex; flex-direction: column; margin-bottom: 30px;">
              <h2 style="font-size: 36px; font-weight: 400; margin: 0 0 10px 0;">Security Score:</h2>
              <div style="display: flex; align-items: center; justify-content: center; width: 160px; height: 160px; border-radius: 80px; background-color: ${scoreColor}; font-size: 48px; font-weight: 700; color: white;">
                ${scoreText}
              </div>
            </div>
            
            <div style="display: flex; margin-top: auto;">
              <p style="font-size: 24px; color: #94A3B8; margin: 0;">Scan performed on ${dateString}</p>
            </div>
          </div>
        </div>
      `;
      
      console.log('[OgImageGenerator] Creating image response with system fonts');
      const imageResponse = new ImageResponse(html, {
        width: 1200,
        height: 630,
      });
      
      if (!imageResponse) {
        console.error('[OgImageGenerator] Failed to generate OG image');
        return null;
      }
      
      // Convert the response to a buffer
      const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
      console.log(`[OgImageGenerator] Created OG image buffer with size: ${imageBuffer.length} bytes`);
      
      return imageBuffer;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[OgImageGenerator] Error creating OG image: ${errorMessage}`);
      return null;
    }
  }
}
