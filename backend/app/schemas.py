from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from .models import AccountType, PreferredDirection, TradeDirection, TradeSession

# ---------------------------------------------------------------------------
# Tag schemas
# ---------------------------------------------------------------------------


class TagBase(BaseModel):
    name: str = Field(..., max_length=50)
    type: str = Field(..., max_length=20)


class TagCreate(TagBase):
    pass


class Tag(TagBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Strategy schemas
# ---------------------------------------------------------------------------


class StrategyBase(BaseModel):
    name: str = Field(..., max_length=120)
    category: Optional[str] = Field(default=None, max_length=32)
    timeframes: List[str] = Field(default_factory=list)
    preferred_direction: PreferredDirection = Field(default=PreferredDirection.BOTH)
    entry_criteria: Optional[str] = None
    exit_criteria: Optional[str] = None
    invalid_conditions: Optional[str] = None
    state_of_mind: Optional[str] = None
    common_bias: Optional[str] = None
    example_image_url: Optional[str] = Field(default=None, max_length=512)


class StrategyCreate(StrategyBase):
    pass


class StrategyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    category: Optional[str] = Field(default=None, max_length=32)
    timeframes: Optional[List[str]] = None
    preferred_direction: Optional[PreferredDirection] = None
    entry_criteria: Optional[str] = None
    exit_criteria: Optional[str] = None
    invalid_conditions: Optional[str] = None
    state_of_mind: Optional[str] = None
    common_bias: Optional[str] = None
    example_image_url: Optional[str] = Field(default=None, max_length=512)


class Strategy(StrategyBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Account schemas
# ---------------------------------------------------------------------------


class AccountBase(BaseModel):
    name: str = Field(..., max_length=120)
    type: AccountType
    broker_platform: Optional[str] = Field(default=None, max_length=120)
    initial_balance: Decimal
    current_balance: Optional[Decimal] = None
    commission_split_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    max_daily_drawdown: Optional[Decimal] = None
    max_overall_drawdown: Optional[Decimal] = None
    profit_target: Optional[Decimal] = None
    allowed_instruments: Optional[str] = None
    violation_triggers: Optional[str] = None
    start_date: Optional[date] = None
    expiration_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("initial_balance")
    @classmethod
    def positive_initial_balance(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("initial_balance must be greater than zero")
        return value


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AccountType] = None
    broker_platform: Optional[str] = None
    commission_split_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    max_daily_drawdown: Optional[Decimal] = None
    max_overall_drawdown: Optional[Decimal] = None
    profit_target: Optional[Decimal] = None
    allowed_instruments: Optional[str] = None
    violation_triggers: Optional[str] = None
    start_date: Optional[date] = None
    expiration_date: Optional[date] = None
    notes: Optional[str] = None
    current_balance: Optional[Decimal] = None


class Account(AccountBase):
    id: uuid.UUID
    current_balance: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Trade schemas
# ---------------------------------------------------------------------------


CONFIRMATION_OPTIONS = [
    "TF Alignment: Weekly",
    "TF Alignment: Daily",
    "TF Alignment: 4H",
    "TF Alignment: 1H",
    "TF Alignment: 15M",
    "SMT Divergence",
    "HTF Rebalance",
    "NDOG Rebalance",
    "BOS Confirmed",
    "Liquidity Grab",
    "OTE",
    "Breaker",
    "Fair Value Gap Filled",
    "Imbalance",
    "Killzone (NY/London)",
]


class TradeBase(BaseModel):
    symbol: str = Field(..., max_length=20)
    direction: TradeDirection
    quantity: Decimal = Field(..., gt=0)
    session: Optional[TradeSession] = None
    strategy_id: uuid.UUID
    account_id: uuid.UUID
    entry_datetime: datetime = Field(alias="entryDateTime")
    exit_datetime: datetime = Field(alias="exitDateTime")
    entry_price: Decimal = Field(..., gt=0)
    stop_loss_planned: Optional[Decimal] = Field(default=None, gt=0, alias="stopLossPlanned")
    take_profit_planned: Optional[Decimal] = Field(default=None, gt=0, alias="takeProfitPlanned")
    exit_price: Decimal = Field(..., gt=0)
    commissions: Decimal = Field(default=Decimal("0"), ge=0)
    confirmations: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    import_method: str = Field(default="manual", max_length=16)

    @model_validator(mode="after")
    def validate_datetime_order(cls, values: "TradeBase"):
        if values.exit_datetime < values.entry_datetime:
            raise ValueError("exitDateTime must be greater than or equal to entryDateTime")
        if values.entry_price == values.exit_price:
            raise ValueError("entryPrice and exitPrice cannot be equal")
        return values


class TradeCreate(TradeBase):
    tag_names: List[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class TradeUpdate(BaseModel):
    symbol: Optional[str] = Field(default=None, max_length=20)
    direction: Optional[TradeDirection] = None
    quantity: Optional[Decimal] = Field(default=None, gt=0)
    session: Optional[TradeSession] = None
    strategy_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None
    entry_datetime: Optional[datetime] = Field(default=None, alias="entryDateTime")
    exit_datetime: Optional[datetime] = Field(default=None, alias="exitDateTime")
    entry_price: Optional[Decimal] = Field(default=None, gt=0)
    stop_loss_planned: Optional[Decimal] = Field(default=None, gt=0, alias="stopLossPlanned")
    take_profit_planned: Optional[Decimal] = Field(default=None, gt=0, alias="takeProfitPlanned")
    exit_price: Optional[Decimal] = Field(default=None, gt=0)
    commissions: Optional[Decimal] = Field(default=None, ge=0)
    tag_names: Optional[List[str]] = None
    confirmations: Optional[List[str]] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_datetime_order(cls, values: "TradeUpdate"):
        if values.entry_datetime and values.exit_datetime and values.exit_datetime < values.entry_datetime:
            raise ValueError("exitDateTime must be greater than or equal to entryDateTime")
        return values

    class Config:
        populate_by_name = True


class TradeComputedFields(BaseModel):
    risk_per_trade: Optional[Decimal] = None
    rr_planned: Optional[Decimal] = None
    pnl: Decimal
    r_multiple: Optional[Decimal] = None
    confirmations_count: int


class Trade(TradeBase, TradeComputedFields):
    id: uuid.UUID
    strategy: Strategy
    account: Account
    tags: List[Tag]
    confirmations: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class TradeListResponse(BaseModel):
    trades: List[Trade]
    total: int
    page: int
    per_page: int


# ---------------------------------------------------------------------------
# Dashboard schemas
# ---------------------------------------------------------------------------


class KPIsResponse(BaseModel):
    total_pnl: Decimal
    win_rate: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    average_win: Decimal
    average_loss: Decimal
    profit_factor: float


class EquityCurvePoint(BaseModel):
    date: str
    cumulative_pnl: Decimal


class PerformanceByTag(BaseModel):
    tag_name: str
    total_pnl: Decimal
    win_rate: float
    trade_count: int


class StrategyDashboardSummary(BaseModel):
    strategy_id: uuid.UUID
    strategy_name: str
    trades: int
    win_rate: float
    expectancy_r: float
    profit_factor: float
    total_r: float
    average_r: float
    total_pnl: Decimal


class AccountDashboardSummary(BaseModel):
    account_id: uuid.UUID
    account_name: str
    trades: int
    win_rate: float
    expectancy_r: float
    profit_factor: float
    total_r: float
    average_r: float
    total_pnl: Decimal
    current_balance: Decimal
