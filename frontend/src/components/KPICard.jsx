import { cn } from '../lib/utils'

export default function KPICard({ title, value, subtitle, trend, className }) {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (!Number.isFinite(val)) {
        if (val === Infinity) return '∞'
        if (val === -Infinity) return '−∞'
        return '—'
      }
      if (title.includes('Rate') || title.includes('Factor')) {
        return val.toFixed(2)
      }
      return val.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      })
    }
    return val
  }

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground'
    return trend > 0 ? 'text-emerald-400' : 'text-rose-400'
  }

  const getTrendIcon = () => {
    if (!trend) return null
    return trend > 0 ? '↗' : '↘'
  }

  return (
    <div className={cn('bg-card text-card-foreground rounded-lg shadow p-6 transition-colors', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={cn('flex items-center', getTrendColor())}>
            <span className="text-lg mr-1">{getTrendIcon()}</span>
            <span className="text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
