import { Decimal } from 'decimal.js'

Decimal.set({ precision: 12 })

export function calculatePnl({ direction, entryPrice, exitPrice, quantity, commissions }) {
  const qty = new Decimal(quantity || 0)
  const entry = new Decimal(entryPrice || 0)
  const exit = new Decimal(exitPrice || 0)
  const comms = new Decimal(commissions || 0)

  if (!qty || !entry || !exit) return new Decimal(0)

  if (direction === 'Short') {
    return entry.minus(exit).times(qty).minus(comms)
  }
  return exit.minus(entry).times(qty).minus(comms)
}

export function calculateRiskPerTrade({ entryPrice, stopLoss, quantity }) {
  if (!stopLoss) return null
  const qty = new Decimal(quantity || 0)
  if (qty.equals(0)) return null

  const entry = new Decimal(entryPrice || 0)
  const sl = new Decimal(stopLoss || 0)
  const risk = entry.minus(sl).abs().times(qty)
  return risk.equals(0) ? null : risk
}

export function calculatePlannedRR({ entryPrice, stopLoss, takeProfit, quantity }) {
  if (!stopLoss || !takeProfit) return null
  const qty = new Decimal(quantity || 0)
  const entry = new Decimal(entryPrice || 0)
  const sl = new Decimal(stopLoss || 0)
  const tp = new Decimal(takeProfit || 0)

  const risk = entry.minus(sl).abs().times(qty)
  if (risk.equals(0)) return null

  const reward = tp.minus(entry).abs().times(qty)
  return reward.equals(0) ? null : reward.div(risk)
}

export function calculateRMultiple({ pnl, risk }) {
  if (!risk || risk.equals(0)) return null
  return pnl.div(risk)
}

export function calculateTradeMetrics({
  direction,
  entryPrice,
  exitPrice,
  quantity,
  commissions,
  stopLoss,
  takeProfit,
}) {
  const pnl = calculatePnl({ direction, entryPrice, exitPrice, quantity, commissions })
  const risk = calculateRiskPerTrade({ entryPrice, stopLoss, quantity })
  const rr = calculatePlannedRR({ entryPrice, stopLoss, takeProfit, quantity })
  const rMultiple = calculateRMultiple({ pnl, risk })

  return {
    pnl,
    risk,
    rr,
    rMultiple,
  }
}

export function formatDecimal(decimalValue, fractionDigits = 2) {
  if (decimalValue === null || decimalValue === undefined) return '—'
  try {
    const amount = new Decimal(decimalValue)
    return amount.toFixed(fractionDigits)
  } catch (error) {
    return `${decimalValue}`
  }
}
