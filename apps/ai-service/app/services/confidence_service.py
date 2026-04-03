from app.models.prescription import ConfidenceTier


class ConfidenceService:
    """Three-tier confidence scoring system."""
    
    HIGH_THRESHOLD = 0.90
    MEDIUM_THRESHOLD = 0.70
    
    def get_tier(self, confidence: float) -> ConfidenceTier:
        """Determine confidence tier based on score."""
        if confidence >= self.HIGH_THRESHOLD:
            return ConfidenceTier.HIGH
        elif confidence >= self.MEDIUM_THRESHOLD:
            return ConfidenceTier.MEDIUM
        else:
            return ConfidenceTier.LOW
    
    def should_auto_accept(
        self, confidence: float, is_high_alert_medicine: bool
    ) -> bool:
        """
        Determine if prescription can be auto-accepted.
        High-alert medicines (insulin, warfarin) always require pharmacist review.
        """
        if is_high_alert_medicine:
            return False
        return confidence >= self.HIGH_THRESHOLD
    
    def calculate_overall_confidence(self, medicine_confidences: list[float]) -> float:
        """Calculate weighted overall confidence from individual medicine scores."""
        if not medicine_confidences:
            return 0.0
        return sum(medicine_confidences) / len(medicine_confidences)
