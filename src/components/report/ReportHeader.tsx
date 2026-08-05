import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ReportHeaderProps } from '../../types/reportTypes';

/**
 * ReportHeader component displays the URL and timestamp of the scan
 * along with an optional alert for the delete token
 */
export const ReportHeader: React.FC<ReportHeaderProps> = ({ url, createdAt, deleteToken }) => {
  // Format the timestamp as a readable date
  const formattedDate = new Date(createdAt * 1000).toLocaleString();

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-2xl font-bold">Security Scan Report</h1>
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
          <div
            className="min-w-0 max-w-full truncate font-medium"
            title={url}
          >
            {url}
          </div>
          <div className="text-sm whitespace-nowrap text-muted-foreground">
            Scanned {formattedDate}
          </div>
        </div>
      </div>

      {/* DeleteToken alert - only shown when the token is available (first view) */}
      {deleteToken && (
        <Alert>
          <AlertDescription>
            <div className="font-medium">Important: Save this delete token</div>
            <div className="ph-no-capture ph-mask mt-1 break-all font-mono text-sm">
              {deleteToken}
            </div>
            <div className="mt-2 text-sm">You will need this token if you want to delete this report later. It will only be shown once.</div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
