import { classNames, formatCompact } from '../lib/format'

export function StatCard({ icon: Icon, label, value, delta, deltaLabel, tone = 'accent', subtitle }) {
  const tones = {
    accent: 'bg-os-accent/10 text-os-accent',
    success: 'bg-os-success/10 text-os-success',
    warning: 'bg-os-warning/10 text-os-warning',
    danger: 'bg-os-danger/10 text-os-danger',
    info: 'bg-os-info/10 text-os-info',
  }
  return (
    <div className="os-card p-5 animate-slide-up hover:border-os-accent/40 transition-colors">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-os-muted uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-os-text mt-1.5 tabular-nums">
            {typeof value === 'number' ? formatCompact(value) : value}
          </p>
          {subtitle && <p className="text-xs text-os-muted mt-1 truncate">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={classNames('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', tones[tone])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={classNames('font-semibold', delta >= 0 ? 'text-os-success' : 'text-os-danger')}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
          {deltaLabel && <span className="text-os-muted">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}
