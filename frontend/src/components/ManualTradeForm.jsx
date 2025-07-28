import { useState } from 'react'
import { tradesApi } from '../services/api'

export default function ManualTradeForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    symbol: '',
    entry_timestamp: '',
    exit_timestamp: '',
    entry_price: '',
    exit_price: '',
    quantity: '',
    commissions: '0',
    tag_names: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Prepare tag names array
      const tagNames = formData.tag_names
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const tradeData = {
        ...formData,
        entry_price: parseFloat(formData.entry_price),
        exit_price: parseFloat(formData.exit_price),
        quantity: parseFloat(formData.quantity),
        commissions: parseFloat(formData.commissions),
        tag_names: tagNames
      }

      await tradesApi.createManualTrade(tradeData)
      
      // Reset form
      setFormData({
        symbol: '',
        entry_timestamp: '',
        exit_timestamp: '',
        entry_price: '',
        exit_price: '',
        quantity: '',
        commissions: '0',
        tag_names: ''
      })
      
      onSuccess && onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create trade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Manual Trade</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol *
            </label>
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., AAPL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Date & Time *
            </label>
            <input
              type="datetime-local"
              name="entry_timestamp"
              value={formData.entry_timestamp}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Date & Time *
            </label>
            <input
              type="datetime-local"
              name="exit_timestamp"
              value={formData.exit_timestamp}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Price *
            </label>
            <input
              type="number"
              name="entry_price"
              value={formData.entry_price}
              onChange={handleInputChange}
              required
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 150.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Price *
            </label>
            <input
              type="number"
              name="exit_price"
              value={formData.exit_price}
              onChange={handleInputChange}
              required
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 155.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commissions
            </label>
            <input
              type="number"
              name="commissions"
              value={formData.commissions}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 5.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tag_names"
              value={formData.tag_names}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Breakout, Momentum, Long"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Trade'}
          </button>
        </div>
      </form>
    </div>
  )
}