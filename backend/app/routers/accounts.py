import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter()


@router.get("/accounts", response_model=List[schemas.Account])
async def list_accounts(db: Session = Depends(get_db)):
    return crud.list_accounts(db=db)


@router.post("/accounts", response_model=schemas.Account, status_code=status.HTTP_201_CREATED)
async def create_account(account: schemas.AccountCreate, db: Session = Depends(get_db)):
    return crud.create_account(db=db, payload=account)


@router.get("/accounts/{account_id}", response_model=schemas.Account)
async def get_account(account_id: uuid.UUID, db: Session = Depends(get_db)):
    account = crud.get_account(db=db, account_id=account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


@router.put("/accounts/{account_id}", response_model=schemas.Account)
async def update_account(account_id: uuid.UUID, account: schemas.AccountUpdate, db: Session = Depends(get_db)):
    try:
        return crud.update_account(db=db, account_id=account_id, payload=account)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(account_id: uuid.UUID, db: Session = Depends(get_db)):
    try:
        crud.delete_account(db=db, account_id=account_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
