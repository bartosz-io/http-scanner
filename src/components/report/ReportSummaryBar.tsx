import type { ReportHeaderProps, ReportViewSwitchProps } from '@/types/reportTypes';
import { ReportHeader } from './ReportHeader';
import { ReportViewSwitch } from './ReportViewSwitch';

type ReportSummaryBarProps = Pick<ReportHeaderProps, 'url' | 'createdAt'> &
  ReportViewSwitchProps;

export function ReportSummaryBar({
  url,
  createdAt,
  value,
  onChange,
}: ReportSummaryBarProps) {
  return (
    <section
      aria-label="Report summary"
      className="grid min-w-0 items-center gap-4 border-b pb-4 lg:grid-cols-[minmax(0,1fr)_auto]"
    >
      <ReportHeader url={url} createdAt={createdAt} />
      <div className="min-w-0 lg:justify-self-end">
        <ReportViewSwitch value={value} onChange={onChange} />
      </div>
    </section>
  );
}
