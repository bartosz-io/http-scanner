import type {
  ReportShellDocument,
  ReportShellGateway,
} from '../../interfaces/gateways/ReportShellGateway';

/**
 * Cloudflare adapter for the report-shell output port.
 * This is the only report-shell class that knows the ASSETS binding type.
 */
export class CloudflareReportShellGateway implements ReportShellGateway {
  constructor(private readonly assets: Pick<Fetcher, 'fetch'>) {}

  async fetchShell(requestUrl: string): Promise<ReportShellDocument> {
    const shellUrl = new URL('/report/', requestUrl);
    const response = await this.assets.fetch(shellUrl);

    return {
      body: response.body,
      headers: Array.from(response.headers.entries()),
      status: response.status,
      statusText: response.statusText,
    };
  }
}
