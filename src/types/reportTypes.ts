import type { FetchReportResponseDTO, HeaderEntry } from '../types';
import type {
  AllResponseHeader,
  ScannerResultView,
} from '../lib/reportView';

/**
 * Enum representing the different types of header tabs in the Report View
 */
export enum HeaderTabType {
  DETECTED = "detected",
  MISSING = "missing",
  LEAKING = "leaking"
}

/**
 * Props for the ReportHeader component
 */
export interface ReportHeaderProps {
  url: string;
  createdAt: number;
  deleteToken?: string;
}

export interface ReportViewProps {
  hash: string;
  token: string | null;
  view: ScannerResultView;
  onViewChange(view: ScannerResultView): void;
}

export interface ReportViewSwitchProps {
  value: ScannerResultView;
  onChange(view: ScannerResultView): void;
}

export interface AllHeadersSectionProps {
  headers: AllResponseHeader[];
  linkGuides?: boolean;
}

export interface AllHeaderCardProps {
  header: AllResponseHeader;
}

/**
 * Props for the ScoreSection component
 */
export interface ScoreSectionProps {
  score: number;
}

/**
 * Props for the ScoreGauge component
 */
export interface ScoreGaugeProps {
  score: number;
}

/**
 * Props for the HeadersSection component
 */
export interface HeadersSectionProps {
  headers: {
    detected: HeaderEntry[];
    missing: HeaderEntry[];
    leaking: HeaderEntry[];
  };
}

/**
 * Props for the HeaderTabs component
 */
export interface HeaderTabsProps {
  activeTab: HeaderTabType;
  onTabChange: (tab: HeaderTabType) => void;
}

/**
 * Props for the HeaderList component
 */
export interface HeaderListProps {
  headers: HeaderEntry[];
  type: HeaderTabType;
}

/**
 * Props for the SharingSection component
 */
export interface SharingSectionProps {
  url: string;
  score: number;
  hash: string;
  shareImageUrl: string | null;
}

/**
 * Props for the DeleteSection component
 */
export interface DeleteSectionProps {
  hash: string;
}

/**
 * Props for the DeleteConfirmationModal component
 */
export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (token: string) => void;
  errorMessage?: string;
  isSubmitting: boolean;
}

/**
 * View model for the Report View
 */
export interface ReportViewModel {
  report: FetchReportResponseDTO | null;
  isLoading: boolean;
  error?: string;
  errorCode?: string;
  activeTab: HeaderTabType;
  isDeleteModalOpen: boolean;
  deleteToken: string;
  isDeleting: boolean;
  deleteError?: string;
}
