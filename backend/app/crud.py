from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from typing import Dict, Iterable, List, Optional, Tuple
import uuid

from sqlalchemy import and_, func
from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .services import calculations

DECIMAL_ZERO = Decimal("0")


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------


def _unique_sequence(values: Iterable[str]) -> List[str]:
    """Return list with duplicates removed while preserving order."""
    seen: Dict[str, None] = {}
    for value in values:
        if value not in seen:
            seen[value] = None
    return list(seen.keys())


def _ensure_account(db: Session, account_id: uuid.UUID) -> models.Account:
    account = db.get(models.Account, account_id)
    if not account:
        raise ValueError("Account not found")
    return account


def _ensure_strategy(db: Session, strategy_id: uuid.UUID) -> models.Strategy:
    strategy = db.get(models.Strategy, strategy_id)
    if not strategy:
        raise ValueError("Strategy not found")
    return strategy


def _get_or_create_tags(db: Session, tag_names: Iterable[str]) -> List[models.Tag]:
    tags: List[models.Tag] = []
    for tag_name in _unique_sequence(tag_names):
        normalized_tag = tag_name.strip()
        if not normalized_tag:
            continue
        tag = db.query(models.Tag).filter(models.Tag.name.ilike(normalized_tag)).first()
        if not tag:
            tag = models.Tag(name=normalized_tag, type="custom")
            db.add(tag)
        tags.append(tag)
    return tags


def _apply_trade_filters(
    query,
    *,
    symbol: Optional[str] = None,
    strategy_id: Optional[uuid.UUID] = None,
    account_id: Optional[uuid.UUID] = None,
    session: Optional[models.TradeSession] = None,
    direction: Optional[models.TradeDirection] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    if symbol:
        query = query.filter(models.Trade.symbol == symbol)
    if strategy_id:
        query = query.filter(models.Trade.strategy_id == strategy_id)
    if account_id:
        query = query.filter(models.Trade.account_id == account_id)
    if session:
        query = query.filter(models.Trade.session == session)
    if direction:
        query = query.filter(models.Trade.direction == direction)
    if start_date:
        query = query.filter(models.Trade.entry_timestamp >= start_date)
    if end_date:
        query = query.filter(models.Trade.exit_timestamp <= end_date)
    return query


def _update_account_balance(account: models.Account, delta: Decimal) -> None:
    current = account.current_balance or account.initial_balance
    account.current_balance = current + delta


# ---------------------------------------------------------------------------
# Strategy CRUD
# ---------------------------------------------------------------------------


def create_strategy(db: Session, payload: schemas.StrategyCreate) -> models.Strategy:
    strategy = models.Strategy(
        name=payload.name.strip(),
        category=payload.category,
        timeframes=_unique_sequence(payload.timeframes),
        preferred_direction=payload.preferred_direction,
        entry_criteria=payload.entry_criteria,
        exit_criteria=payload.exit_criteria,
        invalid_conditions=payload.invalid_conditions,
        state_of_mind=payload.state_of_mind,
        common_bias=payload.common_bias,
        example_image_url=payload.example_image_url,
    )
    db.add(strategy)
    db.commit()
    db.refresh(strategy)
    return strategy


def list_strategies(db: Session) -> List[models.Strategy]:
    return db.query(models.Strategy).order_by(models.Strategy.name.asc()).all()


def get_strategy(db: Session, strategy_id: uuid.UUID) -> Optional[models.Strategy]:
    return db.get(models.Strategy, strategy_id)


def update_strategy(db: Session, strategy_id: uuid.UUID, payload: schemas.StrategyUpdate) -> models.Strategy:
    strategy = _ensure_strategy(db, strategy_id)

    update_data = payload.model_dump(exclude_unset=True)
    if "timeframes" in update_data and update_data["timeframes"] is not None:
        update_data["timeframes"] = _unique_sequence(update_data["timeframes"])

    for field, value in update_data.items():
        setattr(strategy, field, value)

    db.commit()
    db.refresh(strategy)
    return strategy


def delete_strategy(db: Session, strategy_id: uuid.UUID) -> None:
    strategy = _ensure_strategy(db, strategy_id)
    has_trades = db.query(models.Trade.id).filter(models.Trade.strategy_id == strategy_id).first()
    if has_trades:
        raise ValueError("Cannot delete strategy with associated trades")
    db.delete(strategy)
    db.commit()


# ---------------------------------------------------------------------------
# Account CRUD
# ---------------------------------------------------------------------------


def create_account(db: Session, payload: schemas.AccountCreate) -> models.Account:
    current_balance = payload.current_balance if payload.current_balance is not None else payload.initial_balance

    account = models.Account(
        name=payload.name.strip(),
        type=payload.type,
        broker_platform=payload.broker_platform,
        initial_balance=payload.initial_balance,
        current_balance=current_balance,
        commission_split_percent=payload.commission_split_percent,
        max_daily_drawdown=payload.max_daily_drawdown,
        max_overall_drawdown=payload.max_overall_drawdown,
        profit_target=payload.profit_target,
        allowed_instruments=payload.allowed_instruments,
        violation_triggers=payload.violation_triggers,
        start_date=payload.start_date,
        expiration_date=payload.expiration_date,
        notes=payload.notes,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def list_accounts(db: Session) -> List[models.Account]:
    return db.query(models.Account).order_by(models.Account.name.asc()).all()


def get_account(db: Session, account_id: uuid.UUID) -> Optional[models.Account]:
    return db.get(models.Account, account_id)


def update_account(db: Session, account_id: uuid.UUID, payload: schemas.AccountUpdate) -> models.Account:
    account = _ensure_account(db, account_id)
    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"]:
        update_data["name"] = update_data["name"].strip()

    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account


def delete_account(db: Session, account_id: uuid.UUID) -> None:
    account = _ensure_account(db, account_id)
    has_trades = db.query(models.Trade.id).filter(models.Trade.account_id == account_id).first()
    if has_trades:
        raise ValueError("Cannot delete account with associated trades")
    db.delete(account)
    db.commit()


# ---------------------------------------------------------------------------
# Trade CRUD
# ---------------------------------------------------------------------------


def create_trade(db: Session, payload: schemas.TradeCreate) -> models.Trade:
    account = _ensure_account(db, payload.account_id)
    strategy = _ensure_strategy(db, payload.strategy_id)

    confirmations = _unique_sequence(payload.confirmations)
    pnl, risk_per_trade, rr_planned, r_multiple = calculations.calculate_trade_metrics(
        direction=payload.direction,
        entry_price=payload.entry_price,
        exit_price=payload.exit_price,
        quantity=payload.quantity,
        commissions=payload.commissions,
        stop_loss=payload.stop_loss_planned,
        take_profit=payload.take_profit_planned,
    )

    trade = models.Trade(
        symbol=payload.symbol.strip().upper(),
        direction=payload.direction,
        quantity=payload.quantity,
        session=payload.session,
        strategy=strategy,
        account=account,
        entry_timestamp=payload.entry_datetime,
        exit_timestamp=payload.exit_datetime,
        entry_price=payload.entry_price,
        stop_loss_planned=payload.stop_loss_planned,
        take_profit_planned=payload.take_profit_planned,
        exit_price=payload.exit_price,
        commissions=payload.commissions,
        risk_per_trade=risk_per_trade,
        rr_planned=rr_planned,
        pnl=pnl,
        r_multiple=r_multiple,
        confirmations=confirmations,
        confirmations_count=len(confirmations),
        notes=payload.notes,
        import_method=payload.import_method,
    )

    trade.tags = _get_or_create_tags(db, payload.tag_names)

    _update_account_balance(account, pnl)

    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade


def get_trade(db: Session, trade_id: uuid.UUID) -> Optional[models.Trade]:
    return (
        db.query(models.Trade)
        .options(joinedload(models.Trade.strategy), joinedload(models.Trade.account), joinedload(models.Trade.tags))
        .filter(models.Trade.id == trade_id)
        .first()
    )


def list_trades(
    db: Session,
    *,
    skip: int,
    limit: int,
    symbol: Optional[str] = None,
    strategy_id: Optional[uuid.UUID] = None,
    account_id: Optional[uuid.UUID] = None,
    session: Optional[models.TradeSession] = None,
    direction: Optional[models.TradeDirection] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> List[models.Trade]:
    query = (
        db.query(models.Trade)
        .options(joinedload(models.Trade.strategy), joinedload(models.Trade.account), joinedload(models.Trade.tags))
        .order_by(models.Trade.exit_timestamp.desc())
    )
    query = _apply_trade_filters(
        query,
        symbol=symbol,
        strategy_id=strategy_id,
        account_id=account_id,
        session=session,
        direction=direction,
        start_date=start_date,
        end_date=end_date,
    )
    return query.offset(skip).limit(limit).all()


def get_trade_count(
    db: Session,
    *,
    symbol: Optional[str] = None,
    strategy_id: Optional[uuid.UUID] = None,
    account_id: Optional[uuid.UUID] = None,
    session: Optional[models.TradeSession] = None,
    direction: Optional[models.TradeDirection] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> int:
    query = db.query(func.count(models.Trade.id))
    query = _apply_trade_filters(
        query,
        symbol=symbol,
        strategy_id=strategy_id,
        account_id=account_id,
        session=session,
        direction=direction,
        start_date=start_date,
        end_date=end_date,
    )
    return query.scalar() or 0


def update_trade(db: Session, trade_id: uuid.UUID, payload: schemas.TradeUpdate) -> models.Trade:
    trade = db.query(models.Trade).filter(models.Trade.id == trade_id).first()
    if not trade:
        raise ValueError("Trade not found")

    original_account = trade.account
    original_pnl = trade.pnl

    update_data = payload.model_dump(exclude_unset=True, by_alias=True)

    if "strategy_id" in update_data and update_data["strategy_id"]:
        trade.strategy = _ensure_strategy(db, update_data.pop("strategy_id"))

    if "account_id" in update_data and update_data["account_id"]:
        trade.account = _ensure_account(db, update_data.pop("account_id"))

    confirmations = update_data.pop("confirmations", None)
    if confirmations is not None:
        trade.confirmations = _unique_sequence(confirmations)
        trade.confirmations_count = len(trade.confirmations)

    tag_names = update_data.pop("tag_names", None)
    if tag_names is not None:
        trade.tags = _get_or_create_tags(db, tag_names)

    for field, value in update_data.items():
        if field in {"entryDateTime", "entry_datetime"}:
            trade.entry_timestamp = value
        elif field in {"exitDateTime", "exit_datetime"}:
            trade.exit_timestamp = value
        elif field in {"stopLossPlanned", "stop_loss_planned"}:
            trade.stop_loss_planned = value
        elif field in {"takeProfitPlanned", "take_profit_planned"}:
            trade.take_profit_planned = value
        elif field == "symbol" and value:
            trade.symbol = value.strip().upper()
        elif hasattr(trade, field):
            setattr(trade, field, value)

    # Recalculate metrics
    pnl, risk_per_trade, rr_planned, r_multiple = calculations.calculate_trade_metrics(
        direction=trade.direction,
        entry_price=trade.entry_price,
        exit_price=trade.exit_price,
        quantity=trade.quantity,
        commissions=trade.commissions,
        stop_loss=trade.stop_loss_planned,
        take_profit=trade.take_profit_planned,
    )

    trade.pnl = pnl
    trade.risk_per_trade = risk_per_trade
    trade.rr_planned = rr_planned
    trade.r_multiple = r_multiple

    if trade.confirmations is not None:
        trade.confirmations_count = len(trade.confirmations)

    if original_account.id == trade.account.id:
        _update_account_balance(trade.account, pnl - original_pnl)
    else:
        _update_account_balance(original_account, -original_pnl)
        _update_account_balance(trade.account, pnl)

    db.commit()
    db.refresh(trade)
    return trade


# ---------------------------------------------------------------------------
# Dashboard & analytics helpers
# ---------------------------------------------------------------------------


def get_kpis(db: Session) -> schemas.KPIsResponse:
    trades = db.query(models.Trade).all()
    if not trades:
        return schemas.KPIsResponse(
            total_pnl=Decimal("0"),
            win_rate=0.0,
            total_trades=0,
            winning_trades=0,
            losing_trades=0,
            average_win=Decimal("0"),
            average_loss=Decimal("0"),
            profit_factor=0.0,
        )

    total_trades = len(trades)
    wins = [t for t in trades if t.pnl > DECIMAL_ZERO]
    losses = [t for t in trades if t.pnl < DECIMAL_ZERO]

    total_pnl = sum((t.pnl for t in trades), start=DECIMAL_ZERO)
    total_wins = sum((t.pnl for t in wins), start=DECIMAL_ZERO)
    total_losses = sum((t.pnl for t in losses), start=DECIMAL_ZERO)

    average_win = total_wins / len(wins) if wins else DECIMAL_ZERO
    average_loss = total_losses / len(losses) if losses else DECIMAL_ZERO

    profit_factor = float(total_wins / abs(total_losses)) if total_losses != DECIMAL_ZERO else float("inf")
    win_rate = len(wins) / total_trades if total_trades else 0.0

    return schemas.KPIsResponse(
        total_pnl=total_pnl,
        win_rate=win_rate,
        total_trades=total_trades,
        winning_trades=len(wins),
        losing_trades=len(losses),
        average_win=average_win,
        average_loss=average_loss,
        profit_factor=profit_factor,
    )


def get_equity_curve(db: Session) -> List[schemas.EquityCurvePoint]:
    trades = db.query(models.Trade).order_by(models.Trade.exit_timestamp.asc()).all()
    cumulative = DECIMAL_ZERO
    curve: List[schemas.EquityCurvePoint] = []
    for trade in trades:
        cumulative += trade.pnl
        curve.append(
            schemas.EquityCurvePoint(
                date=trade.exit_timestamp.strftime("%Y-%m-%d"),
                cumulative_pnl=cumulative,
            )
        )
    return curve


def get_performance_by_tag(db: Session) -> List[schemas.PerformanceByTag]:
    trades = (
        db.query(models.Trade)
        .join(models.Trade.tags)
        .options(joinedload(models.Trade.tags))
        .all()
    )
    if not trades:
        return []

    accumulator: Dict[str, Dict[str, Decimal]] = defaultdict(lambda: {"pnl": DECIMAL_ZERO, "wins": DECIMAL_ZERO, "count": 0})

    for trade in trades:
        for tag in trade.tags:
            stats = accumulator[tag.name]
            stats["pnl"] += trade.pnl
            stats["count"] += 1
            if trade.pnl > DECIMAL_ZERO:
                stats["wins"] += 1

    result: List[schemas.PerformanceByTag] = []
    for tag_name, stats in accumulator.items():
        win_rate = float(stats["wins"] / stats["count"]) if stats["count"] else 0.0
        result.append(
            schemas.PerformanceByTag(
                tag_name=tag_name,
                total_pnl=stats["pnl"],
                win_rate=win_rate,
                trade_count=stats["count"],
            )
        )
    return result


def _summarize_trades(trades: List[models.Trade]) -> Tuple[int, float, float, float, float, float, Decimal]:
    if not trades:
        return 0, 0.0, 0.0, 0.0, 0.0, 0.0, DECIMAL_ZERO

    total_trades = len(trades)
    total_pnl = sum((t.pnl for t in trades), start=DECIMAL_ZERO)
    wins = [t for t in trades if t.pnl > DECIMAL_ZERO]
    losses = [t for t in trades if t.pnl < DECIMAL_ZERO]

    win_rate = len(wins) / total_trades if total_trades else 0.0

    gross_profit = sum((t.pnl for t in wins), start=DECIMAL_ZERO)
    gross_loss = sum((t.pnl for t in losses), start=DECIMAL_ZERO)
    profit_factor = float(gross_profit / abs(gross_loss)) if gross_loss != DECIMAL_ZERO else float("inf")

    r_values = [t.r_multiple for t in trades if t.r_multiple is not None]
    if r_values:
        total_r = float(sum(r_values))
        average_r = total_r / len(r_values)
        win_r = [val for val in r_values if val > 0]
        loss_r = [val for val in r_values if val < 0]
        avg_win_r = sum(win_r) / len(win_r) if win_r else 0.0
        avg_loss_r = sum(loss_r) / len(loss_r) if loss_r else 0.0
        expectancy_r = win_rate * avg_win_r - (1 - win_rate) * abs(avg_loss_r)
    else:
        total_r = 0.0
        average_r = 0.0
        expectancy_r = 0.0

    return total_trades, win_rate, expectancy_r, profit_factor, total_r, average_r, total_pnl


def get_strategy_dashboard(
    db: Session,
    *,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: Optional[models.TradeSession] = None,
    direction: Optional[models.TradeDirection] = None,
) -> List[schemas.StrategyDashboardSummary]:
    base_query = (
        db.query(models.Trade)
        .options(joinedload(models.Trade.strategy))
        .filter(models.Trade.strategy_id.isnot(None))
    )
    base_query = _apply_trade_filters(
        base_query,
        session=session,
        direction=direction,
        start_date=start_date,
        end_date=end_date,
    )
    trades = base_query.all()

    grouped: Dict[uuid.UUID, List[models.Trade]] = defaultdict(list)
    for trade in trades:
        grouped[trade.strategy_id].append(trade)

    summaries: List[schemas.StrategyDashboardSummary] = []
    for strategy_id, strat_trades in grouped.items():
        total_trades, win_rate, expectancy_r, profit_factor, total_r, average_r, total_pnl = _summarize_trades(strat_trades)
        summaries.append(
            schemas.StrategyDashboardSummary(
                strategy_id=strategy_id,
                strategy_name=strat_trades[0].strategy.name,
                trades=total_trades,
                win_rate=win_rate,
                expectancy_r=expectancy_r,
                profit_factor=profit_factor,
                total_r=total_r,
                average_r=average_r,
                total_pnl=total_pnl,
            )
        )
    return summaries


def get_account_dashboard(
    db: Session,
    *,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: Optional[models.TradeSession] = None,
    direction: Optional[models.TradeDirection] = None,
) -> List[schemas.AccountDashboardSummary]:
    base_query = (
        db.query(models.Trade)
        .options(joinedload(models.Trade.account))
        .filter(models.Trade.account_id.isnot(None))
    )
    base_query = _apply_trade_filters(
        base_query,
        session=session,
        direction=direction,
        start_date=start_date,
        end_date=end_date,
    )
    trades = base_query.all()

    grouped: Dict[uuid.UUID, List[models.Trade]] = defaultdict(list)
    for trade in trades:
        grouped[trade.account_id].append(trade)

    summaries: List[schemas.AccountDashboardSummary] = []
    for account_id, account_trades in grouped.items():
        total_trades, win_rate, expectancy_r, profit_factor, total_r, average_r, total_pnl = _summarize_trades(account_trades)
        summaries.append(
            schemas.AccountDashboardSummary(
                account_id=account_id,
                account_name=account_trades[0].account.name,
                trades=total_trades,
                win_rate=win_rate,
                expectancy_r=expectancy_r,
                profit_factor=profit_factor,
                total_r=total_r,
                average_r=average_r,
                total_pnl=total_pnl,
                current_balance=account_trades[0].account.current_balance,
            )
        )
    return summaries
