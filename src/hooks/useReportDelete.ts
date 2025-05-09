import { useState, useCallback } from 'react';

/**
 * Custom hook for report deletion functionality
 * @param hash The report hash identifier
 */
export function useReportDelete(hash: string) {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [hash]);
  
  return {
    isDeleting,
    deleteError,
    deleteReport
  };
}
