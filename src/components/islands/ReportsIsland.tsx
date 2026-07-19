import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScansTable } from '@/components/ScansTable';
import { useRecentScans } from '@/hooks/useRecentScans';

export const ReportsIsland: React.FC = () => {
  const { recentScans, isLoading, error, hasMore, loadMore, refresh } = useRecentScans(25);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
          <RefreshCw className="h-4 w-4" />
          Refresh reports
        </Button>
      </div>

      <ScansTable scans={recentScans} isLoading={isLoading} error={error} />

      {hasMore && (
        <div className="mt-8 text-center">
          <Button variant="secondary" onClick={loadMore} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load more reports
          </Button>
        </div>
      )}
    </div>
  );
};
