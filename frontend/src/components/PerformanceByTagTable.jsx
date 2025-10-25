import { cn } from '../lib/utils'

export default function PerformanceByTagTable({ data }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getPnlColor = (pnl) => {
    return pnl > 0 ? 'text-emerald-400' : 'text-rose-400'
  }

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden border border-border transition-colors">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground">Performance by Tag</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total P&L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Trades
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-muted/40 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  {item.tag_name}
                </td>
                <td className={cn(
                  "px-6 py-4 whitespace-nowrap text-sm font-medium",
                  getPnlColor(item.total_pnl)
                )}>
                  {formatCurrency(item.total_pnl)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {formatPercentage(item.win_rate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {item.trade_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tag data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
