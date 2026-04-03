import io
from typing import Union


def preprocess_image(image_bytes: bytes) -> bytes:
    """
    Preprocess prescription image for OCR:
    - Deskew
    - Binarize
    - Enhance contrast
    """
    try:
        import cv2
        import numpy as np
        from PIL import Image
        
        # Load image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return image_bytes
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply adaptive thresholding for binarization
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(binary, None, 10, 7, 21)
        
        # Deskew
        deskewed = _deskew(denoised)
        
        # Encode back to bytes
        _, encoded = cv2.imencode(".png", deskewed)
        return encoded.tobytes()
        
    except ImportError:
        return image_bytes
    except Exception as e:
        print(f"Image preprocessing error: {e}")
        return image_bytes


def _deskew(image) -> "np.ndarray":
    """Deskew image using Hough line detection."""
    import cv2
    import numpy as np
    
    coords = np.column_stack(np.where(image > 0))
    if len(coords) < 5:
        return image
    
    angle = cv2.minAreaRect(coords)[-1]
    
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    
    if abs(angle) < 0.5:
        return image
    
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
    )
    
    return rotated
