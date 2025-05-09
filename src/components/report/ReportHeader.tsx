import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReportHeaderProps } from '../../types/reportTypes';

/**
 * ReportHeader component displays the URL and timestamp of the scan
 * along with an optional alert for the delete token
 */
export const ReportHeader: React.FC<ReportHeaderProps> = ({ url, createdAt, deleteToken }) => {
  // Format the timestamp as a readable date
  const formattedDate = new Date(createdAt * 1000).toLocaleString();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Security Scan Report</h1>
        <div className="text-lg">
          <span className="font-medium">URL:</span> {url}
        </div>
        <div className="text-sm text-muted-foreground">
          Scanned on {formattedDate}
        </div>
      </div>

      {/* DeleteToken alert - only shown when the token is available (first view) */}
      {deleteToken && (
        <Alert>
          <AlertDescription>
            <div className="font-medium">Important: Save this delete token</div>
            <div className="mt-1 text-sm break-all font-mono">{deleteToken}</div>
            <div className="mt-2 text-sm">You will need this token if you want to delete this report later. It will only be shown once.</div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
