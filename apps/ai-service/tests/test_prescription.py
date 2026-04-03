import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "MediChainLK AI Service"
    assert data["status"] == "running"


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_liveness():
    """Test liveness probe."""
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["alive"] is True


def test_readiness():
    """Test readiness probe."""
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json()["ready"] is True


class TestConfidenceService:
    """Test confidence scoring."""
    
    def test_high_confidence(self):
        from app.services.confidence_service import ConfidenceService
        from app.models.prescription import ConfidenceTier
        
        service = ConfidenceService()
        assert service.get_tier(0.95) == ConfidenceTier.HIGH
        assert service.get_tier(0.90) == ConfidenceTier.HIGH
    
    def test_medium_confidence(self):
        from app.services.confidence_service import ConfidenceService
        from app.models.prescription import ConfidenceTier
        
        service = ConfidenceService()
        assert service.get_tier(0.85) == ConfidenceTier.MEDIUM
        assert service.get_tier(0.70) == ConfidenceTier.MEDIUM
    
    def test_low_confidence(self):
        from app.services.confidence_service import ConfidenceService
        from app.models.prescription import ConfidenceTier
        
        service = ConfidenceService()
        assert service.get_tier(0.65) == ConfidenceTier.LOW
        assert service.get_tier(0.50) == ConfidenceTier.LOW
    
    def test_auto_accept_high_confidence(self):
        from app.services.confidence_service import ConfidenceService
        
        service = ConfidenceService()
        assert service.should_auto_accept(0.95, is_high_alert_medicine=False) is True
        assert service.should_auto_accept(0.95, is_high_alert_medicine=True) is False


class TestMatchingService:
    """Test medicine matching."""
    
    @pytest.mark.asyncio
    async def test_match_paracetamol(self):
        from app.services.matching_service import MatchingService
        from app.models.prescription import ExtractedMedicine
        
        service = MatchingService()
        medicines = [
            ExtractedMedicine(raw_text="Tab Paracetamol 500mg", drug_name="paracetamol", confidence=0.0)
        ]
        
        matched = await service.match_medicines(medicines)
        assert len(matched) == 1
        assert matched[0].matched_formulary_id == "med001"
        assert matched[0].confidence > 0.7
