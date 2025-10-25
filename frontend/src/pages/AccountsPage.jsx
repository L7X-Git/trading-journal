import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Modal from '../components/Modal'
import SelectField from '../components/SelectField'
import { accountsApi } from '../services/api'

const EMPTY_ACCOUNT = {
  name: '',
  type: 'Live',
  broker_platform: '',
  initial_balance: '',
  commission_split_percent: '',
  max_daily_drawdown: '',
  max_overall_drawdown: '',
  profit_target: '',
  allowed_instruments: '',
  violation_triggers: '',
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalState, setModalState] = useState({ open: false, mode: 'create', account: EMPTY_ACCOUNT })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const data = await accountsApi.list()
      setAccounts(data)
    } catch (error) {
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => setModalState({ open: true, mode: 'create', account: EMPTY_ACCOUNT })
  const openEditModal = (account) => setModalState({ open: true, mode: 'edit', account: { ...account } })
  const closeModal = () => setModalState({ open: false, mode: 'create', account: EMPTY_ACCOUNT })

  const handleSave = async (event) => {
    event.preventDefault()
    const form = modalState.account
    const payload = {
      ...form,
      initial_balance: Number(form.initial_balance || 0),
      commission_split_percent: form.commission_split_percent ? Number(form.commission_split_percent) : null,
      max_daily_drawdown: form.max_daily_drawdown ? Number(form.max_daily_drawdown) : null,
      max_overall_drawdown: form.max_overall_drawdown ? Number(form.max_overall_drawdown) : null,
      profit_target: form.profit_target ? Number(form.profit_target) : null,
    }

    try {
      if (modalState.mode === 'create') {
        const account = await accountsApi.create(payload)
        setAccounts((prev) => [...prev, account])
        toast.success('Account created')
      } else {
        const updated = await accountsApi.update(form.id, payload)
        setAccounts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        toast.success('Account updated')
      }
      closeModal()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to save account')
    }
  }

  const handleDelete = async (account) => {
    if (!window.confirm(`Delete account "${account.name}"?`)) return
    try {
      await accountsApi.remove(account.id)
      setAccounts((prev) => prev.filter((item) => item.id !== account.id))
      toast.success('Account deleted')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to delete account')
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading accounts...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">Keep balances and drawdown rules in sync with your trade journal.</p>
        </div>
        <button onClick={openCreateModal} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          New account
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Broker</th>
              <th className="px-4 py-3 text-left">Initial Balance</th>
              <th className="px-4 py-3 text-left">Current Balance</th>
              <th className="px-4 py-3 text-left">Commission %</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{account.name}</td>
                <td className="px-4 py-3">{account.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{account.broker_platform || '—'}</td>
                <td className="px-4 py-3">${Number(account.initial_balance).toLocaleString()}</td>
                <td className="px-4 py-3">${Number(account.current_balance).toLocaleString()}</td>
                <td className="px-4 py-3 text-muted-foreground">{account.commission_split_percent || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEditModal(account)} className="mr-2 text-sm text-primary hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(account)} className="text-sm text-rose-400 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={modalState.mode === 'create' ? 'New Account' : 'Edit Account'}
        isOpen={modalState.open}
        onClose={closeModal}
        footer={(
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} type="button" className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40">
              Cancel
            </button>
            <button type="submit" form="account-form" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Save
            </button>
          </div>
        )}
      >
        <form id="account-form" onSubmit={handleSave} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Name">
              <input
                required
                value={modalState.account.name}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  account: { ...prev.account, name: event.target.value },
                }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
            <FormField label="Type">
              <SelectField
                value={modalState.account.type}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  account: { ...prev.account, type: event.target.value },
                }))}
                emptyAsPlaceholder={false}
              >
                <option value="Live">Live</option>
                <option value="Funded">Funded</option>
                <option value="Evaluation">Evaluation</option>
                <option value="Challenge">Challenge</option>
                <option value="Demo">Demo</option>
              </SelectField>
            </FormField>
            <FormField label="Broker/Platform">
              <input
                value={modalState.account.broker_platform}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  account: { ...prev.account, broker_platform: event.target.value },
                }))}
                placeholder="e.g., MT5"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
            <FormField label="Initial balance">
              <input
                required
                type="number"
                step="0.01"
                value={modalState.account.initial_balance}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  account: { ...prev.account, initial_balance: event.target.value },
                }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
            <FormField label="Commission split %">
              <input
                type="number"
                step="0.01"
                value={modalState.account.commission_split_percent}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  account: { ...prev.account, commission_split_percent: event.target.value },
                }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
            <FormField label="Max daily drawdown">
              <input
                type="number"
                step="0.01"
                value={modalState.account.max_daily_drawdown}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  account: { ...prev.account, max_daily_drawdown: event.target.value },
                }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
            <FormField label="Max overall drawdown">
              <input
                type="number"
                step="0.01"
                value={modalState.account.max_overall_drawdown}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  account: { ...prev.account, max_overall_drawdown: event.target.value },
                }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
            <FormField label="Profit target">
              <input
                type="number"
                step="0.01"
                value={modalState.account.profit_target}
                onChange={(event) => setModalState((prev) => ({
                  ...prev,
                  account: { ...prev.account, profit_target: event.target.value },
                }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </FormField>
          </div>
          <FormField label="Allowed instruments">
            <input
              value={modalState.account.allowed_instruments}
              onChange={(event) => setModalState((prev) => ({
                ...prev,
                account: { ...prev.account, allowed_instruments: event.target.value },
              }))}
              placeholder="ES, NQ, CL"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </FormField>
          <FormField label="Violation triggers">
            <textarea
              value={modalState.account.violation_triggers}
              onChange={(event) => setModalState((prev) => ({
                ...prev,
                account: { ...prev.account, violation_triggers: event.target.value },
              }))}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </FormField>
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
