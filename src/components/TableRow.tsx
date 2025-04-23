import React from 'react';
import { ReportListItemDTO } from '../types';
import { useNavigate } from 'react-router-dom';
import { TableCell, TableRow as ShadcnTableRow } from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';

interface TableRowProps {
  scan: ReportListItemDTO;
}

export const TableRow: React.FC<TableRowProps> = ({ scan }: TableRowProps) => {
  const navigate = useNavigate();
  
  // Format the URL for display (truncate if too long)
  const displayUrl = () => {
    try {
      const url = new URL(scan.url);
      
      // Get hostname and pathname, but ensure no trailing slash for display
      let pathname = url.pathname;
      if (pathname === '/') {
        pathname = ''; // Remove slash for domain-only URLs
      } else if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1); // Remove trailing slash for paths
      }
      
      const display = `${url.hostname}${pathname}`;
      return display.length > 50 ? `${display.substring(0, 47)}...` : display;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return scan.url.length > 50 ? `${scan.url.substring(0, 47)}...` : scan.url;
    }
  };
  
  // Format the date as relative time
  const formatDate = () => {
    try {
      const date = new Date(scan.created_at * 1000); // Convert Unix timestamp to milliseconds
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };
  
  const getScoreColorClass = () => {
    if (scan.score >= 80) return 'text-green-600 dark:text-green-500';
    if (scan.score >= 60) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-red-600 dark:text-red-500';
  };
  
  const handleRowClick = () => {
    navigate(`/report/${scan.hash}`);
  };
  
  return (
    <ShadcnTableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors text-left"
      onClick={handleRowClick}
    >
      <TableCell className="font-medium text-left">{displayUrl()}</TableCell>
      <TableCell className="text-left">{formatDate()}</TableCell>
      <TableCell className={`font-medium text-left ${getScoreColorClass()}`}>
        {scan.score.toFixed(1)}
      </TableCell>
    </ShadcnTableRow>
  );
};
