from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from datetime import datetime
from .. import crud, schemas, models
from ..database import get_db

router = APIRouter()

@router.post("/trades/manual", response_model=schemas.Trade)
async def create_manual_trade(trade: schemas.TradeCreate, db: Session = Depends(get_db)):
    return crud.create_trade(db=db, trade=trade)

@router.post("/trades/csv")
async def upload_trades_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        contents = await file.read()
        csv_reader = csv.DictReader(io.StringIO(contents.decode('utf-8')))
        
        created_trades = []
        
        for row in csv_reader:
            try:
                # Parse CSV row - assuming standard format
                trade_data = schemas.TradeCreate(
                    symbol=row.get('symbol', ''),
                    entry_timestamp=datetime.fromisoformat(row.get('entry_timestamp', '')),
                    exit_timestamp=datetime.fromisoformat(row.get('exit_timestamp', '')),
                    entry_price=float(row.get('entry_price', 0)),
                    exit_price=float(row.get('exit_price', 0)),
                    quantity=float(row.get('quantity', 0)),
                    commissions=float(row.get('commissions', 0)),
                    net_pnl=float(row.get('net_pnl', 0)),  # Will be calculated if not provided
                    import_method='csv'
                )
                
                created_trade = crud.create_trade(db=db, trade=trade_data)
                created_trades.append(created_trade)
                
            except Exception as e:
                print(f"Error processing row: {row}. Error: {e}")
                continue
        
        return {"message": f"Successfully created {len(created_trades)} trades", "trades": created_trades}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

@router.get("/trades", response_model=schemas.TradeListResponse)
async def get_trades(
    page: int = 1,
    per_page: int = 20,
    symbol: Optional[str] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * per_page
    trades = crud.get_trades(db=db, skip=skip, limit=per_page, symbol=symbol)
    total = crud.get_trade_count(db=db, symbol=symbol)
    
    return schemas.TradeListResponse(
        trades=trades,
        total=total,
        page=page,
        per_page=per_page
    )