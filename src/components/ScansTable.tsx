import React from 'react';
import { ReportListItemDTO } from '../types';
import { TableRow } from './TableRow.tsx';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as ShadcnTableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScansTableProps {
  scans: ReportListItemDTO[];
  isLoading: boolean;
  error?: string;
}

export const ScansTable: React.FC<ScansTableProps> = ({ scans, isLoading, error }: ScansTableProps) => {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="border rounded-md text-left">
      <Table>
        {scans.length === 0 && !isLoading && (
          <TableCaption>No scan reports available.</TableCaption>
        )}
        <TableHeader>
          <ShadcnTableRow className="text-left">
            <TableHead className="w-[50%] text-left">URL</TableHead>
            <TableHead className="w-[30%] text-left">Date</TableHead>
            <TableHead className="text-left">Score</TableHead>
          </ShadcnTableRow>
        </TableHeader>
        <TableBody>
          {isLoading && scans.length === 0 ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <ShadcnTableRow key={`loading-${index}`}>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
              </ShadcnTableRow>
            ))
          ) : (
            scans.map((scan) => (
              <TableRow key={scan.hash} scan={scan as ReportListItemDTO} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
