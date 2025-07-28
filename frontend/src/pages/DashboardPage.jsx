import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/api'
import KPICard from '../components/KPICard'
import EquityChart from '../components/EquityChart'
import PerformanceByTagTable from '../components/PerformanceByTagTable'

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null)
  const [equityCurve, setEquityCurve] = useState([])
  const [performanceByTag, setPerformanceByTag] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const [kpisData, equityData, tagData] = await Promise.all([
        dashboardApi.getKPIs(),
        dashboardApi.getEquityCurve(),
        dashboardApi.getPerformanceByTag()
      ])
      
      setKpis(kpisData)
      setEquityCurve(equityData)
      setPerformanceByTag(tagData)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchDashboardData}
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Your trading performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total P&L"
          value={kpis?.total_pnl || 0}
          trend={kpis?.total_pnl > 0 ? 10 : kpis?.total_pnl < 0 ? -10 : 0}
        />
        <KPICard
          title="Win Rate"
          value={kpis?.win_rate || 0}
          subtitle={`${kpis?.winning_trades || 0} of ${kpis?.total_trades || 0} trades`}
        />
        <KPICard
          title="Total Trades"
          value={kpis?.total_trades || 0}
        />
        <KPICard
          title="Profit Factor"
          value={kpis?.profit_factor === Infinity ? '∞' : kpis?.profit_factor || 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquityChart data={equityCurve} />
        <PerformanceByTagTable data={performanceByTag} />
      </div>

      {/* Additional Stats */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KPICard
            title="Average Win"
            value={kpis.average_win}
            className="bg-green-50"
          />
          <KPICard
            title="Average Loss"
            value={Math.abs(kpis.average_loss)}
            className="bg-red-50"
          />
        </div>
      )}
    </div>
  )
}