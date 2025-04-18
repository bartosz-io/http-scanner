import { Report } from '../entities/Report';
import { ScanCommandModel } from '../entities/ScanCommandModel';
import { HeaderAnalyzerService } from '../interfaces/services/HeaderAnalyzerService';
import { HttpService } from '../interfaces/services/HttpService';
import { ImageService } from '../interfaces/services/ImageService';
import { ReportRepository } from '../interfaces/repositories/ReportRepository';

export class ScanUrlUseCase {
  constructor(
    private readonly headerAnalyzerService: HeaderAnalyzerService,
    private readonly httpService: HttpService,
    private readonly imageService: ImageService,
    private readonly reportRepository: ReportRepository
  ) {}

  /**
   * Execute the scan URL use case
   * @param command The scan command
   */
  async execute(command: ScanCommandModel): Promise<Report> {
    // 1. Check if the domain has been scanned in the last hour (rate limiting)
    const domain = new URL(command.url).hostname;
    const wasScanned = await this.reportRepository.wasScannedInLastMinute(domain);
    
    if (wasScanned) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // 2. Fetch headers from the URL
    const headers = await this.httpService.fetchHeaders(command.url);
    
    // 3. Analyze headers and calculate security score
    const analysisResult = await this.headerAnalyzerService.analyze(headers);
    
    // 4. Generate unique identifiers
    const hash = await this.generateMd5Hash(`${command.url}:${Date.now()}`);
    const deleteToken = await this.generateRandomToken();
    
    // 5. Generate share image
    const shareImageKey = await this.imageService.generateShareImage(
      hash,
      command.url,
      analysisResult.score
    );
    
    // 6. Create and save report
    const report = Report.create({
      hash,
      url: command.url,
      created_at: Math.floor(Date.now() / 1000),
      score: analysisResult.score,
      headers: [
        ...analysisResult.detected,
        ...analysisResult.missing,
        ...analysisResult.leaking
      ],
      deleteToken,
      share_image_key: shareImageKey
    });
    
    await this.reportRepository.save(report);
    
    return report;
  }

  /**
   * Generate an MD5 hash using Web Crypto API
   * @param data The data to hash
   * @returns A hex string representation of the hash
   */
  private async generateMd5Hash(data: string): Promise<string> {
    // Convert the string to an ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Use SubtleCrypto to create a SHA-256 hash (MD5 is not available in Web Crypto API)
    // This is more secure than MD5 anyway
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    // Convert the hash to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return the first 32 characters to match MD5 length
    return hashHex.substring(0, 32);
  }

  /**
   * Generate a random token using Web Crypto API
   * @returns A hex string representation of the random token
   */
  private async generateRandomToken(): Promise<string> {
    // Generate 16 random bytes
    const randomBuffer = new Uint8Array(16);
    crypto.getRandomValues(randomBuffer);
    
    // Convert to hex string
    return Array.from(randomBuffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
