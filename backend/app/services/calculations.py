from __future__ import annotations

from decimal import Decimal
from typing import Optional

from ..models import TradeDirection


DECIMAL_ZERO = Decimal("0")


def calculate_pnl(
    *,
    direction: TradeDirection,
    entry_price: Decimal,
    exit_price: Decimal,
    quantity: Decimal,
    commissions: Decimal,
) -> Decimal:
    if direction == TradeDirection.LONG:
        return (exit_price - entry_price) * quantity - commissions
    return (entry_price - exit_price) * quantity - commissions


def calculate_risk_per_trade(
    *,
    entry_price: Decimal,
    stop_loss: Optional[Decimal],
    quantity: Decimal,
) -> Optional[Decimal]:
    if stop_loss is None:
        return None
    risk = abs(entry_price - stop_loss) * quantity
    return risk if risk > DECIMAL_ZERO else None


def calculate_rr_planned(
    *,
    entry_price: Decimal,
    stop_loss: Optional[Decimal],
    take_profit: Optional[Decimal],
    quantity: Decimal,
) -> Optional[Decimal]:
    if stop_loss is None or take_profit is None:
        return None

    risk = abs(entry_price - stop_loss) * quantity
    if risk <= DECIMAL_ZERO:
        return None

    reward = abs(take_profit - entry_price) * quantity
    return reward / risk if reward > DECIMAL_ZERO else None


def calculate_r_multiple(*, pnl: Decimal, risk_per_trade: Optional[Decimal]) -> Optional[Decimal]:
    if risk_per_trade is None or risk_per_trade == DECIMAL_ZERO:
        return None
    return pnl / risk_per_trade


def calculate_trade_metrics(
    *,
    direction: TradeDirection,
    entry_price: Decimal,
    exit_price: Decimal,
    quantity: Decimal,
    commissions: Decimal,
    stop_loss: Optional[Decimal],
    take_profit: Optional[Decimal],
) -> tuple[Decimal, Optional[Decimal], Optional[Decimal], Optional[Decimal]]:
    pnl = calculate_pnl(
        direction=direction,
        entry_price=entry_price,
        exit_price=exit_price,
        quantity=quantity,
        commissions=commissions,
    )

    risk_per_trade = calculate_risk_per_trade(entry_price=entry_price, stop_loss=stop_loss, quantity=quantity)
    rr_planned = calculate_rr_planned(
        entry_price=entry_price,
        stop_loss=stop_loss,
        take_profit=take_profit,
        quantity=quantity,
    )
    r_multiple = calculate_r_multiple(pnl=pnl, risk_per_trade=risk_per_trade)

    return pnl, risk_per_trade, rr_planned, r_multiple
