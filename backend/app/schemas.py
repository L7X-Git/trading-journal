from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class TagBase(BaseModel):
    name: str = Field(..., max_length=50)
    type: str = Field(..., max_length=20)

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True

class TradeBase(BaseModel):
    account_id: Optional[uuid.UUID] = None
    symbol: str = Field(..., max_length=20)
    entry_timestamp: datetime
    exit_timestamp: datetime
    entry_price: float
    exit_price: float
    quantity: float
    commissions: float = 0.0
    net_pnl: float
    import_method: str = Field(default="manual", max_length=10)

class TradeCreate(TradeBase):
    tag_names: List[str] = []

class Trade(TradeBase):
    id: uuid.UUID
    tags: List[Tag] = []
    
    class Config:
        from_attributes = True

class TradeListResponse(BaseModel):
    trades: List[Trade]
    total: int
    page: int
    per_page: int

class KPIsResponse(BaseModel):
    total_pnl: float
    win_rate: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    average_win: float
    average_loss: float
    profit_factor: float

class EquityCurvePoint(BaseModel):
    date: str
    cumulative_pnl: float

class PerformanceByTag(BaseModel):
    tag_name: str
    total_pnl: float
    win_rate: float
    trade_count: int