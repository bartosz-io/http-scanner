import type { Context } from 'hono';
import { FetchReportShellUseCase } from '../../usecases/FetchReportShellUseCase';

/**
 * HTTP adapter for dynamic report URLs backed by one static Astro shell.
 */
export class ReportShellController {
  constructor(
    private readonly fetchReportShellUseCase: FetchReportShellUseCase
  ) {}

  async handleFetchReportShell(c: Context): Promise<Response> {
    try {
      const document = await this.fetchReportShellUseCase.execute({
        hash: c.req.param('hash') ?? '',
        requestUrl: c.req.url,
      });
      const headers = new Headers(document.headers);
      headers.set('X-Robots-Tag', 'noindex, nofollow');

      return new Response(document.body, {
        status: document.status,
        statusText: document.statusText,
        headers,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_HASH_FORMAT') {
        return c.text('Not Found', 404);
      }

      throw error;
    }
  }
}
