import enum
import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Numeric,
    UUID,
    ForeignKey,
    Table,
    Integer,
    Text,
    Enum as SqlEnum,
    Date,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class PreferredDirection(str, enum.Enum):
    LONG = "Long"
    SHORT = "Short"
    BOTH = "Both"


class AccountType(str, enum.Enum):
    LIVE = "Live"
    FUNDED = "Funded"
    EVALUATION = "Evaluation"
    CHALLENGE = "Challenge"
    DEMO = "Demo"


class TradeDirection(str, enum.Enum):
    LONG = "Long"
    SHORT = "Short"


class TradeSession(str, enum.Enum):
    NY = "NY"
    LONDON = "London"
    ASIA = "Asia"


# Association table for many-to-many relationship between trades and tags
trade_tags = Table(
    "trade_tags",
    Base.metadata,
    Column("trade_id", UUID(as_uuid=True), ForeignKey("trades.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), unique=True, nullable=False)
    category = Column(String(32), nullable=True)
    timeframes = Column(ARRAY(String), nullable=False, default=list)
    preferred_direction = Column(
        SqlEnum(
            PreferredDirection,
            name="preferred_direction_enum",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
        default=PreferredDirection.BOTH,
    )
    entry_criteria = Column(Text, nullable=True)
    exit_criteria = Column(Text, nullable=True)
    invalid_conditions = Column(Text, nullable=True)
    state_of_mind = Column(Text, nullable=True)
    common_bias = Column(Text, nullable=True)
    example_image_url = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    trades = relationship("Trade", back_populates="strategy")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), unique=True, nullable=False)
    type = Column(
        SqlEnum(AccountType, name="account_type_enum", values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=False,
    )
    broker_platform = Column(String(120), nullable=True)
    initial_balance = Column(Numeric(15, 2), nullable=False)
    current_balance = Column(Numeric(15, 2), nullable=False)
    commission_split_percent = Column(Numeric(5, 2), nullable=True)
    max_daily_drawdown = Column(Numeric(15, 2), nullable=True)
    max_overall_drawdown = Column(Numeric(15, 2), nullable=True)
    profit_target = Column(Numeric(15, 2), nullable=True)
    allowed_instruments = Column(Text, nullable=True)
    violation_triggers = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    expiration_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    trades = relationship("Trade", back_populates="account")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(20), nullable=False)
    direction = Column(
        SqlEnum(
            TradeDirection,
            name="trade_direction_enum",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )
    quantity = Column(Numeric(15, 2), nullable=False)
    session = Column(
        SqlEnum(TradeSession, name="trade_session_enum", values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=True,
    )

    strategy_id = Column(UUID(as_uuid=True), ForeignKey("strategies.id", ondelete="RESTRICT"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False)

    entry_timestamp = Column(DateTime(timezone=True), nullable=False)
    exit_timestamp = Column(DateTime(timezone=True), nullable=False)
    entry_price = Column(Numeric(18, 6), nullable=False)
    stop_loss_planned = Column(Numeric(18, 6), nullable=True)
    take_profit_planned = Column(Numeric(18, 6), nullable=True)
    exit_price = Column(Numeric(18, 6), nullable=False)
    commissions = Column(Numeric(15, 2), default=0)

    risk_per_trade = Column(Numeric(18, 6), nullable=True)
    rr_planned = Column(Numeric(18, 6), nullable=True)
    pnl = Column(Numeric(18, 6), nullable=False, default=0.0)
    r_multiple = Column(Numeric(18, 6), nullable=True)
    import_method = Column(String(16), default="manual")

    confirmations = Column(ARRAY(String), nullable=False, default=list)
    confirmations_count = Column(Integer, nullable=False, default=0)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    strategy = relationship("Strategy", back_populates="trades")
    account = relationship("Account", back_populates="trades")
    tags = relationship("Tag", secondary=trade_tags, back_populates="trades")

    @property
    def entry_datetime(self):
        return self.entry_timestamp

    @entry_datetime.setter
    def entry_datetime(self, value):
        self.entry_timestamp = value

    @property
    def exit_datetime(self):
        return self.exit_timestamp

    @exit_datetime.setter
    def exit_datetime(self, value):
        self.exit_timestamp = value


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    type = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    trades = relationship("Trade", secondary=trade_tags, back_populates="tags")
