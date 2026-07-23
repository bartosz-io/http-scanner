import { useState, useEffect, useCallback } from 'react';
import type { FetchReportResponseDTO } from '../types';
import { isValidReportHash } from '@shared/reportHash';

class ReportApiError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
  }
}

/**
 * Custom hook for fetching and storing report data
 * @param hash The report hash identifier
 */
export function useReportData(hash: string) {
  const [report, setReport] = useState<FetchReportResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();
  const [errorCode, setErrorCode] = useState<string | undefined>();
  
  // Fetch report data
  const fetchReport = useCallback(async () => {
    // Skip fetching if hash is invalid
    if (!isValidReportHash(hash)) {
      setError('Invalid report hash format');
      setErrorCode('INVALID_HASH_FORMAT');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setErrorCode(undefined);
    
    try {
      const response = await fetch(`/api/report/${hash}`);
      
      if (!response.ok) {
        const errorData = await response.json() as { error?: string; code?: string };
        throw new ReportApiError(
          errorData.error || 'Failed to fetch report',
          errorData.code || 'UNKNOWN_ERROR'
        );
      }
      
      const data = await response.json();
      setReport(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      const errorCode = err instanceof ReportApiError ? err.code : 'UNKNOWN_ERROR';
      setError(errorMessage);
      setErrorCode(errorCode);
    } finally {
      setIsLoading(false);
    }
  }, [hash]);
  
  // Initialize data fetching
  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);
  
  return {
    report,
    isLoading,
    error,
    errorCode,
    refetchReport: fetchReport
  };
}
