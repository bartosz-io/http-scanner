import React, { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportViewProps } from '../../types/reportTypes';
import { useReportData } from '../../hooks/useReportData';
import { capturePostHogEvent } from '../../lib/posthogClient';
import {
  selectAllResponseHeaders,
  type ReportHeaderGroups,
} from '../../lib/reportView';
import { ReportHeader } from './ReportHeader';
import { ReportViewSwitch } from './ReportViewSwitch';
import { ScoreSection } from './ScoreSection';
import { HeadersSection } from './HeadersSection';
import { ReportActionSection } from './ReportActionSection';
import { DeleteSection } from './DeleteSection';
import { TokenWarningAlert } from './TokenWarningAlert';
import { AllHeadersSection } from './AllHeadersSection';

/**
 * ReportView component displays the detailed scan results for a security header scan
 */
export const ReportView: React.FC<ReportViewProps> = ({
  hash,
  token,
  view,
  onViewChange,
}) => {
  const initialReportView = React.useRef(view);

  // Use the custom hook to manage the report state and functionality
  const {
    report,
    isLoading,
    error,
    errorCode
  } = useReportData(hash);

  // Prepare header data for the tabs
  const headerData = React.useMemo(() => {
    if (!report) return { detected: [], missing: [], leaking: [] };

    // Headers in this application come in a grouped format
    // Make sure we properly handle the structure
    const headers = report.headers as unknown as ReportHeaderGroups;
    
    // Validate the structure to ensure it has the expected properties
    if (headers && 'detected' in headers && 'missing' in headers && 'leaking' in headers) {
      return headers;
    }
    
    // If we get here, something is wrong with the data format
    console.error('Unexpected headers format:', report.headers);
    return { detected: [], missing: [], leaking: [] };
  }, [report]);

  const allHeaders = React.useMemo(
    () => selectAllResponseHeaders(headerData),
    [headerData]
  );

  useEffect(() => {
    if (report) {
      capturePostHogEvent('report viewed', {
        url: report.url,
        score: report.score,
        hash: report.hash,
        report_view: initialReportView.current,
      });
    }
  }, [report]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="site-container mx-auto space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="site-container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error loading report</AlertTitle>
          <AlertDescription>
            {errorCode === 'NOT_FOUND'
              ? 'The requested report could not be found. It may have been deleted or never existed.'
              : error}
            <div className="mt-4">
              <a href="/" className="text-primary hover:underline">Return to Home</a>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render the report view
  return (
    <div className="site-container mx-auto space-y-8 px-4 py-8">
      {report && (
        <div className="space-y-8">
          {/* Report header with URL and timestamp */}
          <ReportHeader
            url={report.url}
            createdAt={report.created_at}
            /* deleteToken is only available during initial scan, not in fetch report */
          />

          {/* Display token warning when URL has a token parameter */}
          {token && (
            <TokenWarningAlert deleteToken={token} />
          )}

          <ReportViewSwitch value={view} onChange={onViewChange} />

          {view === 'security-analysis' && (
            <>
              {/* Two-column layout for score and sharing with equal heights */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Left column: Score section with gauge */}
                <div className="flex h-full">
                  <div className="flex-grow">
                    <ScoreSection score={report.score} />
                  </div>
                </div>

                {/* Right column: Sharing options */}
                <div className="flex h-full">
                  <div className="flex-grow">
                    <ReportActionSection
                      url={report.url}
                      score={report.score}
                      hash={report.hash}
                      shareImageUrl={report.share_image_url}
                    />
                  </div>
                </div>
              </div>

              {/* Headers section with tabs */}
              <HeadersSection headers={headerData} />
            </>
          )}

          {view === 'all-headers' && (
            <AllHeadersSection headers={allHeaders} linkGuides={true} />
          )}

          {/* Delete report option */}
          <DeleteSection hash={report.hash} />
        </div>
      )}
    </div>
  );
};
