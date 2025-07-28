from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from . import models, schemas
from typing import List, Optional
import uuid

def create_trade(db: Session, trade: schemas.TradeCreate):
    # Calculate net_pnl if not provided
    if trade.net_pnl is None:
        gross_pnl = (trade.exit_price - trade.entry_price) * trade.quantity
        trade.net_pnl = gross_pnl - trade.commissions
    
    # Create trade record
    db_trade = models.Trade(
        account_id=trade.account_id,
        symbol=trade.symbol,
        entry_timestamp=trade.entry_timestamp,
        exit_timestamp=trade.exit_timestamp,
        entry_price=trade.entry_price,
        exit_price=trade.exit_price,
        quantity=trade.quantity,
        commissions=trade.commissions,
        net_pnl=trade.net_pnl,
        import_method=trade.import_method
    )
    
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    
    # Handle tags
    for tag_name in trade.tag_names:
        # Find or create tag
        tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
        if not tag:
            # Determine tag type (simple logic - can be improved)
            tag_type = "setup" if tag_name.lower() in ["breakout", "reversal", "trend"] else "error" if "error" in tag_name.lower() or "mistake" in tag_name.lower() else "emotion"
            tag = models.Tag(name=tag_name, type=tag_type)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        
        db_trade.tags.append(tag)
    
    db.commit()
    return db_trade

def get_trades(db: Session, skip: int = 0, limit: int = 100, symbol: Optional[str] = None):
    query = db.query(models.Trade)
    
    if symbol:
        query = query.filter(models.Trade.symbol == symbol)
    
    return query.offset(skip).limit(limit).all()

def get_trade_count(db: Session, symbol: Optional[str] = None):
    query = db.query(models.Trade)
    
    if symbol:
        query = query.filter(models.Trade.symbol == symbol)
    
    return query.count()

def get_kpis(db: Session):
    trades = db.query(models.Trade).all()
    
    if not trades:
        return {
            "total_pnl": 0.0,
            "win_rate": 0.0,
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "average_win": 0.0,
            "average_loss": 0.0,
            "profit_factor": 0.0
        }
    
    total_trades = len(trades)
    winning_trades = [t for t in trades if t.net_pnl > 0]
    losing_trades = [t for t in trades if t.net_pnl < 0]
    
    total_pnl = sum(t.net_pnl for t in trades)
    win_rate = len(winning_trades) / total_trades if total_trades > 0 else 0.0
    
    average_win = sum(t.net_pnl for t in winning_trades) / len(winning_trades) if winning_trades else 0.0
    average_loss = sum(t.net_pnl for t in losing_trades) / len(losing_trades) if losing_trades else 0.0
    
    total_wins = sum(t.net_pnl for t in winning_trades)
    total_losses = abs(sum(t.net_pnl for t in losing_trades))
    profit_factor = total_wins / total_losses if total_losses > 0 else float('inf')
    
    return {
        "total_pnl": total_pnl,
        "win_rate": win_rate,
        "total_trades": total_trades,
        "winning_trades": len(winning_trades),
        "losing_trades": len(losing_trades),
        "average_win": average_win,
        "average_loss": average_loss,
        "profit_factor": profit_factor
    }

def get_equity_curve(db: Session):
    trades = db.query(models.Trade).order_by(models.Trade.exit_timestamp).all()
    
    equity_curve = []
    cumulative_pnl = 0.0
    
    for trade in trades:
        cumulative_pnl += trade.net_pnl
        equity_curve.append({
            "date": trade.exit_timestamp.strftime("%Y-%m-%d"),
            "cumulative_pnl": cumulative_pnl
        })
    
    return equity_curve

def get_performance_by_tag(db: Session):
    # Get all trades with their tags
    trades_with_tags = db.query(models.Trade).join(models.Trade.tags).all()
    
    # Group by tag
    tag_performance = {}
    
    for trade in trades_with_tags:
        for tag in trade.tags:
            if tag.name not in tag_performance:
                tag_performance[tag.name] = {
                    "total_pnl": 0.0,
                    "trades": []
                }
            
            tag_performance[tag.name]["total_pnl"] += trade.net_pnl
            tag_performance[tag.name]["trades"].append(trade)
    
    # Calculate metrics for each tag
    result = []
    for tag_name, data in tag_performance.items():
        trades = data["trades"]
        winning_trades = [t for t in trades if t.net_pnl > 0]
        
        result.append({
            "tag_name": tag_name,
            "total_pnl": data["total_pnl"],
            "win_rate": len(winning_trades) / len(trades) if trades else 0.0,
            "trade_count": len(trades)
        })
    
    return result