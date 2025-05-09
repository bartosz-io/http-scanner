import { useState, useEffect, useCallback } from 'react';
import { FetchReportResponseDTO } from '../types';

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
    if (!hash || !/^[0-9a-f]{32}$/i.test(hash)) {
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch report');
      }
      
      const data = await response.json();
      setReport(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      const errorCode = (err as { code?: string })?.code || 'UNKNOWN_ERROR';
      setError(errorMessage);
      setErrorCode(errorCode);
    } finally {
      setIsLoading(false);
    }
  }, [hash]);
  
  // Initialize data fetching
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);
  
  return {
    report,
    isLoading,
    error,
    errorCode,
    refetchReport: fetchReport
  };
}
