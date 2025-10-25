import { useEffect, useState } from 'react'
import { accountsApi, strategiesApi, tradesApi } from '../services/api'
import TradesTable from '../components/TradesTable'
import SelectField from '../components/SelectField'

const DIRECTIONS = ['Long', 'Short']
const SESSIONS = ['NY', 'London', 'Asia']

export default function TradesListPage() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [strategies, setStrategies] = useState([])
  const [accounts, setAccounts] = useState([])

  const [filters, setFilters] = useState({
    symbol: '',
    strategy_id: '',
    account_id: '',
    direction: '',
    session: '',
    start_date: '',
    end_date: '',
  })

  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  })

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [strategyList, accountList] = await Promise.all([strategiesApi.list(), accountsApi.list()])
        setStrategies(strategyList)
        setAccounts(accountList)
      } catch (loadError) {
        console.error('Failed to load filter data', loadError)
      }
    }
    loadFilters()
  }, [])

  useEffect(() => {
    fetchTrades()
  }, [pagination.page, filters])

  const fetchTrades = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        symbol: filters.symbol || undefined,
        strategy_id: filters.strategy_id || undefined,
        account_id: filters.account_id || undefined,
        direction: filters.direction || undefined,
        session: filters.session || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      }

      const response = await tradesApi.getTrades(params)
      setTrades(response.trades)
      setPagination((prev) => ({
        ...prev,
        total: response.total,
        total_pages: Math.ceil(response.total / response.per_page),
      }))
      setError('')
    } catch (apiError) {
      console.error('Trades error:', apiError)
      setError('Failed to load trades')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      symbol: '',
      strategy_id: '',
      account_id: '',
      direction: '',
      session: '',
      start_date: '',
      end_date: '',
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-muted/60" />
          <div className="h-20 rounded bg-muted/60" />
          <div className="h-96 rounded bg-muted/60" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-rose-400">{error}</p>
        <button
          onClick={fetchTrades}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trades</h1>
        <p className="text-sm text-muted-foreground">
          Drill into executions with contextual filters on strategy, account, direction, and session.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <FilterField label="Symbol">
            <input
              value={filters.symbol}
              onChange={(event) => handleFilterChange('symbol', event.target.value)}
              placeholder="e.g., NQ1!"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </FilterField>
          <FilterField label="Strategy">
            <SelectField
              value={filters.strategy_id}
              onChange={(event) => handleFilterChange('strategy_id', event.target.value)}
              emptyAsPlaceholder={false}
            >
              <option value="">All</option>
              {strategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </SelectField>
          </FilterField>
          <FilterField label="Account">
            <SelectField
              value={filters.account_id}
              onChange={(event) => handleFilterChange('account_id', event.target.value)}
              emptyAsPlaceholder={false}
            >
              <option value="">All</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </SelectField>
          </FilterField>
          <FilterField label="Direction">
            <SelectField
              value={filters.direction}
              onChange={(event) => handleFilterChange('direction', event.target.value)}
              emptyAsPlaceholder={false}
            >
              <option value="">All</option>
              {DIRECTIONS.map((dir) => (
                <option key={dir} value={dir}>
                  {dir}
                </option>
              ))}
            </SelectField>
          </FilterField>
          <FilterField label="Session">
            <SelectField
              value={filters.session}
              onChange={(event) => handleFilterChange('session', event.target.value)}
              emptyAsPlaceholder={false}
            >
              <option value="">All</option>
              {SESSIONS.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </SelectField>
          </FilterField>
          <FilterField label="From">
            <input
              type="date"
              value={filters.start_date}
              onChange={(event) => handleFilterChange('start_date', event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </FilterField>
          <FilterField label="To">
            <input
              type="date"
              value={filters.end_date}
              onChange={(event) => handleFilterChange('end_date', event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </FilterField>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40"
          >
            Clear filters
          </button>
        </div>
      </div>

      <TradesTable trades={trades} />

      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <span>
            Showing {(pagination.page - 1) * pagination.per_page + 1}–
            {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="rounded-md border border-border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted/40"
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              className="rounded-md border border-border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted/40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterField({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium uppercase text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
