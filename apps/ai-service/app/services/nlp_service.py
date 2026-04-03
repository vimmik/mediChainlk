from typing import List
from app.models.prescription import ExtractedMedicine


class NLPService:
    """Medical NLP extraction using spaCy med7 model."""
    
    def __init__(self):
        self.nlp = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Load spaCy med7 model lazily."""
        try:
            import spacy
            self.nlp = spacy.load("en_core_med7_lg")
        except Exception as e:
            print(f"Warning: Could not load med7 model: {e}")
    
    def extract_medicines(self, raw_text: str) -> List[ExtractedMedicine]:
        """
        Extract medicine entities from OCR text using med7 NER.
        
        Med7 entities: DRUG, STRENGTH, FORM, DOSAGE, FREQUENCY, ROUTE, DURATION
        """
        if not self.nlp:
            return self._fallback_extraction(raw_text)
        
        doc = self.nlp(raw_text)
        medicines = []
        
        current_medicine = {}
        for ent in doc.ents:
            label = ent.label_.lower()
            if label == "drug":
                if current_medicine:
                    medicines.append(self._build_medicine(current_medicine))
                current_medicine = {"drug_name": ent.text, "raw_text": ent.sent.text}
            elif current_medicine:
                current_medicine[label] = ent.text
        
        if current_medicine:
            medicines.append(self._build_medicine(current_medicine))
        
        return medicines
    
    def _build_medicine(self, data: dict) -> ExtractedMedicine:
        """Build ExtractedMedicine from entity dict."""
        return ExtractedMedicine(
            raw_text=data.get("raw_text", ""),
            drug_name=data.get("drug_name"),
            dosage=data.get("dosage"),
            strength=data.get("strength"),
            form=data.get("form"),
            frequency=data.get("frequency"),
            route=data.get("route"),
            duration=data.get("duration"),
            confidence=0.0,
            matched_formulary_id=None,
        )
    
    def _fallback_extraction(self, raw_text: str) -> List[ExtractedMedicine]:
        """Fallback when med7 model is not available."""
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        return [
            ExtractedMedicine(
                raw_text=line,
                drug_name=None,
                confidence=0.0,
            )
            for line in lines[:10]
        ]
