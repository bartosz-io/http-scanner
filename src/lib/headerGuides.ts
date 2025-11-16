import type { HeaderEntry } from '@/types';

export interface HeaderGuideResource {
  label: string;
  url: string;
}

export interface HeaderGuide {
  /** Short copy that appears in the header card summary */
  summary: string;
  /** Longer explanation that helps developers understand the risk */
  risk: string;
  /** Quick filterable tags (e.g. XSS, Downgrade) */
  tags?: string[];
  /** Recommended value or starter snippet */
  recommendedValue?: string;
  /** Step-by-step remediation guidance */
  fixSteps: string[];
  /** Extra insights or best practices we want to surface */
  bestPractices?: string[];
  /** Authoritative resources */
  resources?: HeaderGuideResource[];
}

type HeaderGuideRegistry = Record<string, HeaderGuide>;

const headerGuides: HeaderGuideRegistry = {
  'content-security-policy': {
    summary: 'Defines which origins are trusted to load scripts, styles, frames, and other resources so browsers can block everything else.',
    risk: 'Weak or missing CSP means any injected markup can load external code or run inline scripts, opening the door to XSS, data exfiltration, and clickjacking.',
    tags: ['XSS', 'Script Injection', 'Data Exfiltration'],
    recommendedValue: [
      "default-src 'self';",
      "script-src 'self' https://analytics.example.com 'unsafe-inline' 'nonce-<random>';",
      "style-src 'self' 'unsafe-inline';",
      "object-src 'none';",
      'base-uri \'none\';',
      'frame-ancestors \'none\';',
    ].join(' '),
    fixSteps: [
      'Generate a unique nonce per response and attach it to approved inline scripts.',
      'Remove legacy "unsafe-inline" allowances wherever possible; prefer hashed or external scripts.',
      'Explicitly block object-src/base-uri to eliminate <object> and <base> injection tricks.',
      'Lock down frame-ancestors to trusted hosts (or none) to prevent clickjacking.',
    ],
    bestPractices: [
      'Audit third-party scripts; load them from a controlled subdomain to reduce wildcard hosts.',
      'Roll out CSP in report-only mode first to see what would break before enforcing.',
    ],
    resources: [
      { label: 'MDN: Content-Security-Policy', url: 'https://developer.mozilla.org/docs/Web/HTTP/CSP' },
      { label: 'Google CSP Evaluator', url: 'https://csp-evaluator.withgoogle.com/' },
    ],
  },
  'strict-transport-security': {
    summary: 'Instructs browsers to only ever use HTTPS (optionally for subdomains) after the first secure visit.',
    risk: 'If HSTS is absent or short-lived, attackers can downgrade users to HTTP on the first request or on sibling subdomains and tamper with traffic.',
    tags: ['Downgrade protection', 'HTTPS'],
    recommendedValue: 'max-age=63072000; includeSubDomains; preload',
    fixSteps: [
      'Keep max-age above 31536000 seconds (1 year) so browsers remember the HTTPS rule.',
      'Include subdomains so login/admin hosts cannot be downgraded.',
      'Submit the domain to https://hstspreload.org once the directive is stable.',
    ],
    bestPractices: [
      'Serve redirects to HTTPS before setting HSTS so first impressions are always encrypted.',
      'Rotate certificates before expiry; HSTS makes temporary HTTP fallbacks impossible.',
    ],
    resources: [
      { label: 'HSTS preload requirements', url: 'https://hstspreload.org/#requirements' },
      { label: 'MDN: Strict-Transport-Security', url: 'https://developer.mozilla.org/docs/Web/HTTP/Headers/Strict-Transport-Security' },
    ],
  },
  'x-content-type-options': {
    summary: 'Tells browsers to trust the declared MIME type and never sniff a different one.',
    risk: 'When sniffing stays enabled, hostile uploads served as text/plain may run as scripts or styles in permissive browsers.',
    tags: ['MIME sniffing', 'Upload hardening'],
    recommendedValue: 'nosniff',
    fixSteps: [
      'Send X-Content-Type-Options: nosniff on every response, especially assets and downloads.',
      'Ensure APIs also emit the header to protect JSON from being executed in old browsers.',
    ],
    bestPractices: [
      'Pair with correct Content-Type headers and disallow ambiguous file extensions.',
    ],
    resources: [
      { label: 'MDN: X-Content-Type-Options', url: 'https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Content-Type-Options' },
    ],
  },
  'x-frame-options': {
    summary: 'Controls whether other sites may embed your pages inside <iframe> elements.',
    risk: 'If framing is allowed everywhere, attackers can overlay your UI in a hidden iframe and trick users into clicking sensitive buttons (clickjacking).',
    tags: ['Clickjacking', 'UI Redress'],
    recommendedValue: 'DENY',
    fixSteps: [
      'Set X-Frame-Options to DENY (or SAMEORIGIN if you intentionally embed UI elsewhere).',
      'If you need granular control, ship an equivalent Content-Security-Policy frame-ancestors directive.',
    ],
    bestPractices: [
      'Audit marketing widgets or payment providers that rely on framing before tightening policy.',
    ],
    resources: [
      { label: 'OWASP: Clickjacking Defense', url: 'https://owasp.org/www-community/attacks/Clickjacking' },
    ],
  },
  'referrer-policy': {
    summary: 'Defines how much of the current URL is sent in the Referer header when navigating or fetching cross-origin resources.',
    risk: 'Without a restrictive policy, full URLs—including query tokens or user identifiers—may leak into third-party logs and analytics.',
    tags: ['Privacy', 'Data Leakage'],
    recommendedValue: 'strict-origin-when-cross-origin',
    fixSteps: [
      'Set Referrer-Policy: strict-origin-when-cross-origin for modern browsers.',
      'For highly sensitive applications, use no-referrer and build explicit tracking parameters.',
    ],
    bestPractices: [
      'Avoid embedding secrets inside the query string; combine with short-lived auth tokens.',
    ],
    resources: [
      { label: 'MDN: Referrer-Policy', url: 'https://developer.mozilla.org/docs/Web/HTTP/Headers/Referrer-Policy' },
    ],
  },
  'permissions-policy': {
    summary: 'Modern browsers ship powerful APIs (camera, geolocation). Lock them down to only the origins you trust.',
    risk: 'If an attacker can frame or redirect users, lax Permissions-Policy lets them activate sensors or payment handlers.',
    tags: ['Browser features', 'Privacy'],
    recommendedValue: "camera=(), geolocation=(), microphone=(), fullscreen=('self')",
    fixSteps: [
      'Enumerate the browser features you actually rely on.',
      'Deny everything by default (`feature=()`) and explicitly opt-in trusted origins.',
      'Ship equivalent directives in HTML meta tags for static hosting setups.',
    ],
    bestPractices: [
      'Document why each feature is allowed so future engineers avoid loosening the policy without review.',
    ],
    resources: [
      { label: 'MDN: Permissions-Policy', url: 'https://developer.mozilla.org/docs/Web/HTTP/Headers/Permissions-Policy' },
    ],
  },
  'cross-origin-opener-policy': {
    summary: 'COOP forces your document into its own browsing context group so other tabs cannot poke at window.opener.',
    risk: 'If COOP is not enforced, third-party popups can keep references to your window and attempt opener hijacking or leverage Spectre side channels.',
    tags: ['Spectre', 'Cross-origin isolation'],
    recommendedValue: 'same-origin',
    fixSteps: [
      'Send Cross-Origin-Opener-Policy: same-origin on HTML responses.',
      'If you must interact with cross-origin popups, fall back to same-origin-allow-popups but audit why.',
      'Pair COOP with COEP to fully opt into cross-origin isolation and unlock SharedArrayBuffer safely.',
    ],
    bestPractices: [
      'Test payment and OAuth flows that rely on popups before enforcing COOP.',
    ],
    resources: [
      { label: 'MDN: Cross-Origin-Opener-Policy', url: 'https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy' },
    ],
  },
  'cross-origin-embedder-policy': {
    summary: 'COEP requires every embedded cross-origin resource to explicitly opt in via CORP/COEP headers, enabling full isolation.',
    risk: 'Without COEP, attackers may load opaque cross-origin resources inside your page and attempt data theft via side channels; you also lose SharedArrayBuffer access.',
    tags: ['Spectre', 'Cross-origin isolation'],
    recommendedValue: 'require-corp',
    fixSteps: [
      'Audit every script/image/font you load. Ensure they either send CORP headers or are same-origin.',
      'Serve Cross-Origin-Embedder-Policy: require-corp on HTML responses once dependencies comply.',
      'For third parties that cannot set CORP, proxy them through your own origin or mark them with crossorigin plus the correct CORP header.',
    ],
    bestPractices: [
      'Roll out COEP gradually in staging; it is strict and will block any asset lacking CORP/COEP opt-in.',
    ],
    resources: [
      { label: 'MDN: Cross-Origin-Embedder-Policy', url: 'https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy' },
    ],
  },
  'cross-origin-resource-policy': {
    summary: 'CORP lets you declare whether other origins (same-site, same-origin, or cross-origin) may load a given resource.',
    risk: 'If you never constrain CORP, hostile sites can embed your APIs or media and attempt XS-Leaks to infer data or reuse it without consent.',
    tags: ['Cross-origin data', 'Isolation'],
    recommendedValue: 'same-site',
    fixSteps: [
      'Pick the narrowest scope: same-site (recommended) or same-origin if assets must never leave your host.',
      'Add Cross-Origin-Resource-Policy on static assets, APIs, and downloads.',
      'If you intentionally expose public assets, document why and consider separate hosts for them.',
    ],
    resources: [
      { label: 'MDN: Cross-Origin-Resource-Policy', url: 'https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy' },
    ],
  },
  'clear-site-data': {
    summary: 'This header lets you wipe caches/cookies/storage when users log out or rotate sessions.',
    risk: 'Without it, stale sessions remain in browser storage, leaving data behind on shared devices.',
    tags: ['Session hygiene', 'Cache'],
    recommendedValue: '"cache", "cookies", "storage"',
    fixSteps: [
      'Emit Clear-Site-Data on logout and account deletion responses to force browsers to purge sensitive data.',
      'Scope it carefully; wiping everything on every response causes thrashing.',
      'Combine with server-side session invalidation to enforce true logout.',
    ],
    bestPractices: [
      'Use wildcard directives only for destructive flows (logout/delete). For routine changes, target just "cache" or "storage".',
    ],
    resources: [
      { label: 'MDN: Clear-Site-Data', url: 'https://developer.mozilla.org/docs/Web/HTTP/Headers/Clear-Site-Data' },
    ],
  },
  'origin-agent-cluster': {
    summary: 'OAC isolates your origin’s browsing context to avoid shared permissions/session storage with similar domains.',
    risk: 'Without it, subdomains (or domains with the same eTLD+1) may share process memory, increasing XS-Leak surface.',
    tags: ['Process isolation'],
    recommendedValue: '?1',
    fixSteps: [
      'Set Origin-Agent-Cluster: ?1 on HTML responses to opt-in to dedicated agent clusters.',
      'Audit subdomains that intentionally rely on shared storage; provide explicit messaging if they need exceptions.',
    ],
    resources: [
      { label: 'chromestatus: Origin-Agent-Cluster', url: 'https://developer.chrome.com/blog/origin-agent-cluster/' },
    ],
  },
  'x-permitted-cross-domain-policies': {
    summary: 'Flash is mostly gone, but some legacy clients still respect cross-domain policy files; deny them explicitly.',
    risk: 'Allowing arbitrary cross-domain policies lets untrusted origins read data via old Adobe plugins.',
    tags: ['Legacy', 'Flash'],
    recommendedValue: 'none',
    fixSteps: [
      'Set X-Permitted-Cross-Domain-Policies: none unless you intentionally expose a policy file.',
      'If an internal tool still needs it, host the policy on a separate legacy subdomain.',
    ],
    resources: [
      { label: 'Adobe cross-domain policy', url: 'https://www.adobe.com/devnet/articles/crossdomain_policy_file_spec.html' },
    ],
  },
  'x-dns-prefetch-control': {
    summary: 'Control when browsers pre-resolve hostnames so you can avoid leaking internal domains.',
    risk: 'If DNS prefetching stays enabled, sensitive hostnames embedded in HTML may leak through passive DNS queries.',
    tags: ['Privacy', 'Performance'],
    recommendedValue: 'off',
    fixSteps: [
      'Disable prefetching globally (`X-DNS-Prefetch-Control: off`) on sensitive apps.',
      'Whitelist only the hosts you truly need via <link rel="dns-prefetch"> when performance matters.',
    ],
    resources: [
      { label: 'MDN: X-DNS-Prefetch-Control', url: 'https://developer.mozilla.org/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control' },
    ],
  },
  server: {
    summary: 'Leaking the exact server software/version gives attackers a head start.',
    risk: 'Automated scanners tailor exploits to the software you advertise (e.g., nginx/1.18, Apache 2.4).',
    tags: ['Information disclosure'],
    fixSteps: [
      'Strip or genericize the Server header via your reverse proxy/CDN.',
      'For Cloudflare/Netlify/etc., enable their “hide origin server banner” setting.',
    ],
    resources: [
      { label: 'OWASP: Information Disclosure', url: 'https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration' },
    ],
  },
  'x-powered-by': {
    summary: 'Reveals the backend framework (Express, PHP, ASP.NET), signaling ready-made exploits.',
    risk: 'Attackers fingerprint framework versions to skip discovery and go straight to known CVEs.',
    tags: ['Information disclosure'],
    fixSteps: [
      'Disable X-Powered-By in your framework configuration (e.g., app.disable("x-powered-by") in Express).',
      'Use generic values only if you cannot remove it entirely.',
    ],
    resources: [
      { label: 'Express docs: removing X-Powered-By', url: 'https://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by' },
    ],
  },
  'x-aspnet-version': {
    summary: 'Exposes the exact ASP.NET version running the site.',
    risk: 'Legacy ASP.NET versions have known RCE/serialization bugs; advertising them invites targeted attacks.',
    tags: ['Information disclosure', 'Framework'],
    fixSteps: [
      'Clear HttpRuntimeSection.EnableVersionHeader or set existingResponse="Replace" in web.config.',
      'Upgrade to supported ASP.NET builds before hiding the header—obscurity is not enough.',
    ],
    resources: [
      { label: 'Microsoft Docs: remove X-AspNet-Version', url: 'https://learn.microsoft.com/aspnet/whitepapers/aspnet-and-iis-configuration' },
    ],
  },
  'x-runtime': {
    summary: 'Rails apps emit X-Runtime which reveals framework usage and timeline data.',
    risk: 'Knowing you run Rails narrows exploit choices; timing data can also leak business logic info.',
    tags: ['Information disclosure', 'Timing'],
    fixSteps: [
      'Disable config.action_dispatch.rack_cache or use config.action_dispatch.default_headers to strip it.',
      'Monitor performance using server-side tooling instead of exposing runtime values publicly.',
    ],
  },
  'x-generator': {
    summary: 'Often indicates the CMS (WordPress, Drupal) and exact version.',
    risk: 'Commodity exploits target outdated CMSs; showing the generator header puts a bullseye on you.',
    tags: ['CMS', 'Information disclosure'],
    fixSteps: [
      'Remove generator meta/header tags via CMS configuration or templates.',
      'If marketing needs attribution, use a custom string rather than the default versioned value.',
    ],
  },
};

export const getHeaderGuide = (headerName: HeaderEntry['name']) => {
  return headerGuides[headerName.toLowerCase()];
};

export const listGuidedHeaders = () => Object.keys(headerGuides);
