from fastapi import APIRouter
from app.models.response import HealthResponse

router = APIRouter()


@router.get("", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        service="MediChainLK AI Service",
        dependencies={
            "google_cloud_vision": "configured",
            "spacy_med7": "configured",
            "s3": "configured",
        },
    )


@router.get("/ready")
async def readiness_check():
    """Readiness probe - checks if service is ready to accept traffic."""
    # TODO: Check actual service dependencies
    return {"ready": True}


@router.get("/live")
async def liveness_check():
    """Liveness probe - checks if service is alive."""
    return {"alive": True}
