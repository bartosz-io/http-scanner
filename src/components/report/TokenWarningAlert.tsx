import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Info, Copy, Check } from 'lucide-react';

interface TokenWarningAlertProps {
  deleteToken: string;
}

/**
 * TokenWarningAlert displays information about the delete token to the user
 * This is only shown on the initial view after a scan is performed
 */
export const TokenWarningAlert: React.FC<TokenWarningAlertProps> = ({ deleteToken }) => {
  // State to track if token has been copied to clipboard
  const [copied, setCopied] = useState(false);
  
  // Function to copy token to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(deleteToken)
      .then(() => {
        setCopied(true);
        // Reset copy status after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };
  
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-red-50 border border-red-200 text-foreground py-2 px-4 rounded-lg">
        <div className="flex items-center gap-3">
          <Info className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-xs font-medium flex-shrink-0">
            Save this token for deletion:
          </span>
          <div className="flex-1 p-1.5 bg-background border rounded-md font-mono text-xs overflow-hidden flex min-w-0">
            <div className="truncate">
              {deleteToken}
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 px-2 text-[10px] whitespace-nowrap flex-shrink-0 bg-white border-red-200 hover:bg-red-50"
            onClick={copyToClipboard}
          >
          {copied ? (
            <span className="flex items-center justify-center gap-0.5 text-green-600 font-medium">
              <Check className="h-2.5 w-2.5" />
              Copied
            </span>
          ) : (
            <span className="flex items-center justify-center gap-0.5 text-red-600 hover:text-red-700 font-medium">
              <Copy className="h-2.5 w-2.5" />
              Copy
            </span>
          )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          This token is only shown once and required if you ever need to delete this report for privacy reasons.
        </p>
      </div>
    </div>
  );
};
