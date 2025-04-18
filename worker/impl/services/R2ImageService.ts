import { ImageService as ImageServiceInterface } from '../../interfaces/services/ImageService';
import { OgImageGenerator } from './OgImageGenerator';

export class ImageService implements ImageServiceInterface {
  private readonly imageGenerator: OgImageGenerator;

  constructor(private readonly r2Bucket: R2Bucket) {
    this.imageGenerator = new OgImageGenerator();
  }

  async generateShareImage(hash: string, url: string, score: number): Promise<string | null> {
    try {
      const timestamp = Date.now();
      const imageKey = `${hash}_${timestamp}.png`;
      const domain = new URL(url).hostname;
      const scoreColor = score >= 80 ? '#4CAF50' : score >= 50 ? '#FFC107' : '#F44336';
      const scoreText = `${Math.round(score)}`;
      
      const imageBuffer = await this.imageGenerator.createImage(domain, scoreText, scoreColor);
      
      if (!imageBuffer) {
        console.error('[ImageService] Failed to create image buffer');
        throw new Error('Failed to generate image buffer');
      }
      
      try {
        await this.r2Bucket.put(imageKey, imageBuffer, {
          httpMetadata: {
            contentType: 'image/png',
            cacheControl: 'public, max-age=2592000' // 30 days
          }
        });
        console.log(`[ImageService] Successfully stored image in R2 with key: ${imageKey}`);
      } catch (r2Error) {
        console.error('[ImageService] Error storing image in R2:', r2Error);
        throw r2Error;
      }
      
      return imageKey;
    } catch (error) {
      console.error('[ImageService] Failed to generate share image:', error);
      return null;
    }
  }


}
