import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import TradesListPage from './pages/TradesListPage'
import AddTradePage from './pages/AddTradePage'
import StrategiesPage from './pages/StrategiesPage'
import AccountsPage from './pages/AccountsPage'
import TradeDetailPage from './pages/TradeDetailPage'

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => document.documentElement.classList.remove('dark')
  }, [])

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/trades" element={<TradesListPage />} />
          <Route path="/trades/:id" element={<TradeDetailPage />} />
          <Route path="/add-trade" element={<AddTradePage />} />
          <Route path="/settings/strategies" element={<StrategiesPage />} />
          <Route path="/settings/accounts" element={<AccountsPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
