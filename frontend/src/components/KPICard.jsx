import { cn } from '../lib/utils'

export default function KPICard({ title, value, subtitle, trend, className }) {
  const formatValue = (val) => {
    if (typeof val === 'number') {
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
    if (!trend) return 'text-gray-500'
    return trend > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getTrendIcon = () => {
    if (!trend) return null
    return trend > 0 ? '↗' : '↘'
  }

  return (
    <div className={cn('bg-white rounded-lg shadow p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
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