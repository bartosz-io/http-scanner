import { HeaderEntry } from '../../entities/HeaderEntry';
import { HeaderAnalysisResult } from '../../entities/HeaderAnalysisResult';
import { HeaderAnalyzerService as HeaderAnalyzerServiceInterface } from '../../interfaces/services/HeaderAnalyzerService';
import { ScoreNormalizerService } from '../../interfaces/services/ScoreNormalizerService';

export class HeaderAnalyzerService implements HeaderAnalyzerServiceInterface {
  // Base score for all scans
  private readonly BASE_SCORE = 50;
  
  constructor(private readonly scoreNormalizer: ScoreNormalizerService) {}
  
  // In a real implementation, these would be loaded from configuration files
  private readonly securityHeaders = [
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

  private readonly leakingHeaders = [
    { name: 'server', weight: -3 },
    { name: 'x-powered-by', weight: -5 },
    { name: 'x-aspnet-version', weight: -5 },
    { name: 'x-runtime', weight: -3 },
    { name: 'x-generator', weight: -3 }
  ];

  async analyze(headers: Record<string, string>): Promise<HeaderAnalysisResult> {
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
