import { describe, expect, it } from 'vitest';
import {
  getHeaderSecurityGuide,
  listSecurityGuidedHeaders,
} from './headerSecurityGuides';

describe('security header guides', () => {
  it('preserves all 18 existing security-oriented entries', () => {
    expect(listSecurityGuidedHeaders().sort()).toEqual([
      'clear-site-data',
      'content-security-policy',
      'cross-origin-embedder-policy',
      'cross-origin-opener-policy',
      'cross-origin-resource-policy',
      'origin-agent-cluster',
      'permissions-policy',
      'referrer-policy',
      'server',
      'strict-transport-security',
      'x-aspnet-version',
      'x-content-type-options',
      'x-dns-prefetch-control',
      'x-frame-options',
      'x-generator',
      'x-permitted-cross-domain-policies',
      'x-powered-by',
      'x-runtime',
    ]);
  });

  it('looks up names case-insensitively through the renamed API', () => {
    expect(getHeaderSecurityGuide('Content-Security-Policy')?.risk).toBeTruthy();
  });
});
