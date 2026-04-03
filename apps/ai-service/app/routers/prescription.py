from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from app.models.prescription import (
    PrescriptionAnalysisRequest,
    PrescriptionAnalysisResponse,
)
from app.services.ocr_service import OCRService
from app.services.nlp_service import NLPService
from app.services.matching_service import MatchingService
from app.services.confidence_service import ConfidenceService
from app.utils.s3_client import download_from_s3

router = APIRouter()

ocr_service = OCRService()
nlp_service = NLPService()
matching_service = MatchingService()
confidence_service = ConfidenceService()


@router.post("/analyze", response_model=PrescriptionAnalysisResponse)
async def analyze_prescription(request: PrescriptionAnalysisRequest):
    """
    Full prescription analysis pipeline:
    S3 download → preprocess → OCR → NLP → match → confidence score
    """
    try:
        # Download image from S3
        image_bytes = await download_from_s3(request.s3_key)
        
        # OCR extraction
        raw_text, avg_confidence = await ocr_service.extract_text(
            image_bytes, request.language_hints
        )
        
        # NLP entity extraction
        extracted = nlp_service.extract_medicines(raw_text)
        
        # Fuzzy match against formulary
        matched = await matching_service.match_medicines(extracted)
        
        # Calculate confidence tier
        confidence_tier = confidence_service.get_tier(avg_confidence)
        
        return PrescriptionAnalysisResponse(
            prescription_id=request.prescription_id,
            raw_text=raw_text,
            language="mixed",
            overall_confidence=avg_confidence,
            confidence_tier=confidence_tier,
            extracted_medicines=matched,
            processed_at=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
