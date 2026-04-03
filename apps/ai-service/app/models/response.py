from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    status: str
    version: str
    service: str
    dependencies: Optional[dict] = None
