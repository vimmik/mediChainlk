# MediChainLK AI Service

FastAPI microservice for prescription OCR and NLP processing.

## Quick Start

### 1. Setup (first time only)

Run the setup script to create the directory structure and all source files:

```bash
cd apps/ai-service
python setup.py
```

This creates:
- `app/` - Application source code
- `tests/` - Test files
- `Dockerfile` - Container configuration

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Run Development Server

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Or using the module directly:
```bash
python -m app.main
```

### 5. Access API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check |
| `/health/ready` | GET | Readiness probe |
| `/health/live` | GET | Liveness probe |
| `/prescriptions/analyze` | POST | Analyze prescription image |

## Prescription Analysis Pipeline

```
Mobile Camera → S3 Upload
  → Pre-processing (OpenCV: deskew, binarize, enhance)
  → Google Cloud Vision API (OCR — supports EN/SI/TA)
  → Med7/spaCy NLP (extracts: drug, dosage, strength, form, frequency, route, duration)
  → PostgreSQL pg_trgm fuzzy match against NMRA formulary
  → Confidence Engine: HIGH (>0.90) auto-accept | MEDIUM (0.70–0.90) pharmacist review | LOW (<0.70) reject
```

## Confidence Tiers

| Tier | Confidence | Action |
|------|------------|--------|
| HIGH | ≥ 0.90 | Auto-accept (unless high-alert medicine) |
| MEDIUM | 0.70 - 0.90 | Pharmacist review required |
| LOW | < 0.70 | Reject / manual entry required |

## Docker

Build and run:
```bash
docker build -t medichainlk-ai-service .
docker run -p 8000:8000 --env-file .env medichainlk-ai-service
```

## Testing

```bash
pytest tests/ -v
```

## Project Structure

```
apps/ai-service/
├── app/
│   ├── __init__.py
│   ├── config.py           # Pydantic settings
│   ├── main.py              # FastAPI app
│   ├── models/
│   │   ├── __init__.py
│   │   ├── prescription.py  # Prescription models
│   │   └── response.py      # Response models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ocr_service.py       # Google Cloud Vision
│   │   ├── nlp_service.py       # spaCy med7
│   │   ├── matching_service.py  # Fuzzy matching
│   │   └── confidence_service.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py
│   │   └── prescription.py
│   └── utils/
│       ├── __init__.py
│       ├── image_processing.py  # OpenCV preprocessing
│       └── s3_client.py
├── tests/
│   ├── __init__.py
│   └── test_prescription.py
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

## External Dependencies

- **Google Cloud Vision API** - OCR for prescription images
- **AWS S3** - Prescription image storage
- **PostgreSQL** - NMRA formulary database

## Notes

- This service handles **AI inference only** - no business logic
- NestJS backend orchestrates the full prescription workflow
- High-alert medicines (insulin, warfarin, etc.) always require pharmacist review
