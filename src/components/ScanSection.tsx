import React from 'react';
import { ScanForm } from './ScanForm';
import { ScanFormFeedback } from './ScanFormFeedback';
import { ScanResponseDTO } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import scannerLogo from '../assets/scanner-logo.png';

export const ScanSection: React.FC = () => {
  const navigate = useNavigate();
  // Store scan result in state to potentially use it later for additional features
  const [, setScanResult] = React.useState<ScanResponseDTO | null>(null);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [errorCode, setErrorCode] = React.useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const handleScanSuccess = (response: ScanResponseDTO) => {
    setScanResult(response);
    // Navigate to the report page after successful scan
    // Include the delete token as a query parameter for the initial view
    // This ensures the user gets the delete token only on the first view after scanning
    navigate(`/report/${response.hash}?token=${response.deleteToken}`);
  };

  const handleScanStart = () => {
    setIsSubmitting(true);
    setError(undefined);
    setErrorCode(undefined);
  };

  const handleScanError = (error: Error & { cause?: { code?: string } }) => {
    setIsSubmitting(false);
    setError(error.message);
    setErrorCode(error.cause?.code);
  };

  return (
    <section className="py-10 px-6 bg-gradient-to-b from-muted/40 to-muted/10 rounded-lg border border-border/50 shadow-sm">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
          <img 
            src={scannerLogo} 
            alt="HTTP Scanner Logo" 
            className="h-6 w-6" 
          />
        </div>
        
        <h2 className="text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
          Scan Your Website for Security Headers
        </h2>
        
        <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
          Enter your website URL below to analyze HTTP security headers and get a comprehensive security report.
        </p>
        
        <ScanForm 
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
          <div className="mt-8 flex justify-center">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate('/reports')}
            >
              View recent scans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
