import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { HeaderEntry } from '../../types';
import { useReportData } from '../../hooks/useReportData';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { ReportHeader } from './ReportHeader';
import { ScoreSection } from './ScoreSection';
import { HeadersSection } from './HeadersSection';
import { SharingSection } from './SharingSection';
import { DeleteSection } from './DeleteSection';
import { TokenWarningAlert } from './TokenWarningAlert';

/**
 * ReportView component displays the detailed scan results for a security header scan
 */
export const ReportView: React.FC = () => {
  // Get the report hash from the URL parameters
  const { hash } = useParams<{ hash: string }>();
  // Get query parameters to check for delete token
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');
  
  // Create a state to track whether we should show the token warning
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  
  // State is fully resolved

  // Use the custom hook to manage the report state and functionality
  const {
    report,
    isLoading,
    error,
    errorCode
  } = useReportData(hash || '');

  // Prepare header data for the tabs
  const headerData = React.useMemo(() => {
    if (!report) return { detected: [], missing: [], leaking: [] };

    // Headers in this application come in a grouped format
    // Make sure we properly handle the structure
    const headers = report.headers as unknown as {
      detected: HeaderEntry[];
      missing: HeaderEntry[];
      leaking: HeaderEntry[];
    };
    
    // Validate the structure to ensure it has the expected properties
    if (headers && 'detected' in headers && 'missing' in headers && 'leaking' in headers) {
      return headers;
    }
    
    // If we get here, something is wrong with the data format
    console.error('Unexpected headers format:', report.headers);
    return { detected: [], missing: [], leaking: [] };
  }, [report]);

  // Effect to check if we should display the token warning
  // This runs when the report and tokenParam are available
  useEffect(() => {
    if (report && tokenParam) {
      // Show token warning if there's a token in the URL
      // This is simpler and works regardless of whether the backend included the deleteToken
      setShowTokenWarning(true);
    }
  }, [report, tokenParam]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
          <Alert variant="destructive">
            <AlertTitle>Error loading report</AlertTitle>
            <AlertDescription>
              {errorCode === 'NOT_FOUND' 
                ? 'The requested report could not be found. It may have been deleted or never existed.'
                : error}
              <div className="mt-4">
                <a href="/#/" className="text-primary hover:underline">Return to Home</a>
              </div>
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  // Render the report view
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        {report && (
          <div className="space-y-8">
            {/* Report header with URL and timestamp */}
            <ReportHeader 
              url={report.url} 
              createdAt={report.created_at} 
              /* deleteToken is only available during initial scan, not in fetch report */
            />
            
            {/* Display token warning when URL has a token parameter */}
            {showTokenWarning && tokenParam && (
              <TokenWarningAlert deleteToken={tokenParam} />
            )}

            {/* Two-column layout for score and sharing with equal heights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column: Score section with gauge */}
              <div className="h-full flex">
                <div className="flex-grow">
                  <ScoreSection score={report.score} />
                </div>
              </div>
              
              {/* Right column: Sharing options */}
              <div className="h-full flex">
                <div className="flex-grow">
                  <SharingSection 
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
            
            {/* Delete report option */}
            <DeleteSection hash={report.hash} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
