export interface HomepageSecurityHeaderGroup {
  title: string;
  description: string;
  headers: readonly string[];
}

export const homepageSecurityHeaderGroups = [
  {
    title: 'HTTPS and transport security',
    description:
      'Strict-Transport-Security helps browsers use encrypted HTTPS connections instead of falling back to insecure HTTP.',
    headers: ['Strict-Transport-Security'],
  },
  {
    title: 'Content and browser protections',
    description:
      'These headers restrict which resources can run, how the page may be embedded, what browser features it can use, and how referrer information is shared.',
    headers: [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ],
  },
  {
    title: 'Cross-origin isolation',
    description:
      'Cross-origin policies control how the document interacts with resources and browsing contexts served by other origins.',
    headers: [
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Embedder-Policy',
      'Cross-Origin-Resource-Policy',
      'Origin-Agent-Cluster',
    ],
  },
  {
    title: 'Site data and legacy browser controls',
    description:
      'These situational headers can clear local browser data or restrict behavior retained for compatibility with older clients and plugins.',
    headers: [
      'Clear-Site-Data',
      'X-Permitted-Cross-Domain-Policies',
      'X-DNS-Prefetch-Control',
    ],
  },
] as const satisfies readonly HomepageSecurityHeaderGroup[];
