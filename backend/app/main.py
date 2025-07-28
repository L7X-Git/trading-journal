from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import trades, dashboard

app = FastAPI(title="Trading Journal API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(trades.router, prefix="/api", tags=["trades"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])

@app.get("/")
async def root():
    return {"message": "Trading Journal API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}