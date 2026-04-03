from typing import List
from app.models.prescription import ExtractedMedicine


class MatchingService:
    """Fuzzy medicine matching against NMRA formulary using rapidfuzz."""
    
    def __init__(self):
        self.formulary = []
        self._load_formulary()
    
    def _load_formulary(self):
        """Load medicine formulary from database."""
        # TODO: Load from PostgreSQL via DATABASE_URL
        # For now, use a stub list
        self.formulary = [
            {"id": "med001", "name": "paracetamol", "brand": "Panadol"},
            {"id": "med002", "name": "amoxicillin", "brand": "Amoxil"},
            {"id": "med003", "name": "metformin", "brand": "Glucophage"},
            {"id": "med004", "name": "omeprazole", "brand": "Prilosec"},
            {"id": "med005", "name": "atorvastatin", "brand": "Lipitor"},
        ]
    
    async def match_medicines(
        self, medicines: List[ExtractedMedicine]
    ) -> List[ExtractedMedicine]:
        """Match extracted medicines against formulary using fuzzy matching."""
        from rapidfuzz import fuzz, process
        
        for medicine in medicines:
            if not medicine.drug_name:
                continue
            
            formulary_names = [m["name"] for m in self.formulary]
            match = process.extractOne(
                medicine.drug_name.lower(),
                formulary_names,
                scorer=fuzz.WRatio,
                score_cutoff=70,
            )
            
            if match:
                matched_name, score, _ = match
                matched_entry = next(
                    (m for m in self.formulary if m["name"] == matched_name), None
                )
                if matched_entry:
                    medicine.matched_formulary_id = matched_entry["id"]
                    medicine.confidence = score / 100.0
        
        return medicines
