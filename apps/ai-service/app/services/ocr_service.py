from typing import Tuple
from app.utils.image_processing import preprocess_image


class OCRService:
    """Google Cloud Vision OCR integration."""
    
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Google Cloud Vision client lazily."""
        try:
            from google.cloud import vision
            self.client = vision.ImageAnnotatorClient()
        except Exception as e:
            print(f"Warning: Could not initialize Vision client: {e}")
    
    async def extract_text(
        self, image_bytes: bytes, language_hints: list[str]
    ) -> Tuple[str, float]:
        """
        Run Google Cloud Vision OCR on preprocessed image.
        Returns (raw_text, average_confidence).
        """
        if not self.client:
            raise RuntimeError("Google Cloud Vision client not initialized")
        
        from google.cloud import vision
        
        processed = preprocess_image(image_bytes)
        image = vision.Image(content=processed)
        
        image_context = vision.ImageContext(language_hints=language_hints)
        
        response = self.client.document_text_detection(
            image=image, image_context=image_context
        )
        
        if response.error.message:
            raise Exception(f"OCR error: {response.error.message}")
        
        full_text = response.full_text_annotation.text
        
        confidences = []
        for page in response.full_text_annotation.pages:
            for block in page.blocks:
                for paragraph in block.paragraphs:
                    for word in paragraph.words:
                        confidences.append(word.confidence)
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return full_text, avg_confidence
