import { describe, expect, it, vi } from 'vitest';
import { ReportShellController } from '../impl/controllers/ReportShellController';
import type {
  ReportShellDocument,
  ReportShellGateway,
} from '../interfaces/gateways/ReportShellGateway';
import { FetchReportShellUseCase } from '../usecases/FetchReportShellUseCase';
import { createReportShellRoute } from './reportShellRoute';

const REPORT_HASH = '9249232fefb9a1c0455ba007d7784f6c';

function createRoute(fetchShell: ReportShellGateway['fetchShell']) {
  const gateway: ReportShellGateway = { fetchShell };
  const useCase = new FetchReportShellUseCase(gateway);
  const controller = new ReportShellController(useCase);

  return createReportShellRoute(() => controller);
}

describe('reportShellRoute', () => {
  it('streams the static report shell with crawler protection', async () => {
    const document: ReportShellDocument = {
      body: new Response('<!doctype html><meta name="robots" content="noindex,nofollow">').body,
      headers: [['content-type', 'text/html; charset=utf-8']],
      status: 200,
      statusText: 'OK',
    };
    const fetchShell = vi.fn<ReportShellGateway['fetchShell']>(
      async () => document
    );
    const route = createRoute(fetchShell);

    const response = await route.request(
      `/${REPORT_HASH}?token=0123456789abcdef0123456789abcdef`
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain('name="robots"');
    expect(fetchShell).toHaveBeenCalledWith(
      `http://localhost/${REPORT_HASH}?token=0123456789abcdef0123456789abcdef`
    );
  });

  it('rejects malformed hashes before calling the output port', async () => {
    const fetchShell = vi.fn<ReportShellGateway['fetchShell']>();
    const route = createRoute(fetchShell);

    const response = await route.request('/not-a-hash');

    expect(response.status).toBe(404);
    expect(fetchShell).not.toHaveBeenCalled();
  });

  it('accepts a valid report path with a trailing slash', async () => {
    const fetchShell = vi.fn<ReportShellGateway['fetchShell']>(async () => ({
      body: null,
      headers: [],
      status: 200,
      statusText: 'OK',
    }));
    const route = createRoute(fetchShell);

    const response = await route.request(`/${REPORT_HASH}/`);

    expect(response.status).toBe(200);
    expect(fetchShell).toHaveBeenCalledOnce();
  });
});
