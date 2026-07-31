import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ReportView } from '@/components/report/ReportView';
import { capturePostHogEvent, initializePostHog } from '@/lib/posthogClient';
import {
  parseBrowserReportLocation,
  type BrowserReportLocation,
} from '@/lib/reportLocation';
import {
  createReportViewUrl,
  type ScannerResultView,
} from '@/lib/reportView';

function readReportLocation(): BrowserReportLocation {
  return parseBrowserReportLocation(
    window.location.pathname,
    window.location.search,
    window.location.hash
  );
}

export const ReportIsland: React.FC = () => {
  const [reportLocation] = useState(readReportLocation);
  const [view, setView] = useState<ScannerResultView>(reportLocation.view);

  useLayoutEffect(() => {
    if (reportLocation.shouldSanitize) {
      window.history.replaceState(
        window.history.state,
        '',
        reportLocation.sanitizedUrl
      );
    }
  }, [reportLocation]);

  useEffect(() => {
    initializePostHog();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setView(readReportLocation().view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleViewChange = (nextView: ScannerResultView) => {
    if (nextView === view) {
      return;
    }

    window.history.pushState(
      window.history.state,
      '',
      createReportViewUrl(
        window.location.pathname,
        window.location.search,
        nextView
      )
    );
    setView(nextView);
    capturePostHogEvent('report view switched', { report_view: nextView });
  };

  if (!reportLocation.hash) {
    return (
      <div className="site-container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Invalid report address</AlertTitle>
          <AlertDescription>
            This URL does not contain a valid report identifier.
            <div className="mt-4">
              <a href="/" className="text-primary hover:underline">Return to Home</a>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ReportView
      hash={reportLocation.hash}
      token={reportLocation.deleteToken}
      view={view}
      onViewChange={handleViewChange}
    />
  );
};
