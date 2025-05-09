import React from 'react';
import { useParams } from 'react-router-dom';
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

/**
 * ReportView component displays the detailed scan results for a security header scan
 */
export const ReportView: React.FC = () => {
  // Get the report hash from the URL parameters
  const { hash } = useParams<{ hash: string }>();

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
            
            {/* Score section with gauge */}
            <ScoreSection score={report.score} />
            
            {/* Headers section with tabs */}
            <HeadersSection headers={headerData} />
            
            {/* Sharing options */}
            <SharingSection 
              url={report.url} 
              score={report.score} 
              hash={report.hash} 
              shareImageUrl={report.share_image_url} 
            />
            
            {/* Delete report option */}
            <DeleteSection hash={report.hash} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
