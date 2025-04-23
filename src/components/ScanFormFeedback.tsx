import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Loader2, Globe } from "lucide-react";

export interface ScanFormFeedbackProps {
  isSubmitting: boolean;
  error?: string;
  errorCode?: string; // e.g. "RATE_LIMIT_EXCEEDED", "INVALID_URL", "SCAN_TIMEOUT"
}

export const ScanFormFeedback: React.FC<ScanFormFeedbackProps> = ({ 
  isSubmitting, 
  error, 
  errorCode 
}: ScanFormFeedbackProps) => {
  if (isSubmitting) {
    return (
      <div className="flex justify-center items-center mt-6 text-primary animate-pulse" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="font-medium">Scanning website headers...</p>
      </div>
    );
  }

  if (error) {
    // Special handling for rate limit errors
    if (errorCode === 'RATE_LIMIT_EXCEEDED') {
      return (
        <Alert variant="default" className="mt-6 border-amber-500 bg-amber-50 dark:bg-amber-950/20" role="alert">
          <Clock className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-700 font-semibold">Rate Limit Exceeded</AlertTitle>
          <AlertDescription className="text-amber-700">
            This domain was scanned recently. Please wait at least one minute between scans of the same domain.
            <div className="mt-2 text-sm">
              You can search for existing reports in the <a href="/#/reports" className="underline font-medium hover:text-amber-800">Reports section</a>.
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
    // Special handling for timeout errors
    if (errorCode === 'SCAN_TIMEOUT') {
      return (
        <Alert variant="destructive" className="mt-6" role="alert">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Scan Timeout</AlertTitle>
          <AlertDescription>
            The scan request timed out. The website might be down or responding too slowly.
            <div className="mt-2 text-sm">
              Try again later or check if the website is accessible in your browser.
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
    // Special handling for invalid URL errors
    if (errorCode === 'INVALID_URL') {
      return (
        <Alert variant="destructive" className="mt-6" role="alert">
          <Globe className="h-5 w-5" />
          <AlertTitle>Invalid URL</AlertTitle>
          <AlertDescription>
            The URL you entered is not valid. Please enter a complete URL including the protocol (http:// or https://).
            <div className="mt-2 text-sm">
              Example: https://example.com
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
    // Generic error handling
    return (
      <Alert variant="destructive" className="mt-6" role="alert">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <div className="mt-2 text-sm">
            If this problem persists, please try again later.
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
