import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tradesApi } from '../services/api'
import { formatDecimal } from '../lib/tradeCalculations'

export default function TradeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trade, setTrade] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        setLoading(true)
        const response = await tradesApi.getById(id)
        setTrade(response)
      } catch (apiError) {
        console.error(apiError)
        setError('Trade not found')
      } finally {
        setLoading(false)
      }
    }
    fetchTrade()
  }, [id])

  if (loading) {
    return <p className="text-muted-foreground">Loading trade...</p>
  }

  if (error || !trade) {
    return (
      <div className="space-y-4">
        <p className="text-rose-400">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40"
        >
          Go back
        </button>
      </div>
    )
  }

  const metrics = [
    { label: 'PnL', value: `$${formatDecimal(trade.pnl, 2)}` },
    { label: 'R Multiple', value: trade.r_multiple ? `${formatDecimal(trade.r_multiple, 2)}R` : '—' },
    { label: 'Risk', value: trade.risk_per_trade ? `$${formatDecimal(trade.risk_per_trade, 2)}` : '—' },
    { label: 'Planned R:R', value: trade.rr_planned ? `${formatDecimal(trade.rr_planned, 2)}R` : '—' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{trade.symbol}</h1>
          <p className="text-sm text-muted-foreground">
            {trade.direction} · {trade.session || 'Session N/A'} · {new Date(trade.entry_timestamp).toLocaleString()} —{' '}
            {new Date(trade.exit_timestamp).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40"
        >
          Back
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Strategy" subtitle={trade.strategy?.category || '—'}>{trade.strategy?.name || '—'}</InfoCard>
        <InfoCard title="Account" subtitle={trade.account?.type || '—'}>{trade.account?.name || '—'}</InfoCard>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Execution</h2>
          <ul className="space-y-1 text-sm text-card-foreground">
            <li>Entry price: ${formatDecimal(trade.entry_price, 4)}</li>
            <li>Exit price: ${formatDecimal(trade.exit_price, 4)}</li>
            <li>Stop loss: {trade.stop_loss_planned ? `$${formatDecimal(trade.stop_loss_planned, 4)}` : '—'}</li>
            <li>Take profit: {trade.take_profit_planned ? `$${formatDecimal(trade.take_profit_planned, 4)}` : '—'}</li>
            <li>Quantity: {formatDecimal(trade.quantity, 2)}</li>
            <li>Commissions: ${formatDecimal(trade.commissions, 2)}</li>
          </ul>
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Notes</h2>
          <p className="text-sm text-muted-foreground">{trade.notes || 'No additional notes recorded.'}</p>
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Tags</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {trade.tags?.length
                ? trade.tags.map((tag) => (
                    <span key={tag.id} className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                      {tag.name}
                    </span>
                  ))
                : <span className="text-xs text-muted-foreground">No tags</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
          Confirmations ({trade.confirmations_count || 0})
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {trade.confirmations?.length ? (
            trade.confirmations.map((confirmation) => (
              <span key={confirmation} className="rounded-full bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                {confirmation}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No confirmations recorded</span>
          )}
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-card-foreground">{value}</p>
    </div>
  )
}

function InfoCard({ title, subtitle, children }) {
  return (
    <div className="space-y-1 rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase text-muted-foreground">{title}</p>
      <p className="text-lg font-semibold text-card-foreground">{children}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}
