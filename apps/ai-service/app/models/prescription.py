from pydantic import BaseModel
from typing import Optional
from enum import Enum


class ConfidenceTier(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ExtractedMedicine(BaseModel):
    raw_text: str
    drug_name: Optional[str] = None
    dosage: Optional[str] = None
    strength: Optional[str] = None
    form: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    duration: Optional[str] = None
    confidence: float
    matched_formulary_id: Optional[str] = None


class PrescriptionAnalysisRequest(BaseModel):
    prescription_id: str
    s3_key: str
    language_hints: list[str] = ["en", "si", "ta"]


class PrescriptionAnalysisResponse(BaseModel):
    prescription_id: str
    raw_text: str
    language: str
    overall_confidence: float
    confidence_tier: ConfidenceTier
    extracted_medicines: list[ExtractedMedicine]
    processed_at: str
