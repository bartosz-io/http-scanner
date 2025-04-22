import { HeaderEntry } from '../../entities/HeaderEntry';
import { HeaderAnalysisResult } from '../../entities/HeaderAnalysisResult';
import { HeaderAnalyzerService as HeaderAnalyzerServiceInterface } from '../../interfaces/services/HeaderAnalyzerService';
import { ScoreNormalizerService } from '../../interfaces/services/ScoreNormalizerService';
import { ConfigurationService } from '../../interfaces/services/ConfigurationService';

interface HeaderConfig {
  name: string;
  weight: number;
}

export class HeaderAnalyzerService implements HeaderAnalyzerServiceInterface {
  // Base score for all scans
  private readonly BASE_SCORE = 50;
  
  // Headers configuration
  private securityHeaders: HeaderConfig[] = [];
  private leakingHeaders: HeaderConfig[] = [];
  private configLoaded = false;
  
  constructor(
    private readonly scoreNormalizer: ScoreNormalizerService,
    private readonly configService: ConfigurationService
  ) {}
  
  /**
   * Loads configuration from the configuration service
   * @returns Promise that resolves when configuration is loaded
   */
  private async loadConfiguration(): Promise<void> {
    if (this.configLoaded) {
      return;
    }
    
    try {
      // Load security headers
      const securityHeadersConfig = await this.configService.loadSecurityHeaders();
      this.securityHeaders = Object.entries(securityHeadersConfig).map(([name, weight]) => ({
        name,
        weight
      }));
      
      // Load leaking headers
      const leakingHeadersConfig = await this.configService.loadLeakingHeaders();
      this.leakingHeaders = Object.entries(leakingHeadersConfig).map(([name, weight]) => ({
        name,
        weight
      }));
      
      this.configLoaded = true;
      console.log('Headers configuration loaded successfully');
    } catch (error) {
      console.error('Failed to load headers configuration:', error);
      // Use default values if configuration loading fails
      this.useDefaultConfiguration();
    }
  }
  
  /**
   * Sets default configuration values if loading fails
   */
  private useDefaultConfiguration(): void {
    // Default security headers
    this.securityHeaders = [
      { name: 'strict-transport-security', weight: 10 },
      { name: 'content-security-policy', weight: 10 },
      { name: 'x-content-type-options', weight: 5 },
      { name: 'x-frame-options', weight: 5 },
      { name: 'x-xss-protection', weight: 5 },
      { name: 'referrer-policy', weight: 3 },
      { name: 'permissions-policy', weight: 3 },
      { name: 'cross-origin-embedder-policy', weight: 2 },
      { name: 'cross-origin-opener-policy', weight: 2 },
      { name: 'cross-origin-resource-policy', weight: 2 }
    ];

    // Default leaking headers
    this.leakingHeaders = [
      { name: 'server', weight: -3 },
      { name: 'x-powered-by', weight: -5 },
      { name: 'x-aspnet-version', weight: -5 },
      { name: 'x-runtime', weight: -3 },
      { name: 'x-generator', weight: -3 }
    ];
    
    this.configLoaded = true;
  }

  async analyze(headers: Record<string, string>): Promise<HeaderAnalysisResult> {
    // Ensure configuration is loaded
    await this.loadConfiguration();
    const detected: HeaderEntry[] = [];
    const missing: HeaderEntry[] = [];
    const leaking: HeaderEntry[] = [];
    let score = this.BASE_SCORE; // Start with base score
    
    // Check for security headers
    for (const header of this.securityHeaders) {
      const headerValue = headers[header.name];
      const present = !!headerValue;
      
      if (present) {
        score += header.weight;
        detected.push(HeaderEntry.create({
          name: header.name,
          value: headerValue,
          present: true,
          weight: header.weight,
          leaking: false
        }));
      } else {
        missing.push(HeaderEntry.create({
          name: header.name,
          present: false,
          weight: header.weight,
          leaking: false
        }));
      }
    }

    // Check for leaking headers
    for (const header of this.leakingHeaders) {
      const headerValue = headers[header.name];
      const present = !!headerValue;
      
      if (present) {
        score += header.weight; // Negative weight reduces score
        leaking.push(HeaderEntry.create({
          name: header.name,
          value: headerValue,
          present: true,
          weight: header.weight,
          leaking: true
        }));
      }
    }
    
    // Log raw score before normalization
    console.log('Score before normalization:', score);

    // Extract weights from header definitions for normalization
    const positiveWeights = this.securityHeaders.map(header => header.weight);
    const negativeWeights = this.leakingHeaders.map(header => header.weight);
    
    // Use the score normalizer service to normalize the score
    score = this.scoreNormalizer.normalize(
      score,
      this.BASE_SCORE,
      positiveWeights,
      negativeWeights
    );
    
    return {
      detected,
      missing,
      leaking,
      score
    };
  }
}
