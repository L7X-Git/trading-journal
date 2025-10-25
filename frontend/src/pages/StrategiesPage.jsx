import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Modal from '../components/Modal'
import SelectField from '../components/SelectField'
import { strategiesApi } from '../services/api'

const EMPTY_STRATEGY = {
  name: '',
  category: '',
  preferred_direction: 'Both',
  timeframes: '',
  entry_criteria: '',
  exit_criteria: '',
  invalid_conditions: '',
  state_of_mind: '',
  common_bias: '',
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalState, setModalState] = useState({ open: false, mode: 'create', strategy: EMPTY_STRATEGY })

  useEffect(() => {
    fetchStrategies()
  }, [])

  const fetchStrategies = async () => {
    try {
      setLoading(true)
      const data = await strategiesApi.list()
      setStrategies(data)
    } catch (error) {
      toast.error('Failed to load strategies')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => setModalState({ open: true, mode: 'create', strategy: EMPTY_STRATEGY })

  const openEditModal = (strategy) =>
    setModalState({
      open: true,
      mode: 'edit',
      strategy: {
        ...strategy,
        timeframes: Array.isArray(strategy.timeframes) ? strategy.timeframes.join(',') : strategy.timeframes || '',
      },
    })

  const closeModal = () => setModalState({ open: false, mode: 'create', strategy: EMPTY_STRATEGY })

  const handleSave = async (event) => {
    event.preventDefault()
    const form = modalState.strategy
    const payload = {
      ...form,
      timeframes: form.timeframes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }

    try {
      if (modalState.mode === 'create') {
        const created = await strategiesApi.create(payload)
        setStrategies((prev) => [...prev, created])
        toast.success('Strategy created')
      } else {
        const updated = await strategiesApi.update(form.id, payload)
        setStrategies((prev) => prev.map((strategy) => (strategy.id === updated.id ? updated : strategy)))
        toast.success('Strategy updated')
      }
      closeModal()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to save strategy')
    }
  }

  const handleDelete = async (strategy) => {
    if (!window.confirm(`Delete strategy "${strategy.name}"? Trades using it will fail to load.`)) return
    try {
      await strategiesApi.remove(strategy.id)
      setStrategies((prev) => prev.filter((item) => item.id !== strategy.id))
      toast.success('Strategy deleted')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to delete strategy')
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading strategies...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Strategies</h1>
          <p className="text-sm text-muted-foreground">Document setups and guardrails. These feed the trade form and dashboards.</p>
        </div>
        <button onClick={openCreateModal} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          New strategy
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Preferred Direction</th>
              <th className="px-4 py-3 text-left">Timeframes</th>
              <th className="px-4 py-3 text-left">Entry Criteria</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-card-foreground">
            {strategies.map((strategy) => (
              <tr key={strategy.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{strategy.name}</td>
                <td className="px-4 py-3">{strategy.category || '—'}</td>
                <td className="px-4 py-3">{strategy.preferred_direction}</td>
                <td className="px-4 py-3 text-muted-foreground">{Array.isArray(strategy.timeframes) ? strategy.timeframes.join(', ') : '—'}</td>
                <td className="px-4 py-3 text-muted-foreground truncate max-w-xs" title={strategy.entry_criteria || ''}>
                  {strategy.entry_criteria || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEditModal(strategy)}
                    className="mr-2 text-sm text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(strategy)} className="text-sm text-rose-400 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {strategies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No strategies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={modalState.mode === 'create' ? 'New Strategy' : 'Edit Strategy'}
        isOpen={modalState.open}
        onClose={closeModal}
        footer={(
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} type="button" className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40">
              Cancel
            </button>
            <button type="submit" form="strategy-form" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Save
            </button>
          </div>
        )}
      >
        <form id="strategy-form" onSubmit={handleSave} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Name">
              <input
                required
                value={modalState.strategy.name}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  strategy: { ...prev.strategy, name: event.target.value },
                }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
            <FormField label="Category">
              <input
                value={modalState.strategy.category}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  strategy: { ...prev.strategy, category: event.target.value },
                }))}
                placeholder="Entry, Exit, Continuation..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
            <FormField label="Preferred direction">
              <SelectField
                value={modalState.strategy.preferred_direction}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  strategy: { ...prev.strategy, preferred_direction: event.target.value },
                }))}
                emptyAsPlaceholder={false}
              >
                <option value="Long">Long</option>
                <option value="Short">Short</option>
                <option value="Both">Both</option>
              </SelectField>
            </FormField>
            <FormField label="Timeframes (comma separated)">
              <input
                value={modalState.strategy.timeframes}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  strategy: { ...prev.strategy, timeframes: event.target.value },
                }))}
                placeholder="1M, 5M, 15M"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
          </div>
          <FormField label="Entry criteria">
            <textarea
              value={modalState.strategy.entry_criteria}
              onChange={(event) => setModalState((prev) => ({
                ...prev,
                strategy: { ...prev.strategy, entry_criteria: event.target.value },
              }))}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </FormField>
          <FormField label="Exit criteria">
            <textarea
              value={modalState.strategy.exit_criteria}
              onChange={(event) => setModalState((prev) => ({
                ...prev,
                strategy: { ...prev.strategy, exit_criteria: event.target.value },
              }))}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </FormField>
          <FormField label="Invalid conditions">
            <textarea
              value={modalState.strategy.invalid_conditions || ''}
              onChange={(event) => setModalState((prev) => ({
                ...prev,
                strategy: { ...prev.strategy, invalid_conditions: event.target.value },
              }))}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </FormField>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="State of mind">
              <input
                value={modalState.strategy.state_of_mind || ''}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  strategy: { ...prev.strategy, state_of_mind: event.target.value },
                }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
            <FormField label="Common bias">
              <input
                value={modalState.strategy.common_bias || ''}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  strategy: { ...prev.strategy, common_bias: event.target.value },
                }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
