import { LeadForm } from './LeadForm';
import { SharingSection } from './SharingSection';
import type { SharingSectionProps } from '@/types/reportTypes';

export function ReportActionSection(props: SharingSectionProps) {
  if (props.score < 80) {
    return <LeadForm hash={props.hash} score={props.score} />;
  }

  return <SharingSection {...props} />;
}
