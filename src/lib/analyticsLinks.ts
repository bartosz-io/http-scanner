import { capturePostHogEvent } from './posthogClient';

export type TrackedLinkEvent =
  | 'guide to checker clicked'
  | 'checker to guide clicked';

type Capture = (eventName: string, properties?: Record<string, string>) => void;

const TRACKED_LINK_EVENTS: readonly TrackedLinkEvent[] = [
  'guide to checker clicked',
  'checker to guide clicked',
];

export function readTrackedLink(
  eventName: string | undefined,
  headerName?: string
): { eventName: TrackedLinkEvent; properties: Record<string, string> } | null {
  if (!TRACKED_LINK_EVENTS.includes(eventName as TrackedLinkEvent)) {
    return null;
  }

  return {
    eventName: eventName as TrackedLinkEvent,
    properties: headerName ? { header_name: headerName } : {},
  };
}

export function bindAnalyticsLinks(
  root: ParentNode = document,
  capture: Capture = capturePostHogEvent
): () => void {
  const handleClick = (event: Event) => {
    const target = event.target as { closest?: (selector: string) => HTMLElement | null } | null;
    const anchor = target?.closest?.('a[data-analytics-event]');
    if (!anchor) {
      return;
    }

    const trackedLink = readTrackedLink(
      anchor.dataset.analyticsEvent,
      anchor.dataset.analyticsHeaderName
    );
    if (trackedLink) {
      capture(trackedLink.eventName, trackedLink.properties);
    }
  };

  root.addEventListener('click', handleClick);
  return () => root.removeEventListener('click', handleClick);
}
