import { cn } from '@/lib/utils';

export function ReportSignatureBlock({
  label,
  name,
  subtitle,
  align = 'left',
  className,
}: {
  label: string;
  name?: string | null;
  subtitle?: string | null;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'report-section-keep',
        align === 'center' ? 'text-center' : 'text-left',
        className,
      )}
    >
      <div className={cn('pt-4', align === 'center' ? 'mx-auto w-40' : 'w-40')}>
        <div className="border-t border-slate-500" />
      </div>
      <p className="mt-1.5 text-[12px] font-semibold text-slate-700">{label}</p>
      {name ? (
        <p className="mt-1.5 text-[12.75px] font-semibold text-slate-950">{name}</p>
      ) : null}
      {subtitle ? (
        <p className="mt-0.5 text-[12px] text-slate-600">{subtitle}</p>
      ) : null}
    </div>
  );
}
