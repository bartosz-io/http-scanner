export const SITE_ORIGIN = 'https://httpscanner.com';

const NON_INDEXABLE_PATHS = ['/report', '/reports', '/share'] as const;

export function shouldIncludeInSitemap(page: string): boolean {
  const pathname = new URL(page).pathname.replace(/\/+$/, '') || '/';

  return !NON_INDEXABLE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
