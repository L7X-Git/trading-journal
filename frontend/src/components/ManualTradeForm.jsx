import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { accountsApi, strategiesApi, tradesApi } from '../services/api'
import { calculateTradeMetrics, formatDecimal } from '../lib/tradeCalculations'
import { cn } from '../lib/utils'
import Modal from './Modal'
import MultiSelect from './MultiSelect'
import TagInput from './TagInput'
import SelectField from './SelectField'

const DIRECTION_OPTIONS = ['Long', 'Short']
const SESSION_OPTIONS = ['NY', 'London', 'Asia']

const INITIAL_FORM = {
  accountId: '',
  strategyId: '',
  symbol: '',
  direction: 'Long',
  quantity: '',
  session: '',
  entryDateTime: new Date().toISOString().slice(0, 16),
  exitDateTime: new Date().toISOString().slice(0, 16),
  entryPrice: '',
  stopLoss: '',
  takeProfit: '',
  exitPrice: '',
  commissions: '0',
  notes: '',
}

const INITIAL_STRATEGY_FORM = {
  name: '',
  category: '',
  preferred_direction: 'Both',
  timeframes: '',
  entry_criteria: '',
  exit_criteria: '',
}

const INITIAL_ACCOUNT_FORM = {
  name: '',
  type: 'Live',
  broker_platform: '',
  initial_balance: '',
  commission_split_percent: '',
}

export default function ManualTradeForm({ onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [selectedConfirmations, setSelectedConfirmations] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [strategies, setStrategies] = useState([])
  const [accounts, setAccounts] = useState([])
  const [confirmationOptions, setConfirmationOptions] = useState([])

  const [strategyModalOpen, setStrategyModalOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [newStrategy, setNewStrategy] = useState(INITIAL_STRATEGY_FORM)
  const [newAccount, setNewAccount] = useState(INITIAL_ACCOUNT_FORM)
  const [savingModal, setSavingModal] = useState(false)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [strategyList, accountList, confirmations] = await Promise.all([
          strategiesApi.list(),
          accountsApi.list(),
          tradesApi.getConfirmationOptions(),
        ])
        setStrategies(strategyList)
        setAccounts(accountList)
        setConfirmationOptions(confirmations.map((item) => ({ label: item, value: item })))
      } catch (error) {
        console.error('Failed to load settings', error)
        toast.error('Failed to load strategies/accounts list')
      }
    }
    loadInitialData()
  }, [])

  const metrics = useMemo(() => {
    return calculateTradeMetrics({
      direction: form.direction,
      entryPrice: form.entryPrice || 0,
      exitPrice: form.exitPrice || 0,
      quantity: form.quantity || 0,
      commissions: form.commissions || 0,
      stopLoss: form.stopLoss || null,
      takeProfit: form.takeProfit || null,
    })
  }, [form.direction, form.entryPrice, form.exitPrice, form.quantity, form.commissions, form.stopLoss, form.takeProfit])

  const selectedAccount = accounts.find((account) => account.id === form.accountId)
  const selectedStrategy = strategies.find((strategy) => strategy.id === form.strategyId)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const validationErrors = {}
    if (!form.accountId) validationErrors.accountId = 'Account is required'
    if (!form.strategyId) validationErrors.strategyId = 'Strategy is required'
    if (!form.symbol.trim()) validationErrors.symbol = 'Symbol is required'
    if (!form.entryPrice || Number(form.entryPrice) <= 0) validationErrors.entryPrice = 'Entry price must be greater than zero'
    if (!form.exitPrice || Number(form.exitPrice) <= 0) validationErrors.exitPrice = 'Exit price must be greater than zero'
    if (!form.quantity || Number(form.quantity) <= 0) validationErrors.quantity = 'Quantity must be greater than zero'

    if (form.entryDateTime && form.exitDateTime) {
      const entryDate = new Date(form.entryDateTime)
      const exitDate = new Date(form.exitDateTime)
      if (exitDate < entryDate) {
        validationErrors.exitDateTime = 'Exit must be after entry'
      }
    }

    if (form.entryPrice && form.exitPrice && Number(form.entryPrice) === Number(form.exitPrice)) {
      validationErrors.exitPrice = 'Exit price must differ from entry price'
    }

    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const resetForm = () => {
    setForm({
      ...INITIAL_FORM,
      entryDateTime: new Date().toISOString().slice(0, 16),
      exitDateTime: new Date().toISOString().slice(0, 16),
    })
    setSelectedConfirmations([])
    setTags([])
    setErrors({})
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const payload = {
        account_id: form.accountId,
        strategy_id: form.strategyId,
        symbol: form.symbol.trim().toUpperCase(),
        direction: form.direction,
        quantity: Number(form.quantity),
        session: form.session || null,
        entryDateTime: form.entryDateTime,
        exitDateTime: form.exitDateTime,
        entry_price: Number(form.entryPrice),
        stopLossPlanned: form.stopLoss ? Number(form.stopLoss) : null,
        takeProfitPlanned: form.takeProfit ? Number(form.takeProfit) : null,
        exit_price: Number(form.exitPrice),
        commissions: form.commissions ? Number(form.commissions) : 0,
        confirmations: selectedConfirmations,
        notes: form.notes,
        tag_names: tags,
      }

      const trade = await tradesApi.create(payload)

      toast.success(
        `✅ Trade created: ${formatDecimal(trade.r_multiple, 2)}R | PnL $${formatDecimal(trade.pnl, 2)} | ${trade.confirmations_count} confirmations`
      )

      resetForm()
      if (onSuccess) onSuccess()
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create trade'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStrategy = async (event) => {
    event.preventDefault()
    setSavingModal(true)
    try {
      const payload = {
        ...newStrategy,
        timeframes: newStrategy.timeframes
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }
      const strategy = await strategiesApi.create(payload)
      setStrategies((prev) => [...prev, strategy])
      setForm((prev) => ({ ...prev, strategyId: strategy.id }))
      setStrategyModalOpen(false)
      setNewStrategy(INITIAL_STRATEGY_FORM)
      toast.success('Strategy created')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to create strategy')
    } finally {
      setSavingModal(false)
    }
  }

  const handleCreateAccount = async (event) => {
    event.preventDefault()
    setSavingModal(true)
    try {
      const payload = {
        ...newAccount,
        initial_balance: Number(newAccount.initial_balance || 0),
        commission_split_percent: newAccount.commission_split_percent
          ? Number(newAccount.commission_split_percent)
          : null,
      }
      const account = await accountsApi.create(payload)
      setAccounts((prev) => [...prev, account])
      setForm((prev) => ({ ...prev, accountId: account.id }))
      setAccountModalOpen(false)
      setNewAccount(INITIAL_ACCOUNT_FORM)
      toast.success('Account created')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to create account')
    } finally {
      setSavingModal(false)
    }
  }

  const confirmationOptionsFormatted = confirmationOptions

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Add Trade</h3>
          <p className="text-sm text-muted-foreground">Capture executions with strategy alignment and confirmations.</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {selectedAccount && <p>Account balance: ${formatDecimal(selectedAccount.current_balance)}</p>}
          {selectedStrategy && <p>Strategy: {selectedStrategy.name}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trade Info */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold uppercase text-muted-foreground">Trade Info</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Account *</label>
              <div className="flex gap-2">
                <SelectField
                  name="accountId"
                  value={form.accountId}
                  onChange={handleChange}
                  error={errors.accountId}
                  wrapperClassName="flex-1"
                >
                  <option value="">Select account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </SelectField>
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(true)}
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/60"
                >
                  + Add
                </button>
              </div>
              {errors.accountId && <p className="text-xs text-rose-400">{errors.accountId}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Strategy *</label>
              <div className="flex gap-2">
                <SelectField
                  name="strategyId"
                  value={form.strategyId}
                  onChange={handleChange}
                  error={errors.strategyId}
                  wrapperClassName="flex-1"
                >
                  <option value="">Select strategy...</option>
                  {strategies.map((strategy) => (
                    <option key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </option>
                  ))}
                </SelectField>
                <button
                  type="button"
                  onClick={() => setStrategyModalOpen(true)}
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/60"
                >
                  + Add
                </button>
              </div>
              {errors.strategyId && <p className="text-xs text-rose-400">{errors.strategyId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Symbol *</label>
              <input
                name="symbol"
                value={form.symbol}
                onChange={handleChange}
                placeholder="e.g., NQ1!"
                className={cn(
                  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60',
                  errors.symbol && 'border-rose-500'
                )}
              />
              {errors.symbol && <p className="text-xs text-rose-400">{errors.symbol}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Direction *</label>
              <div className="flex rounded-md border border-border bg-background p-1 text-sm">
                {DIRECTION_OPTIONS.map((direction) => (
                  <button
                    key={direction}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, direction }))}
                    className={cn(
                      'w-1/2 rounded-md px-3 py-2 transition-colors',
                      form.direction === direction
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted/40'
                    )}
                  >
                    {direction}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                step="0.01"
                placeholder="e.g., 2"
                className={cn(
                  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60',
                  errors.quantity && 'border-rose-500'
                )}
              />
              {errors.quantity && <p className="text-xs text-rose-400">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Session</label>
              <SelectField name="session" value={form.session} onChange={handleChange}>
                <option value="">Select session...</option>
                {SESSION_OPTIONS.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
        </section>

        {/* Execution */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold uppercase text-muted-foreground">Execution</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Entry Date & Time *</label>
              <input
                type="datetime-local"
                name="entryDateTime"
                value={form.entryDateTime}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Exit Date & Time *</label>
              <input
                type="datetime-local"
                name="exitDateTime"
                value={form.exitDateTime}
                onChange={handleChange}
                className={cn(
                  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60',
                  errors.exitDateTime && 'border-rose-500'
                )}
              />
              {errors.exitDateTime && <p className="text-xs text-rose-400">{errors.exitDateTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Entry Price *</label>
              <input
                type="number"
                name="entryPrice"
                value={form.entryPrice}
                onChange={handleChange}
                step="0.0001"
                placeholder="e.g., 15234.50"
                className={cn(
                  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60',
                  errors.entryPrice && 'border-rose-500'
                )}
              />
              {errors.entryPrice && <p className="text-xs text-rose-400">{errors.entryPrice}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Stop Loss (planned)</label>
              <input
                type="number"
                name="stopLoss"
                value={form.stopLoss}
                onChange={handleChange}
                step="0.0001"
                placeholder="Optional"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Take Profit (planned)</label>
              <input
                type="number"
                name="takeProfit"
                value={form.takeProfit}
                onChange={handleChange}
                step="0.0001"
                placeholder="Optional"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Exit Price *</label>
              <input
                type="number"
                name="exitPrice"
                value={form.exitPrice}
                onChange={handleChange}
                step="0.0001"
                placeholder="e.g., 15260.25"
                className={cn(
                  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60',
                  errors.exitPrice && 'border-rose-500'
                )}
              />
              {errors.exitPrice && <p className="text-xs text-rose-400">{errors.exitPrice}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Commissions</label>
              <input
                type="number"
                name="commissions"
                value={form.commissions}
                onChange={handleChange}
                step="0.01"
                placeholder="0"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
          </div>
        </section>

        {/* Analysis */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold uppercase text-muted-foreground">Analysis</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TagInput
              label="Tags"
              tags={tags}
              onChange={setTags}
              placeholder="e.g., ICT-FVG, Liquidity Grab"
            />

            <MultiSelect
              label="Confirmations"
              options={confirmationOptionsFormatted}
              selectedValues={selectedConfirmations}
              onChange={setSelectedConfirmations}
              placeholder="Select confirmations"
              helperText={`${selectedConfirmations.length} selected`}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Observations, mindset, deviations, lessons learned..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
          </div>
        </section>

        {/* Auto-calcs */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold uppercase text-muted-foreground">Auto calculations</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ReadOnlyMetric label="Risk (per trade)" value={metrics.risk ? `$${formatDecimal(metrics.risk, 2)}` : '—'} />
            <ReadOnlyMetric label="Planned R:R" value={metrics.rr ? `${formatDecimal(metrics.rr, 2)}R` : '—'} />
            <ReadOnlyMetric label="PnL" value={`$${formatDecimal(metrics.pnl, 2)}`} />
            <ReadOnlyMetric label="R-Multiple" value={metrics.rMultiple ? `${formatDecimal(metrics.rMultiple, 2)}R` : '—'} />
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Trade'}
          </button>
        </div>
      </form>

      {/* Strategy Modal */}
      <Modal
        title="Create Strategy"
        description="Capture the rules of your playbook so trades can be analysed in context."
        isOpen={strategyModalOpen}
        onClose={() => {
          if (!savingModal) {
            setStrategyModalOpen(false)
            setNewStrategy(INITIAL_STRATEGY_FORM)
          }
        }}
        footer={(
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setStrategyModalOpen(false)
                setNewStrategy(INITIAL_STRATEGY_FORM)
              }}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40"
              disabled={savingModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="strategy-form"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={savingModal}
            >
              {savingModal ? 'Saving...' : 'Save strategy'}
            </button>
          </div>
        )}
      >
        <form id="strategy-form" onSubmit={handleCreateStrategy} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Name *</label>
              <input
                required
                value={newStrategy.name}
                onChange={(event) => setNewStrategy((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Category</label>
              <SelectField
                value={newStrategy.category}
                onChange={(event) => setNewStrategy((prev) => ({ ...prev, category: event.target.value }))}
              >
                <option value="">Select...</option>
                <option value="Entry">Entry</option>
                <option value="Exit">Exit</option>
                <option value="Continuation">Continuation</option>
                <option value="Reversal">Reversal</option>
              </SelectField>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Preferred Direction</label>
              <SelectField
                value={newStrategy.preferred_direction}
                onChange={(event) => setNewStrategy((prev) => ({ ...prev, preferred_direction: event.target.value }))}
                emptyAsPlaceholder={false}
              >
                <option value="Long">Long</option>
                <option value="Short">Short</option>
                <option value="Both">Both</option>
              </SelectField>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Timeframes (comma separated)</label>
              <input
                value={newStrategy.timeframes}
                onChange={(event) => setNewStrategy((prev) => ({ ...prev, timeframes: event.target.value }))}
                placeholder="e.g., 15M,1H,4H"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Entry criteria</label>
            <textarea
              value={newStrategy.entry_criteria}
              onChange={(event) => setNewStrategy((prev) => ({ ...prev, entry_criteria: event.target.value }))}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Exit criteria</label>
            <textarea
              value={newStrategy.exit_criteria}
              onChange={(event) => setNewStrategy((prev) => ({ ...prev, exit_criteria: event.target.value }))}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
        </form>
      </Modal>

      {/* Account Modal */}
      <Modal
        title="Create Account"
        description="Track balances and drawdowns across broker profiles."
        isOpen={accountModalOpen}
        onClose={() => {
          if (!savingModal) {
            setAccountModalOpen(false)
            setNewAccount(INITIAL_ACCOUNT_FORM)
          }
        }}
        footer={(
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAccountModalOpen(false)
                setNewAccount(INITIAL_ACCOUNT_FORM)
              }}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40"
              disabled={savingModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="account-form"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={savingModal}
            >
              {savingModal ? 'Saving...' : 'Save account'}
            </button>
          </div>
        )}
      >
        <form id="account-form" onSubmit={handleCreateAccount} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Name *</label>
              <input
                required
                value={newAccount.name}
                onChange={(event) => setNewAccount((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Type *</label>
              <SelectField
                value={newAccount.type}
                onChange={(event) => setNewAccount((prev) => ({ ...prev, type: event.target.value }))}
                emptyAsPlaceholder={false}
              >
                <option value="Live">Live</option>
                <option value="Funded">Funded</option>
                <option value="Evaluation">Evaluation</option>
                <option value="Challenge">Challenge</option>
                <option value="Demo">Demo</option>
              </SelectField>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Broker/Platform</label>
              <input
                value={newAccount.broker_platform}
                onChange={(event) => setNewAccount((prev) => ({ ...prev, broker_platform: event.target.value }))}
                placeholder="e.g., NinjaTrader"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Initial balance *</label>
              <input
                required
                type="number"
                step="0.01"
                value={newAccount.initial_balance}
                onChange={(event) => setNewAccount((prev) => ({ ...prev, initial_balance: event.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Commission split %</label>
              <input
                type="number"
                step="0.01"
                value={newAccount.commission_split_percent}
                onChange={(event) => setNewAccount((prev) => ({ ...prev, commission_split_percent: event.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function ReadOnlyMetric({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-card-foreground">{value}</p>
    </div>
  )
}
