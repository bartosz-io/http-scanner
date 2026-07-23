import { describe, expect, it, vi } from 'vitest';
import { CloudflareReportShellGateway } from './CloudflareReportShellGateway';

describe('CloudflareReportShellGateway', () => {
  it('maps the ASSETS response to a provider-neutral shell document', async () => {
    const fetch = vi.fn<Fetcher['fetch']>(async () => new Response('shell', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
      status: 200,
      statusText: 'OK',
    }));
    const gateway = new CloudflareReportShellGateway({ fetch });

    const document = await gateway.fetchShell(
      'https://httpscanner.com/report/9249232fefb9a1c0455ba007d7784f6c'
    );

    expect(new URL(String(fetch.mock.calls[0]?.[0])).pathname).toBe('/report/');
    expect(document.status).toBe(200);
    expect(document.statusText).toBe('OK');
    expect(document.headers).toContainEqual([
      'content-type',
      'text/html; charset=utf-8',
    ]);
    expect(await new Response(document.body).text()).toBe('shell');
  });
});
