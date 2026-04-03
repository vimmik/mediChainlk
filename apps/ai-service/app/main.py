from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import prescription, health
from app.config import settings

app = FastAPI(
    title="MediChainLK AI Service",
    description="OCR and NLP pipeline for prescription processing",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.API_URL],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(prescription.router, prefix="/prescriptions", tags=["Prescriptions"])


@app.get("/")
async def root():
    return {"service": "MediChainLK AI Service", "version": "1.0.0", "status": "running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
