import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter()


@router.get("/strategies", response_model=List[schemas.Strategy])
async def list_strategies(db: Session = Depends(get_db)):
    return crud.list_strategies(db=db)


@router.post("/strategies", response_model=schemas.Strategy, status_code=status.HTTP_201_CREATED)
async def create_strategy(strategy: schemas.StrategyCreate, db: Session = Depends(get_db)):
    return crud.create_strategy(db=db, payload=strategy)


@router.get("/strategies/{strategy_id}", response_model=schemas.Strategy)
async def get_strategy(strategy_id: uuid.UUID, db: Session = Depends(get_db)):
    strategy = crud.get_strategy(db=db, strategy_id=strategy_id)
    if not strategy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    return strategy


@router.put("/strategies/{strategy_id}", response_model=schemas.Strategy)
async def update_strategy(strategy_id: uuid.UUID, strategy: schemas.StrategyUpdate, db: Session = Depends(get_db)):
    try:
        return crud.update_strategy(db=db, strategy_id=strategy_id, payload=strategy)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/strategies/{strategy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_strategy(strategy_id: uuid.UUID, db: Session = Depends(get_db)):
    try:
        crud.delete_strategy(db=db, strategy_id=strategy_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
