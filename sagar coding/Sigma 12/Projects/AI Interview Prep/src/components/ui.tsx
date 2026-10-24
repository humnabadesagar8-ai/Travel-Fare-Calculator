import type { LucideIcon } from 'lucide-react';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  accent = 'accent',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  accent?: 'accent' | 'success' | 'warning' | 'error' | 'violet';
}) {
  const colorMap: Record<string, string> = {
    accent: 'text-accent-400 bg-accent-500/10 ring-accent-500/20',
    success: 'text-success-400 bg-success-500/10 ring-success-500/20',
    warning: 'text-warning-400 bg-warning-500/10 ring-warning-500/20',
    error: 'text-error-400 bg-error-500/10 ring-error-500/20',
    violet: 'text-violet-400 bg-violet-500/10 ring-violet-500/20',
  };
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-400">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${colorMap[accent]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold text-white">{value}</div>
      {trend && <div className="mt-1 text-xs text-ink-500">{trend}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
        <Icon className="h-7 w-7 text-ink-500" />
      </div>
      <p className="text-sm font-medium text-ink-300">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-xs text-ink-500">{subtitle}</p>}
    </div>
  );
}
