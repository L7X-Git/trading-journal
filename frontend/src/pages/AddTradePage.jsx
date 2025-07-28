import { useState } from 'react'
import ManualTradeForm from '../components/ManualTradeForm'
import CSVUploader from '../components/CSVUploader'

export default function AddTradePage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = () => {
    // Force a refresh of any data that might need updating
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Trade</h1>
        <p className="text-gray-600">Record your trading activity manually or upload from CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ManualTradeForm onSuccess={handleSuccess} />
        <CSVUploader onSuccess={handleSuccess} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Pro Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use descriptive tags to categorize your trades (e.g., "Breakout", "Reversal", "Momentum")</li>
          <li>• Include emotional tags to track psychological patterns (e.g., "FOMO", "Fear", "Confident")</li>
          <li>• Be consistent with your timestamp format for accurate analysis</li>
          <li>• Review your trades regularly to identify patterns and improve your strategy</li>
        </ul>
      </div>
    </div>
  )
}