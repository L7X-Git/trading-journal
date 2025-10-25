import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'
import { formatDecimal } from '../lib/tradeCalculations'

export default function TradesTable({ trades }) {
  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0))

  const formatDateTime = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  const getPnlColor = (pnl) => {
    const amount = Number(pnl)
    if (amount > 0) return 'text-emerald-400'
    if (amount < 0) return 'text-rose-400'
    return 'text-muted-foreground'
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-card-foreground">Trades</h3>
        <span className="text-xs text-muted-foreground">{trades.length} results</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50 uppercase tracking-wider text-muted-foreground">
            <tr>
              <TableHeader>Symbol</TableHeader>
              <TableHeader>Direction</TableHeader>
              <TableHeader>Strategy</TableHeader>
              <TableHeader>Account</TableHeader>
              <TableHeader>Entry</TableHeader>
              <TableHeader>Exit</TableHeader>
              <TableHeader>Qty</TableHeader>
              <TableHeader>P&amp;L</TableHeader>
              <TableHeader>R Multiple</TableHeader>
              <TableHeader>Confirm.</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-card-foreground">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-6 py-3 font-medium">
                  <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                    {trade.symbol}
                  </Link>
                </td>
                <td className="px-6 py-3 text-muted-foreground">{trade.direction}</td>
                <td className="px-6 py-3">{trade.strategy?.name || '—'}</td>
                <td className="px-6 py-3">{trade.account?.name || '—'}</td>
                <td className="px-6 py-3 text-muted-foreground">{formatDateTime(trade.entry_timestamp || trade.entryDateTime)}</td>
                <td className="px-6 py-3 text-muted-foreground">{formatDateTime(trade.exit_timestamp || trade.exitDateTime)}</td>
                <td className="px-6 py-3">{formatDecimal(trade.quantity, 2)}</td>
                <td className={cn('px-6 py-3 font-semibold', getPnlColor(trade.pnl))}>{formatCurrency(trade.pnl)}</td>
                <td className="px-6 py-3">{trade.r_multiple ? `${formatDecimal(trade.r_multiple, 2)}R` : '—'}</td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                    {trade.confirmations_count || 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {trades.length === 0 && <p className="py-8 text-center text-muted-foreground">No trades found</p>}
      </div>
    </div>
  )
}

function TableHeader({ children }) {
  return <th className="px-6 py-3 text-left text-xs font-medium">{children}</th>
}
