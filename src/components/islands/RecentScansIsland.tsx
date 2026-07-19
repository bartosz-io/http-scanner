import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScansTable } from '@/components/ScansTable';
import { useRecentScans } from '@/hooks/useRecentScans';

export const RecentScansIsland: React.FC = () => {
  const { recentScans, isLoading, error, hasMore, loadMore, refresh } = useRecentScans(10);

  return (
    <section aria-labelledby="recent-scans-heading" className="py-12">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 id="recent-scans-heading" className="text-2xl font-semibold tracking-tight">
          Most recent scans
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button asChild size="sm">
            <a href="/reports">See all reports</a>
          </Button>
        </div>
      </div>

      <ScansTable scans={recentScans} isLoading={isLoading} error={error} />

      {hasMore && (
        <div className="mt-6 text-center">
          <Button variant="secondary" onClick={loadMore} disabled={isLoading} size="sm">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </section>
  );
};
