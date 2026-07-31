import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScanForm } from '@/components/ScanForm';
import { ScanFormFeedback } from '@/components/ScanFormFeedback';
import { createReportPath } from '@/lib/reportLocation';
import { getScannerMode, type ScannerResultView } from '@/lib/reportView';
import type { ScanResponseDTO } from '@/types';

interface ScannerIslandProps {
  resultView?: ScannerResultView;
}

export const ScannerIsland: React.FC<ScannerIslandProps> = ({
  resultView = 'security-analysis',
}) => {
  const scannerMode = getScannerMode(resultView);
  const [error, setError] = React.useState<string>();
  const [errorCode, setErrorCode] = React.useState<string>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleScanSuccess = (response: ScanResponseDTO) => {
    window.location.assign(createReportPath(response.hash, {
      deleteToken: response.deleteToken,
      view: resultView,
    }));
  };

  const handleScanStart = () => {
    setIsSubmitting(true);
    setError(undefined);
    setErrorCode(undefined);
  };

  const handleScanError = (scanError: Error & { cause?: { code?: string } }) => {
    setIsSubmitting(false);
    setError(scanError.message);
    setErrorCode(scanError.cause?.code);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <ScanForm
        scannerMode={scannerMode}
        onScanSuccess={handleScanSuccess}
        onScanStart={handleScanStart}
        onScanError={handleScanError}
      />

      <ScanFormFeedback
        isSubmitting={isSubmitting}
        error={error}
        errorCode={errorCode}
      />

      {!isSubmitting && !error && (
        <div className="mt-6 flex justify-center">
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
            <a href="/reports">
              Browse recent scans
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};
