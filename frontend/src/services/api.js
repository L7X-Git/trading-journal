import axios from 'axios'

const resolveBaseUrl = () => {
  const raw = import.meta.env?.VITE_API_URL
  if (!raw) {
    return '/api'
  }

  if (raw.startsWith('http')) {
    const trimmed = raw.endsWith('/') ? raw.slice(0, -1) : raw
    return trimmed.match(/\/api$/i) ? trimmed : `${trimmed}/api`
  }

  let normalised = raw.startsWith('/') ? raw : `/${raw}`
  normalised = normalised.endsWith('/') ? normalised.slice(0, -1) : normalised
  return normalised.endsWith('/api') ? normalised : `${normalised}/api`
}

const API_BASE_URL = resolveBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const strategiesApi = {
  list: async () => {
    const response = await api.get('/strategies')
    return response.data
  },
  create: async (payload) => {
    const response = await api.post('/strategies', payload)
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/strategies/${id}`)
    return response.data
  },
  update: async (id, payload) => {
    const response = await api.put(`/strategies/${id}`, payload)
    return response.data
  },
  remove: async (id) => {
    await api.delete(`/strategies/${id}`)
  },
}

export const accountsApi = {
  list: async () => {
    const response = await api.get('/accounts')
    return response.data
  },
  create: async (payload) => {
    const response = await api.post('/accounts', payload)
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/accounts/${id}`)
    return response.data
  },
  update: async (id, payload) => {
    const response = await api.put(`/accounts/${id}`, payload)
    return response.data
  },
  remove: async (id) => {
    await api.delete(`/accounts/${id}`)
  },
}

export const tradesApi = {
  create: async (tradeData) => {
    const response = await api.post('/trades', tradeData)
    return response.data
  },

  update: async (id, payload) => {
    const response = await api.put(`/trades/${id}`, payload)
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/trades/${id}`)
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

  getConfirmationOptions: async () => {
    const response = await api.get('/trades/confirmations/options')
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

  getStrategySummary: async (params = {}) => {
    const response = await api.get('/dashboard/strategies', { params })
    return response.data
  },

  getAccountSummary: async (params = {}) => {
    const response = await api.get('/dashboard/accounts', { params })
    return response.data
  },
}

export default api
