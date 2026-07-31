export const HEADER_CATEGORIES = [
  'Security and privacy',
  'Infrastructure and disclosure',
  'Caching',
  'Content and representation',
  'CORS',
  'Cookies and authentication',
  'Redirects and response control',
  'Linking and performance metadata',
] as const;

export type HeaderCategory = (typeof HEADER_CATEGORIES)[number];

export interface HeaderCatalogEntry {
  name: string;
  displayName: string;
  slug: string;
  category: HeaderCategory;
  summary: string;
}

export const headerCatalog = {
  'content-security-policy': {
    name: 'content-security-policy', displayName: 'Content-Security-Policy', slug: 'content-security-policy', category: 'Security and privacy',
    summary: 'Defines the sources from which a document may load and execute different kinds of resources.',
  },
  'strict-transport-security': {
    name: 'strict-transport-security', displayName: 'Strict-Transport-Security', slug: 'strict-transport-security', category: 'Security and privacy',
    summary: 'Tells a browser to use HTTPS for future requests to the responding host over a stated period.',
  },
  'x-content-type-options': {
    name: 'x-content-type-options', displayName: 'X-Content-Type-Options', slug: 'x-content-type-options', category: 'Security and privacy',
    summary: 'Controls whether a browser may infer a resource type other than the declared media type.',
  },
  'x-frame-options': {
    name: 'x-frame-options', displayName: 'X-Frame-Options', slug: 'x-frame-options', category: 'Security and privacy',
    summary: 'Specifies the conditions under which a response may be displayed within a frame or iframe.',
  },
  'referrer-policy': {
    name: 'referrer-policy', displayName: 'Referrer-Policy', slug: 'referrer-policy', category: 'Security and privacy',
    summary: 'Defines which portions of a referring URL a browser sends when it requests another resource.',
  },
  'permissions-policy': {
    name: 'permissions-policy', displayName: 'Permissions-Policy', slug: 'permissions-policy', category: 'Security and privacy',
    summary: 'Declares which browser features are available to the document and to embedded browsing contexts.',
  },
  'cross-origin-opener-policy': {
    name: 'cross-origin-opener-policy', displayName: 'Cross-Origin-Opener-Policy', slug: 'cross-origin-opener-policy', category: 'Security and privacy',
    summary: 'Sets the browsing-context group relationship between this document and cross-origin opened documents.',
  },
  'cross-origin-embedder-policy': {
    name: 'cross-origin-embedder-policy', displayName: 'Cross-Origin-Embedder-Policy', slug: 'cross-origin-embedder-policy', category: 'Security and privacy',
    summary: 'Specifies requirements for embedding cross-origin resources within a document.',
  },
  'cross-origin-resource-policy': {
    name: 'cross-origin-resource-policy', displayName: 'Cross-Origin-Resource-Policy', slug: 'cross-origin-resource-policy', category: 'Security and privacy',
    summary: 'Declares which origins may request a resource in certain cross-origin contexts.',
  },
  'clear-site-data': {
    name: 'clear-site-data', displayName: 'Clear-Site-Data', slug: 'clear-site-data', category: 'Security and privacy',
    summary: 'Requests that a browser clear selected data types associated with the response origin.',
  },
  'origin-agent-cluster': {
    name: 'origin-agent-cluster', displayName: 'Origin-Agent-Cluster', slug: 'origin-agent-cluster', category: 'Security and privacy',
    summary: 'Indicates whether the origin should use a dedicated browser agent cluster.',
  },
  'x-permitted-cross-domain-policies': {
    name: 'x-permitted-cross-domain-policies', displayName: 'X-Permitted-Cross-Domain-Policies', slug: 'x-permitted-cross-domain-policies', category: 'Security and privacy',
    summary: 'Describes a response policy for legacy cross-domain policy-file handling by compatible clients.',
  },
  'x-dns-prefetch-control': {
    name: 'x-dns-prefetch-control', displayName: 'X-DNS-Prefetch-Control', slug: 'x-dns-prefetch-control', category: 'Security and privacy',
    summary: 'Controls whether compatible browsers may pre-resolve domain names referenced by a document.',
  },
  server: {
    name: 'server', displayName: 'Server', slug: 'server', category: 'Infrastructure and disclosure',
    summary: 'Identifies software or services that handled the response on the server side.',
  },
  'x-powered-by': {
    name: 'x-powered-by', displayName: 'X-Powered-By', slug: 'x-powered-by', category: 'Infrastructure and disclosure',
    summary: 'Provides an optional label for the framework, runtime, or platform used to generate a response.',
  },
  'x-aspnet-version': {
    name: 'x-aspnet-version', displayName: 'X-AspNet-Version', slug: 'x-aspnet-version', category: 'Infrastructure and disclosure',
    summary: 'Reports the version of ASP.NET that generated the response when an application includes it.',
  },
  'x-runtime': {
    name: 'x-runtime', displayName: 'X-Runtime', slug: 'x-runtime', category: 'Infrastructure and disclosure',
    summary: 'Reports the server-side processing duration or runtime information for a response.',
  },
  'x-generator': {
    name: 'x-generator', displayName: 'X-Generator', slug: 'x-generator', category: 'Infrastructure and disclosure',
    summary: 'Provides an optional identifier for software that created the response content.',
  },
  via: {
    name: 'via', displayName: 'Via', slug: 'via', category: 'Infrastructure and disclosure',
    summary: 'Lists intermediary protocols and hosts through which the message has been forwarded.',
  },
  'cache-control': {
    name: 'cache-control', displayName: 'Cache-Control', slug: 'cache-control', category: 'Caching',
    summary: 'Defines directives that govern how browsers and intermediary caches store and reuse a response.',
  },
  age: {
    name: 'age', displayName: 'Age', slug: 'age', category: 'Caching',
    summary: 'Indicates the estimated number of seconds a response has been stored in a cache.',
  },
  expires: {
    name: 'expires', displayName: 'Expires', slug: 'expires', category: 'Caching',
    summary: 'Supplies a date and time after which a cached response is considered stale.',
  },
  etag: {
    name: 'etag', displayName: 'ETag', slug: 'etag', category: 'Caching',
    summary: 'Provides an opaque identifier for a specific version of a resource representation.',
  },
  'last-modified': {
    name: 'last-modified', displayName: 'Last-Modified', slug: 'last-modified', category: 'Caching',
    summary: 'Reports the date and time when the server considers the selected representation last changed.',
  },
  vary: {
    name: 'vary', displayName: 'Vary', slug: 'vary', category: 'Caching',
    summary: 'Names request header fields that can cause caches to select a different stored response.',
  },
  'content-type': {
    name: 'content-type', displayName: 'Content-Type', slug: 'content-type', category: 'Content and representation',
    summary: 'Declares the media type and optional character encoding of the response representation.',
  },
  'content-length': {
    name: 'content-length', displayName: 'Content-Length', slug: 'content-length', category: 'Content and representation',
    summary: 'States the size in bytes of the response body when that size is known in advance.',
  },
  'content-encoding': {
    name: 'content-encoding', displayName: 'Content-Encoding', slug: 'content-encoding', category: 'Content and representation',
    summary: 'Identifies the content codings applied to the representation before it is sent to the recipient.',
  },
  'content-language': {
    name: 'content-language', displayName: 'Content-Language', slug: 'content-language', category: 'Content and representation',
    summary: 'Identifies the natural language or languages intended for the response representation.',
  },
  'content-disposition': {
    name: 'content-disposition', displayName: 'Content-Disposition', slug: 'content-disposition', category: 'Content and representation',
    summary: 'Describes how a client should present a response, including an optional suggested file name.',
  },
  'content-location': {
    name: 'content-location', displayName: 'Content-Location', slug: 'content-location', category: 'Content and representation',
    summary: 'Provides a URI that identifies a location associated with the selected representation.',
  },
  'accept-ranges': {
    name: 'accept-ranges', displayName: 'Accept-Ranges', slug: 'accept-ranges', category: 'Content and representation',
    summary: 'Indicates whether the resource supports range requests and the unit used for those ranges.',
  },
  'access-control-allow-origin': {
    name: 'access-control-allow-origin', displayName: 'Access-Control-Allow-Origin', slug: 'access-control-allow-origin', category: 'CORS',
    summary: 'Identifies the origin allowed to access the response from a cross-origin browser request.',
  },
  'access-control-allow-credentials': {
    name: 'access-control-allow-credentials', displayName: 'Access-Control-Allow-Credentials', slug: 'access-control-allow-credentials', category: 'CORS',
    summary: 'Indicates whether a cross-origin browser request may include credentials in its response handling.',
  },
  'access-control-allow-methods': {
    name: 'access-control-allow-methods', displayName: 'Access-Control-Allow-Methods', slug: 'access-control-allow-methods', category: 'CORS',
    summary: 'Lists the HTTP methods permitted for a cross-origin request in the relevant CORS context.',
  },
  'access-control-allow-headers': {
    name: 'access-control-allow-headers', displayName: 'Access-Control-Allow-Headers', slug: 'access-control-allow-headers', category: 'CORS',
    summary: 'Lists request header fields permitted for a cross-origin request in the relevant CORS context.',
  },
  'access-control-expose-headers': {
    name: 'access-control-expose-headers', displayName: 'Access-Control-Expose-Headers', slug: 'access-control-expose-headers', category: 'CORS',
    summary: 'Lists response header fields that browser scripts may access from a cross-origin response.',
  },
  'access-control-max-age': {
    name: 'access-control-max-age', displayName: 'Access-Control-Max-Age', slug: 'access-control-max-age', category: 'CORS',
    summary: 'Specifies how long a browser may reuse the result of a CORS preflight request.',
  },
  'set-cookie': {
    name: 'set-cookie', displayName: 'Set-Cookie', slug: 'set-cookie', category: 'Cookies and authentication',
    summary: 'Instructs a client to store a cookie with attributes that define its scope and lifetime.',
  },
  'www-authenticate': {
    name: 'www-authenticate', displayName: 'WWW-Authenticate', slug: 'www-authenticate', category: 'Cookies and authentication',
    summary: 'Describes one or more authentication challenges that a client may use for the requested resource.',
  },
  location: {
    name: 'location', displayName: 'Location', slug: 'location', category: 'Redirects and response control',
    summary: 'Provides a URI used to identify a redirect target or the location of a newly created resource.',
  },
  'retry-after': {
    name: 'retry-after', displayName: 'Retry-After', slug: 'retry-after', category: 'Redirects and response control',
    summary: 'Indicates when a client may make another request after a response that asks it to wait.',
  },
  link: {
    name: 'link', displayName: 'Link', slug: 'link', category: 'Linking and performance metadata',
    summary: 'Supplies typed relationships between the response and other resources identified by URIs.',
  },
  'server-timing': {
    name: 'server-timing', displayName: 'Server-Timing', slug: 'server-timing', category: 'Linking and performance metadata',
    summary: 'Communicates named timing metrics collected while a server processed the request.',
  },
  'timing-allow-origin': {
    name: 'timing-allow-origin', displayName: 'Timing-Allow-Origin', slug: 'timing-allow-origin', category: 'Linking and performance metadata',
    summary: 'Identifies origins that may access detailed timing information for the response resource.',
  },
} satisfies Record<string, HeaderCatalogEntry>;

const headerCatalogEntries = Object.values(headerCatalog);
const headerCatalogByName: Record<string, HeaderCatalogEntry> = headerCatalog;

export function getHeaderCatalogEntry(name: string): HeaderCatalogEntry | undefined {
  const normalizedName = name.toLowerCase();
  return Object.hasOwn(headerCatalogByName, normalizedName)
    ? headerCatalogByName[normalizedName]
    : undefined;
}

export function listHeaderCatalogEntries(): HeaderCatalogEntry[] {
  return headerCatalogEntries;
}
