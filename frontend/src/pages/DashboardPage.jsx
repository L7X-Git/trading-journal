import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import KPICard from '../components/KPICard'
import EquityChart from '../components/EquityChart'
import PerformanceByTagTable from '../components/PerformanceByTagTable'
import SelectField from '../components/SelectField'
import { dashboardApi } from '../services/api'
import { formatDecimal } from '../lib/tradeCalculations'

const DIRECTIONS = ['Long', 'Short']
const SESSIONS = ['NY', 'London', 'Asia']
const toNumeric = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'number') return Number.isNaN(value) ? fallback : value
  const numeric = Number(value)
  return Number.isNaN(numeric) ? fallback : numeric
}

export default function DashboardPage() {
  const [filters, setFilters] = useState({ direction: '', session: '', start_date: '', end_date: '' })
  const [kpis, setKpis] = useState(null)
  const [equityCurve, setEquityCurve] = useState([])
  const [performanceByTag, setPerformanceByTag] = useState([])
  const [strategySummary, setStrategySummary] = useState([])
  const [accountSummary, setAccountSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {
        direction: filters.direction || undefined,
        session: filters.session || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      }

      const [kpiData, equityData, tagData, strategyData, accountData] = await Promise.all([
        dashboardApi.getKPIs(),
        dashboardApi.getEquityCurve(),
        dashboardApi.getPerformanceByTag(),
        dashboardApi.getStrategySummary(params),
        dashboardApi.getAccountSummary(params),
      ])

      setKpis(kpiData)
      setEquityCurve(equityData)
      setPerformanceByTag(tagData)
      setStrategySummary(strategyData)
      setAccountSummary(accountData)
      setError('')
    } catch (apiError) {
      console.error(apiError)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const totalPnl = toNumeric(kpis?.total_pnl)
  const winRate = toNumeric(kpis?.win_rate)
  const totalTrades = toNumeric(kpis?.total_trades)
  const profitFactor = kpis?.profit_factor ?? 0
  const averageWin = toNumeric(kpis?.average_win)
  const averageLoss = Math.abs(toNumeric(kpis?.average_loss))
  const winningTrades = toNumeric(kpis?.winning_trades)
  const trendValue = totalPnl === 0 ? undefined : totalPnl > 0 ? 8 : -8

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-muted/60" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-28 rounded bg-muted/60" />
            ))}
          </div>
          <div className="h-96 rounded bg-muted/60" />
          <div className="h-64 rounded bg-muted/60" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-rose-400">{error}</p>
        <button
          onClick={fetchData}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            High-level pulse with filters that flow through strategy and account analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <SelectField
            value={filters.direction}
            onChange={(event) => handleFilterChange('direction', event.target.value)}
            emptyAsPlaceholder={false}
            className="min-w-[150px]"
          >
            <option value="">All Directions</option>
            {DIRECTIONS.map((direction) => (
              <option key={direction} value={direction}>
                {direction}
              </option>
            ))}
          </SelectField>
          <SelectField
            value={filters.session}
            onChange={(event) => handleFilterChange('session', event.target.value)}
            emptyAsPlaceholder={false}
            className="min-w-[150px]"
          >
            <option value="">All Sessions</option>
            {SESSIONS.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </SelectField>
          <input
            type="date"
            value={filters.start_date}
            onChange={(event) => handleFilterChange('start_date', event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
          <input
            type="date"
            value={filters.end_date}
            onChange={(event) => handleFilterChange('end_date', event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total P&L" value={totalPnl} trend={trendValue} />
        <KPICard
          title="Win Rate"
          value={winRate}
          subtitle={`${winningTrades} of ${totalTrades} trades`}
        />
        <KPICard title="Total Trades" value={totalTrades} />
        <KPICard title="Profit Factor" value={profitFactor} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <EquityChart data={equityCurve} />
        <PerformanceByTagTable data={performanceByTag} />
      </section>

      {kpis && (
        <section className="grid gap-4 md:grid-cols-2">
          <KPICard title="Average Win" value={averageWin} className="bg-emerald-500/10" />
          <KPICard title="Average Loss" value={averageLoss} className="bg-rose-500/10" />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <SummaryCard
          title="Strategies"
          description="Performance by strategy (R based)."
          data={strategySummary}
          dataKey="strategy_name"
        />
        <SummaryCard
          title="Accounts"
          description="Account health and expectancy."
          data={accountSummary}
          dataKey="account_name"
          secondaryKey="current_balance"
        />
      </section>
    </div>
  )
}

function SummaryCard({ title, description, data, dataKey, secondaryKey }) {
  const toNumber = (value) => {
    if (value === null || value === undefined) return value
    return typeof value === 'string' ? Number(value) : value
  }

  const formatPercent = (value) => {
    const numericValue = toNumber(value)
    if (numericValue === null || numericValue === undefined) return '—'
    if (!Number.isFinite(numericValue)) return numericValue > 0 ? '∞%' : numericValue < 0 ? '−∞%' : '—'
    return `${(numericValue * 100).toFixed(1)}%`
  }

  const formatMetric = (value, suffix = 'R', decimals = 2) => {
    const numericValue = toNumber(value)
    if (numericValue === null || numericValue === undefined) return '—'
    if (!Number.isFinite(numericValue)) {
      if (numericValue === Infinity) return `∞${suffix}`
      if (numericValue === -Infinity) return `−∞${suffix}`
      return '—'
    }
    return `${numericValue.toFixed(decimals)}${suffix}`
  }

  const formatFactor = (value) => {
    const numericValue = toNumber(value)
    if (numericValue === null || numericValue === undefined) return '—'
    if (!Number.isFinite(numericValue)) {
      if (numericValue === Infinity) return '∞'
      if (numericValue === -Infinity) return '−∞'
      return '—'
    }
    return numericValue.toFixed(2)
  }

  const toDisplayBalance = (value) => formatDecimal(value, 2)

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow">
      <div>
        <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey={dataKey} stroke="rgba(148, 163, 184, 0.7)" tick={{ fontSize: 12 }} />
            <YAxis stroke="rgba(148, 163, 184, 0.7)" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(val) => {
                const numericVal = toNumber(val)
                if (Number.isFinite(numericVal)) {
                  return numericVal.toFixed(2)
                }
                if (numericVal === Infinity) return '∞'
                if (numericVal === -Infinity) return '−∞'
                return '—'
              }}
              contentStyle={{ background: '#1f2937', color: '#f9fafb', borderRadius: 8 }}
            />
            <Bar dataKey="total_r" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Total R" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">{title.slice(0, -1)}</th>
              <th className="px-3 py-2 text-right">Trades</th>
              <th className="px-3 py-2 text-right">Win Rate</th>
              <th className="px-3 py-2 text-right">Expectancy (R)</th>
              <th className="px-3 py-2 text-right">Profit Factor</th>
              <th className="px-3 py-2 text-right">Total R</th>
              <th className="px-3 py-2 text-right">Avg R</th>
              <th className="px-3 py-2 text-right">PnL</th>
              {secondaryKey && <th className="px-3 py-2 text-right">Current Balance</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row) => (
              <tr key={row[dataKey]} className="hover:bg-muted/40">
                <td className="px-3 py-2 font-medium">{row[dataKey]}</td>
                <td className="px-3 py-2 text-right">{row.trades}</td>
                <td className="px-3 py-2 text-right">{formatPercent(row.win_rate)}</td>
                <td className="px-3 py-2 text-right">{formatMetric(row.expectancy_r)}</td>
                <td className="px-3 py-2 text-right">{formatFactor(row.profit_factor)}</td>
                <td className="px-3 py-2 text-right">{formatMetric(row.total_r)}</td>
                <td className="px-3 py-2 text-right">{formatMetric(row.average_r)}</td>
                <td className="px-3 py-2 text-right">${toDisplayBalance(row.total_pnl)}</td>
                {secondaryKey && (
                  <td className="px-3 py-2 text-right">${toDisplayBalance(row[secondaryKey])}</td>
                )}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={secondaryKey ? 9 : 8} className="px-3 py-4 text-center text-muted-foreground">
                  No data for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
