import csv
import io
from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter()


@router.get("/trades/confirmations/options", response_model=list[str])
async def list_confirmation_options() -> list[str]:
    return schemas.CONFIRMATION_OPTIONS


@router.post("/trades", response_model=schemas.Trade, status_code=status.HTTP_201_CREATED)
async def create_trade(trade: schemas.TradeCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_trade(db=db, payload=trade)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/trades/{trade_id}", response_model=schemas.Trade)
async def get_trade(trade_id: uuid.UUID, db: Session = Depends(get_db)):
    trade = crud.get_trade(db=db, trade_id=trade_id)
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    return trade


@router.put("/trades/{trade_id}", response_model=schemas.Trade)
async def update_trade(trade_id: uuid.UUID, trade_update: schemas.TradeUpdate, db: Session = Depends(get_db)):
    try:
        return crud.update_trade(db=db, trade_id=trade_id, payload=trade_update)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/trades", response_model=schemas.TradeListResponse)
async def list_trades(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    symbol: Optional[str] = None,
    strategy_id: Optional[uuid.UUID] = None,
    account_id: Optional[uuid.UUID] = None,
    session: Optional[models.TradeSession] = None,
    direction: Optional[models.TradeDirection] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    skip = (page - 1) * per_page
    trades = crud.list_trades(
        db=db,
        skip=skip,
        limit=per_page,
        symbol=symbol,
        strategy_id=strategy_id,
        account_id=account_id,
        session=session,
        direction=direction,
        start_date=start_date,
        end_date=end_date,
    )
    total = crud.get_trade_count(
        db=db,
        symbol=symbol,
        strategy_id=strategy_id,
        account_id=account_id,
        session=session,
        direction=direction,
        start_date=start_date,
        end_date=end_date,
    )

    return schemas.TradeListResponse(trades=trades, total=total, page=page, per_page=per_page)


@router.post("/trades/csv")
async def upload_trades_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a CSV")

    try:
        contents = await file.read()
        csv_reader = csv.DictReader(io.StringIO(contents.decode("utf-8")))
        created = 0

        for row in csv_reader:
            try:
                trade_payload = schemas.TradeCreate(
                    symbol=row["symbol"],
                    direction=models.TradeDirection(row["direction"]),
                    quantity=Decimal(row["quantity"]),
                    session=models.TradeSession(row["session"]) if row.get("session") else None,
                    strategy_id=uuid.UUID(row["strategy_id"]),
                    account_id=uuid.UUID(row["account_id"]),
                    entryDateTime=datetime.fromisoformat(row["entry_datetime"]),
                    exitDateTime=datetime.fromisoformat(row["exit_datetime"]),
                    entry_price=Decimal(row["entry_price"]),
                    stopLossPlanned=Decimal(row["stop_loss_planned"]) if row.get("stop_loss_planned") else None,
                    takeProfitPlanned=Decimal(row["take_profit_planned"]) if row.get("take_profit_planned") else None,
                    exit_price=Decimal(row["exit_price"]),
                    commissions=Decimal(row.get("commissions", "0")),
                    confirmations=row.get("confirmations", "").split("|") if row.get("confirmations") else [],
                    notes=row.get("notes"),
                    import_method="csv",
                    tag_names=[tag.strip() for tag in row.get("tags", "").split("|") if tag.strip()],
                )
                crud.create_trade(db=db, payload=trade_payload)
                created += 1
            except Exception as exc:  # noqa: BLE001
                # Skip invalid rows but keep processing others
                print(f"Failed to import row {row}: {exc}")
                continue

        return {"message": f"Imported {created} trades"}

    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
