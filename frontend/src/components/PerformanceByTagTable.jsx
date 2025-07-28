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
    return pnl > 0 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Performance by Tag</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total P&L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trades
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.tag_name}
                </td>
                <td className={cn(
                  "px-6 py-4 whitespace-nowrap text-sm font-medium",
                  getPnlColor(item.total_pnl)
                )}>
                  {formatCurrency(item.total_pnl)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPercentage(item.win_rate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.trade_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No tag data available</p>
          </div>
        )}
      </div>
    </div>
  )
}