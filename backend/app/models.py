from sqlalchemy import Column, String, DateTime, Numeric, UUID, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

# Association table for many-to-many relationship between trades and tags
trade_tags = Table(
    'trade_tags',
    Base.metadata,
    Column('trade_id', UUID(as_uuid=True), ForeignKey('trades.id'), primary_key=True),
    Column('tag_id', UUID(as_uuid=True), ForeignKey('tags.id'), primary_key=True)
)

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(UUID(as_uuid=True), nullable=True)
    symbol = Column(String(20), nullable=False)
    entry_timestamp = Column(DateTime, nullable=False)
    exit_timestamp = Column(DateTime, nullable=False)
    entry_price = Column(Numeric(10, 2), nullable=False)
    exit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Numeric(15, 2), nullable=False)
    commissions = Column(Numeric(10, 2), default=0.0)
    net_pnl = Column(Numeric(15, 2), nullable=False)
    import_method = Column(String(10), default='manual')  # 'manual' or 'csv'
    
    # Relationships
    tags = relationship("Tag", secondary=trade_tags, back_populates="trades")

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    type = Column(String(20), nullable=False)  # 'setup', 'error', 'emotion', etc.
    
    # Relationships
    trades = relationship("Trade", secondary=trade_tags, back_populates="tags")