from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import accounts, dashboard, strategies, trades

app = FastAPI(title="Trading Journal API", version="2.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(trades.router, prefix="/api", tags=["trades"])
app.include_router(strategies.router, prefix="/api", tags=["strategies"])
app.include_router(accounts.router, prefix="/api", tags=["accounts"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])


@app.get("/")
async def root():
    return {"message": "Trading Journal API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
