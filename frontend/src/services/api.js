import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const tradesApi = {
  createManualTrade: async (tradeData) => {
    const response = await api.post('/trades/manual', tradeData)
    return response.data
  },

  uploadTradesCSV: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/trades/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getTrades: async (params = {}) => {
    const response = await api.get('/trades', { params })
    return response.data
  },
}

export const dashboardApi = {
  getKPIs: async () => {
    const response = await api.get('/dashboard/kpis')
    return response.data
  },

  getEquityCurve: async () => {
    const response = await api.get('/dashboard/equity-curve')
    return response.data
  },

  getPerformanceByTag: async () => {
    const response = await api.get('/dashboard/performance-by-tag')
    return response.data
  },
}

export default api