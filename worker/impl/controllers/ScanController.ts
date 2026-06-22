import { Context } from 'hono';
import { PostHog } from 'posthog-node';
import { ScanRequestDTO, ScanResponseDTO } from '../../../src/types';
import { ScanUrlUseCase } from '../../usecases/ScanUrlUseCase';
import { UrlValidator } from '../utils/UrlValidator';
import { UrlNormalizer } from '../utils/UrlNormalizer';
import { ReportMapper } from '../mappers/ReportMapper';
import { getDistinctId } from '../../lib/posthog';

export class ScanController {
  constructor(
    private readonly scanUrlUseCase: ScanUrlUseCase,
    private readonly cdnDomain: string,
    private readonly posthog?: PostHog
  ) {}

  /**
   * Handle POST /scan requests
   */
  async handleScan(c: Context): Promise<Response> {
    // Parse and validate request body
    const body = await c.req.json<ScanRequestDTO>();
    
    if (!body || !body.url) {
      throw new Error('INVALID_URL');
    }
    
    // First validate the URL (ensures it has correct format and protocol)
    const validatedUrl = UrlValidator.validate(body.url);
    
    // Then normalize the URL (removes query parameters and fragments)
    const normalizedUrl = UrlNormalizer.normalize(validatedUrl);
    
    let report;
    try {
      // Execute use case with the normalized URL
      report = await this.scanUrlUseCase.execute({
        url: normalizedUrl
      });
    } catch (error) {
      if (this.posthog && error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        const distinctId = getDistinctId(c.req);
        this.posthog.capture({ distinctId, event: 'scan rate limited', properties: { url: normalizedUrl } });
        await this.posthog.shutdown();
      }
      throw error;
    }

    if (this.posthog) {
      const distinctId = getDistinctId(c.req);
      const detected = report.headers.filter(h => h.present && !h.leaking).length;
      const missing = report.headers.filter(h => !h.present && !h.leaking).length;
      const leaking = report.headers.filter(h => h.leaking).length;
      this.posthog.capture({
        distinctId,
        event: 'url scanned',
        properties: {
          url: normalizedUrl,
          score: report.score,
          detected_headers: detected,
          missing_headers: missing,
          leaking_headers: leaking,
        },
      });
      await this.posthog.shutdown();
    }

    // Map to response DTO
    const responseDTO = ReportMapper.toScanResponseDTO(report, this.cdnDomain);

    // Return response
    return c.json<ScanResponseDTO>(responseDTO, 200);
  }
}
