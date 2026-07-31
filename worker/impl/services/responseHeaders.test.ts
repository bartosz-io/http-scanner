import { describe, expect, it } from 'vitest';
import {
  extractResponseHeaders,
  filterScannerTransportHeaders,
} from './responseHeaders';

describe('extractResponseHeaders', () => {
  it('normalizes names and keeps every Set-Cookie value on its own line', () => {
    const headers = new Headers();
    headers.append('Content-Type', 'text/html; charset=utf-8');
    headers.append('Set-Cookie', 'session=one; Secure; HttpOnly');
    headers.append('Set-Cookie', 'theme=dark; Secure');

    expect(extractResponseHeaders(headers)).toEqual({
      'content-type': 'text/html; charset=utf-8',
      'set-cookie': 'session=one; Secure; HttpOnly\ntheme=dark; Secure',
    });
  });
});

describe('filterScannerTransportHeaders', () => {
  it('removes the existing scanner transport set without mutating input', () => {
    const input = {
      'cache-control': 'max-age=60',
      'cf-ray': 'ray-id',
      'cf-cache-status': 'DYNAMIC',
      'alt-svc': 'h3=":443"',
      server: 'cloudflare',
    };

    expect(filterScannerTransportHeaders(input)).toEqual({
      'cache-control': 'max-age=60',
    });
    expect(input).toHaveProperty('cf-ray');
  });

  it('keeps a target server header that does not identify Cloudflare', () => {
    expect(filterScannerTransportHeaders({ server: 'nginx' })).toEqual({
      server: 'nginx',
    });
  });
});
