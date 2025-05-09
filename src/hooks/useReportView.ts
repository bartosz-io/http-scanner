import { useState, useEffect, useCallback } from 'react';
import { FetchReportResponseDTO } from '../types';
import { HeaderTabType } from '../types/reportTypes';

/**
 * Custom hook for managing the Report View state and functionality
 * @param hash The report hash identifier
 */
export function useReportView(hash: string) {
  // State for report data, loading, and errors
  const [report, setReport] = useState<FetchReportResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();
  const [errorCode, setErrorCode] = useState<string | undefined>();
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<HeaderTabType>(HeaderTabType.DETECTED);
  
  // Delete functionality state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteToken, setDeleteToken] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  
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
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setErrorCode(err.code || 'UNKNOWN_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [hash]);
  
  // Delete report functionality
  const deleteReport = useCallback(async (token: string) => {
    // Validate token format
    if (!token || !/^[0-9a-f]{32}$/i.test(token)) {
      setDeleteError('Invalid delete token format');
      return;
    }

    setIsDeleting(true);
    setDeleteError(undefined);
    
    try {
      const response = await fetch('/api/report/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash, deleteToken: token })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete report');
      }
      
      // Success - redirect to home
      window.location.href = '/#/';
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred');
    } finally {
      setIsDeleting(false);
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
    activeTab,
    setActiveTab,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deleteToken,
    setDeleteToken,
    isDeleting,
    deleteError,
    deleteReport,
    refetchReport: fetchReport
  };
}
