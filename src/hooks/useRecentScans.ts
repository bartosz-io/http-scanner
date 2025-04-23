import { useState, useEffect, useCallback } from 'react';
import { ReportListItemDTO, ReportsResponseDTO } from '../types';

export const useRecentScans = (limit = 10) => {
  const [recentScans, setRecentScans] = useState<{
    scans: ReportListItemDTO[];
    isLoading: boolean;
    error?: string;
    next?: string;
  }>({
    scans: [],
    isLoading: true,
    error: undefined,
    next: undefined
  });

  const fetchRecentScans = async (cursor?: string): Promise<void> => {
    setRecentScans(prev => ({
      ...prev,
      isLoading: true,
      error: undefined
    }));

    try {
      // Build URL with query parameters
      const url = new URL('/api/reports', window.location.origin);
      url.searchParams.append('limit', limit.toString());
      // Use sort=-created_at format for descending order (newest first)
      url.searchParams.append('sort', '-created_at');
      if (cursor) {
        url.searchParams.append('cursor', cursor);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent scans');
      }

      const data: ReportsResponseDTO = await response.json();
      
      setRecentScans(prev => ({
        ...prev,
        scans: cursor ? [...prev.scans, ...data.items] : data.items,
        next: data.next,
        isLoading: false
      }));
    } catch (error) {
      setRecentScans(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred while fetching recent scans'
      }));
    }
  };

  const loadMore = () => {
    if (recentScans.next && !recentScans.isLoading) {
      fetchRecentScans(recentScans.next);
    }
  };

  useEffect(() => {
    fetchRecentScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  // Function to refresh the scans list
  const refresh = useCallback(() => {
    fetchRecentScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { 
    recentScans: recentScans.scans, 
    isLoading: recentScans.isLoading, 
    error: recentScans.error,
    hasMore: Boolean(recentScans.next),
    loadMore,
    refresh
  };
};
