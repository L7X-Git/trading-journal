from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter()

@router.get("/dashboard/kpis", response_model=schemas.KPIsResponse)
async def get_dashboard_kpis(db: Session = Depends(get_db)):
    return crud.get_kpis(db=db)

@router.get("/dashboard/equity-curve", response_model=List[schemas.EquityCurvePoint])
async def get_equity_curve(db: Session = Depends(get_db)):
    return crud.get_equity_curve(db=db)

@router.get("/dashboard/performance-by-tag", response_model=List[schemas.PerformanceByTag])
async def get_performance_by_tag(db: Session = Depends(get_db)):
    return crud.get_performance_by_tag(db=db)