import React from 'react';
import { useRecentScans } from '../hooks/useRecentScans';
import { ScansTable } from './ScansTable.tsx';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw } from "lucide-react";

export const RecentScansSection: React.FC = () => {
  const navigate = useNavigate();
  const { recentScans, isLoading, error, hasMore, loadMore, refresh } = useRecentScans(10);

  return (
    <section className="pt-8 pb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Most recent scans</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate('/reports')}
            className="whitespace-nowrap"
          >
            See All Reports
          </Button>
        </div>
      </div>
      
      <div className="rounded-md">
        <ScansTable 
          scans={recentScans} 
          isLoading={isLoading} 
          error={error} 
        />
        
        {hasMore && (
          <div className="mt-6 mb-4 text-center">
            <Button 
              variant="secondary" 
              onClick={loadMore} 
              disabled={isLoading}
              size="sm"
              className="px-4"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load More
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
