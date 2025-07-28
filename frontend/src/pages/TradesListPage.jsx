import { useState, useEffect } from 'react'
import { tradesApi } from '../services/api'
import TradesTable from '../components/TradesTable'

export default function TradesListPage() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0
  })
  const [filters, setFilters] = useState({
    symbol: ''
  })

  useEffect(() => {
    fetchTrades()
  }, [pagination.page, filters.symbol])

  const fetchTrades = async () => {
    try {
      setLoading(true)
      const response = await tradesApi.getTrades({
        page: pagination.page,
        per_page: pagination.per_page,
        symbol: filters.symbol || undefined
      })
      
      setTrades(response.trades)
      setPagination(prev => ({
        ...prev,
        total: response.total,
        total_pages: Math.ceil(response.total / response.per_page)
      }))
    } catch (err) {
      setError('Failed to load trades')
      console.error('Trades error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when filtering
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchTrades}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trades</h1>
        <p className="text-gray-600">View and analyze your trading history</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Symbol
            </label>
            <input
              type="text"
              value={filters.symbol}
              onChange={(e) => handleFilterChange('symbol', e.target.value)}
              placeholder="e.g., AAPL"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => handleFilterChange('symbol', '')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <TradesTable trades={trades} />

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {(pagination.page - 1) * pagination.per_page + 1} to{' '}
              {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}