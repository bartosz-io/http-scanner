import { PostHog } from 'posthog-node';

export function createPostHogClient(token: string, host: string): PostHog {
  return new PostHog(token, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
}

export function getDistinctId(req: { header: (name: string) => string | undefined }): string {
  return (
    req.header('CF-Connecting-IP') ||
    req.header('x-forwarded-for')?.split(',')[0].trim() ||
    'anonymous'
  );
}
