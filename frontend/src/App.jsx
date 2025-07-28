import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import TradesListPage from './pages/TradesListPage'
import AddTradePage from './pages/AddTradePage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/trades" element={<TradesListPage />} />
          <Route path="/add-trade" element={<AddTradePage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App