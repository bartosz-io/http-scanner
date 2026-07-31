import { afterEach, describe, expect, it, vi } from 'vitest';
import { FetchHttpService } from './FetchHttpService';

describe('FetchHttpService logging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps URL details and header values out of log arguments', async () => {
    const querySecret = 'QUERY_SECRET_MARKER';
    const redirectSecret = 'REDIRECT_SECRET_MARKER';
    const headerSecret = 'HEADER_SECRET_MARKER';
    const response = new Response('', {
      status: 200,
      headers: {
        'Set-Cookie': `session=${headerSecret}; Secure; HttpOnly`,
        'X-Target-Debug': headerSecret,
      },
    });
    Object.defineProperty(response, 'url', {
      value: `https://example.com/final-private-path?token=${redirectSecret}#final-fragment`,
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const headers = await new FetchHttpService().fetchHeaders(
      `https://example.com/request-private-path?token=${querySecret}#request-fragment`
    );

    expect(headers['set-cookie']).toContain(headerSecret);
    expect(headers['x-target-debug']).toBe(headerSecret);

    const logArguments = JSON.stringify(logSpy.mock.calls);
    for (const sensitiveMarker of [
      querySecret,
      redirectSecret,
      headerSecret,
      'request-private-path',
      'request-fragment',
      'final-private-path',
      'final-fragment',
    ]) {
      expect(logArguments).not.toContain(sensitiveMarker);
    }
  });
});
