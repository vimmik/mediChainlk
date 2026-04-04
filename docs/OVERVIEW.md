# MediChainLK Platform Overview

AI-powered multi-tenant pharmacy management system built for Sri Lanka's healthcare ecosystem.

---

## What is MediChainLK?

A full-stack SaaS platform that bridges the gap between prescribers (doctors), dispensers (pharmacists), and patients. Core capability: **AI-assisted prescription digitization** using OCR + NLP to auto-extract medicines from handwritten/scanned prescriptions.

**Key differentiators:**
- Prescription OCR at 94%+ accuracy
- Real-time multi-tenant pharmacy network
- Built-in delivery integration (PickMe Flash, Grasshoppers)
- Payment gateway abstraction (PayHere, WEBXPAY)
- Role-based access (system admin, pharmacy staff, customer)

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│ Admin Portal (Next.js)   Pharmacy Portal (Next.js)          │
│ Customer App (React Native / Expo)    Demo App (Next.js)   │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP / Socket.IO
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (NestJS)                     │
├─────────────────────────────────────────────────────────────┤
│ Auth Module    Prescription Module    Inventory Module     │
│ Orders Module  Billing Module         Delivery Module      │
│ Payments Module    Notifications      User / Tenant Mgmt   │
└─────────────────────────────────────────────────────────────┘
            ↓                    ↓                    ↓
    [Firebase Admin]      [AI Service]         [AWS S3]
        (Auth)            (FastAPI)          (Prescriptions)
            ↓                    ↓                    ↓
     [PostgreSQL]         [Google Cloud      [S3 Buckets]
      (RDS)                  Vision]       + KMS Encryption
                           [Med7 / spaCy]
                           [rapidfuzz]
```

### Key Components

**Backend:** NestJS 11 modular monolith (port 3001)
- REST API with Swagger at `/api/docs`
- Socket.IO gateway for real-time notifications
- Prisma ORM with PostgreSQL
- Firebase Admin SDK for auth

**AI Service:** FastAPI (Python 3.12, port 8000)
- Google Cloud Vision API for OCR
- Med7 (spaCy) for NLP entity extraction
- rapidfuzz for formulary fuzzy-matching
- Confidence tier classification (HIGH / MEDIUM / LOW)

**Web Portals:** Next.js 15 (ports 3002–3003)
- Admin portal (system_admin role)
- Pharmacy portal (pharmacy_staff role)
- Shared shadcn/ui component library
- TanStack Query for data fetching

**Mobile:** React Native (Expo SDK 52, port 8081)
- Camera integration (expo-camera)
- Socket.IO for real-time order tracking
- Phone + email authentication

**Database:** PostgreSQL 16 (RDS)
- Multi-tenancy: every model has `tenantId`
- Prisma schema with 8 core entities (Tenant, User, Medicine, InventoryItem, Prescription, Order, Payment)

**Infrastructure:** AWS (ap-south-1 region)
- ECS Fargate for containerized services
- RDS for managed PostgreSQL
- ElastiCache for Redis session cache
- S3 with KMS + Object Lock for secure prescription storage
- CloudFront CDN
- IAM roles for service-to-service auth

---

## Data Flow: Prescription to Delivery

### 1. Customer Uploads Prescription (Mobile App)

```
Customer scans prescription or takes photo
         ↓
Expires token auth (SMS-based)
         ↓
POST /prescriptions/upload
  - Image → AWS S3 (KMS encrypted)
  - Create Prescription record with status PENDING_OCCLUSION
         ↓
Return presignedUrl + prescriptionId
```

### 2. AI Processes Prescription (Async)

```
NestJS triggers FastAPI job via POST /prescriptions/analyze
  Input: S3 URL, prescriptionId
         ↓
FastAPI pipeline:
  1. Download image from S3
  2. OpenCV preprocess (deskew, denoise, binarize)
  3. Google Cloud Vision OCR → extract raw text + bounding boxes
  4. Med7 NLP → identify drugs, dosages, frequencies, durations
  5. rapidfuzz match against pharmacy formulary (threshold 85%)
  6. Calculate confidence per field → aggregate confidence tier
         ↓
Return ExtractedMedicine[] + confidenceTier + confidence score
         ↓
NestJS updates Prescription record
  status = PENDING_REVIEW (if confidence < 90%)
       or CONFIRMED (if confidence ≥ 90% and no high-alert drugs)
       or AUTO_REJECTED (if confidence < 70%)
```

### 3. Pharmacist Reviews (Optional)

```
If PENDING_REVIEW:
  - Pharmacist sees prescription in review queue
  - Can approve, reject, or modify extracted medicines
  - Adds notes
  - Confirms stock availability
         ↓
Status → CONFIRMED or REJECTED
         ↓
If CONFIRMED:
  - Inventory deducted automatically
  - Order created
  - Notification sent to customer
```

### 4. Delivery Integration

```
Order ready for dispatch
         ↓
POST /delivery/quotes
  - Scatter-gather to all delivery adapters (PickMe, Grasshoppers)
  - 3-second timeout per adapter
  - Return sorted quotes (cheapest first)
         ↓
Customer selects delivery option
         ↓
POST /delivery/dispatch
  - Adapter reserves slot
  - Order status → OUT_FOR_DELIVERY
  - Real-time tracking URL sent to customer
  - Socket.IO updates live on phone
```

### 5. Payment Capture

```
"Auth & Capture" flow:
  1. authorizePayment() → PayHere holds funds (no money moves yet)
  2. Pharmacist confirms order
  3. capturePayment() → funds actually transferred
  OR
  If pharmacist rejects: void the authorization
```

---

## Modular Architecture (NestJS)

Each module is self-contained with its own:
- `module.ts` — module definition + imports
- `controller.ts` — HTTP endpoints
- `service.ts` — business logic
- `dto/` — request/response schemas (Zod)
- Entity model in Prisma schema

### Core Modules

| Module | Responsibility | Key Files |
|--------|----------------|-----------|
| **Auth** | Firebase token validation, RolesGuard, JwtStrategy | `guards/firebase-auth.guard.ts`, `guards/roles.guard.ts` |
| **Prescription** | OCR job orchestration, review queue, confidence tier logic | `prescription.service.ts`, `POST /prescriptions/upload`, `POST /prescriptions/analyze` |
| **Inventory** | Stock tracking, low-stock alerts, deduction on order confirm | `inventory.service.ts` |
| **Billing** | Invoice generation, order-to-bill, payment reconciliation | `billing.service.ts` |
| **Payment** | IPaymentAdapter abstraction (PayHere, WEBXPAY), auth & capture | `payment.service.ts`, `adapters/payhere.adapter.ts` |
| **Delivery** | IDeliveryAdapter scatter-gather (PickMe, Grasshoppers), quote ranking | `delivery.service.ts`, 3s timeout via `Promise.race` |
| **Notification** | FCM push notifications, Socket.IO real-time events | `notification.gateway.ts` |
| **Tenant** | Pharmacy creation, onboarding, SaaS accounting | `tenant.service.ts` (system_admin only) |
| **User** | User CRUD per tenant, role assignment | `user.service.ts` |

### Important Patterns

**Adapter Pattern:**
New payment provider? Implement `IPaymentAdapter` interface, register in `PaymentModule`. No service logic changes.

**Scatter-Gather:**
Delivery quotes are fetched in parallel with `Promise.race()` against 3-second timeout:
```typescript
const quotes = await Promise.all(
  adapters.map(adapter =>
    Promise.race([
      adapter.getQuote(pickup, dropoff),
      timeout(3000) // if adapter is slow, exclude it
    ])
  )
);
```

**Multi-Tenancy:**
- Every Prisma model has `tenantId` field
- `@CurrentTenant()` decorator extracts `tenantId` from Firebase Custom Claims
- Queries automatically scoped: `where: { tenantId: currentTenant }`
- Cross-tenant data leakage is impossible by design

**Confidence Tiers:**
- HIGH ≥ 0.90 — auto-approve
- MEDIUM 0.70–0.90 — pharmacist review required
- LOW < 0.70 — auto-reject
- High-alert medicines (insulin, warfarin) always route to pharmacist regardless of confidence

---

## FastAPI AI Service

Single responsibility: prescription processing. No business logic, no database writes (returns data to NestJS for persistence).

### Pipeline Stages

1. **S3 Download** — fetch encrypted image
2. **OpenCV Preprocessing** — deskew, denoise, contrast stretch
3. **Google Cloud Vision OCR** — extract text + confidence per word
4. **Med7 NLP** — identify DRUG, DOSAGE, FREQ, DURATION entities
5. **Formulary Matching** — rapidfuzz fuzzy-match against medication database (85% threshold)
6. **Confidence Aggregation** — per-field confidence, then per-prescription tier
7. **Result Serialization** — return ExtractedMedicine array

### API

**Single endpoint:**
```
POST /prescriptions/analyze
{
  "prescriptionId": "rx-001",
  "imageUrl": "s3://bucket/prescriptions/rx-001.jpg"
}

Response:
{
  "medicines": [
    {
      "drug": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "TDS",
      "duration": "7 days",
      "confidence": 0.94,
      "matched": true
    },
    ...
  ],
  "confidenceTier": "MEDIUM",
  "confidence": 0.82
}
```

---

## Multi-Tenancy Model

Each pharmacy is an isolated **tenant**. Perfect for SaaS scaling.

### Tenant Isolation

- **Data:** Every row in DB has `tenantId` column. Queries always include `WHERE tenantId = current_tenant`
- **Auth:** Firebase Custom Claims carry `{ tenantId, role, permissions }`
- **Files:** S3 paths namespaced: `s3://bucket/{tenantId}/prescriptions/{rxId}.jpg`
- **Scale:** Add new pharmacies without code changes; just create a Tenant record

### Example: Tenant-Scoped Inventory Query

```typescript
// In inventory.service.ts
async getInventory(tenantId: string) {
  return this.db.inventoryItem.findMany({
    where: { tenantId }, // automatic scoping
  });
}

// Call from controller
async getMyInventory(@CurrentTenant() tenantId: string) {
  return this.inventoryService.getInventory(tenantId);
}
```

**Result:** Pharmacy A's staff can NEVER see Pharmacy B's stock levels, no matter what HTTP params they send.

---

## Third-Party Integrations

### Delivery Providers

**PickMe Flash** (corporate account required)
- Live GPS tracking
- Fleet management
- Corporate API: `POST /api/v1/delivery/request`

**Grasshoppers**
- Same-day, next-day delivery
- Bulk order discounts
- Corporate ID required

**Adapter interface:**
```typescript
interface IDeliveryAdapter {
  getQuote(pickup, dropoff): Promise<DeliveryQuote>;
  dispatch(order, address): Promise<TrackingUrl>;
}
```

### Payment Providers

**PayHere** (primary)
- Sandbox: `sandbox.payhere.lk`
- Supports Visa, Mastercard, Dialog eZ
- Auth & Capture flow (funds held, then released)
- Webhook: `POST /payments/webhook/payhere`

**WEBXPAY** (backup)
- Card payments
- Lower fees
- Webhook: `POST /payments/webhook/webxpay`

### Firebase

**Phone Auth (customers)**
- SMS OTP to verify phone number
- ID token used for all API calls

**Email/Password (staff)**
- Email + password for pharmacy staff and admins
- MFA recommended for admins

**Custom Claims**
```json
{
  "tenantId": "ph-001",
  "role": "pharmacy_staff",
  "permissions": ["prescriptions.review", "inventory.adjust"],
  "iat": 1712282643,
  "exp": 1712282943
}
```

---

## Database Schema (Prisma)

### Core Entities

**Tenant** — Pharmacy
```
id, name, city, licenseNo, isActive, createdAt, updatedAt
```

**User** — Pharmacy staff / Customer
```
id, email, phone, role (enum), tenantId (FK), createdAt
```

**Medicine** — Formulary entry
```
id, name, strength, unit, category, tenantId (FK)
```

**InventoryItem** — Stock tracking
```
id, medicineId (FK), tenantId (FK), quantity, reorderLevel, expiryDate, price
```

**Prescription** — Patient order
```
id, patientId (FK), tenantId (FK),
imageUrl, status (enum), confidenceTier (enum), confidence (float),
extractedMedicines (JSON), pharmacistNotes, createdAt, reviewedAt
```

**Order** — Confirmed prescription order
```
id, prescriptionId (FK), tenantId (FK),
items (OrderItem[]), status (enum), total (decimal),
deliveryProvider, trackingUrl, createdAt, deliveredAt
```

**OrderItem** — Line item in order
```
id, orderId (FK), medicineId (FK), quantity, unitPrice
```

**Payment** — Invoice & payment tracking
```
id, orderId (FK), tenantId (FK),
amount (decimal), status (enum: PENDING, AUTHORIZED, CAPTURED, FAILED),
provider (enum), externalId (from PayHere / WEBXPAY),
createdAt, capturedAt
```

**Notification** — User notification queue
```
id, userId (FK), title, body, deeplink, read, createdAt
```

---

## Environment Setup

Copy `.env.example` → `.env` in each app:

```bash
# apps/api/.env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
FIREBASE_ADMIN_KEY="{...json...}"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_BUCKET_NAME="medichainlk-prescriptions"
AI_SERVICE_URL="http://localhost:8000"

# apps/ai-service/.env
GOOGLE_APPLICATION_CREDENTIALS="/path/to/google-cloud-key.json"
AWS_S3_BUCKET="medichainlk-prescriptions"

# apps/admin-portal/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_FIREBASE_CONFIG="{...json...}"

# apps/pharmacy-portal/.env.local
(same as admin-portal)

# apps/customer-app/.env
EXPO_PUBLIC_API_URL="http://localhost:3001"
```

---

## Deployment Architecture (AWS)

```
Internet → CloudFront (CDN)
            ↓
       Application Load Balancer
            ↓
        ECS Fargate Cluster
         /     |      \
   NestJS   FastAPI  Next.js
    (3001)   (8000)   (3002-3)
         |      |        |
    RDS PG  Google Cloud   S3
            Vision API    (KMS)
         |
    ElastiCache Redis
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Terraform code.

---

## Testing

```bash
# Unit tests
npm run test --workspace=apps/api         # NestJS
cd apps/ai-service && pytest tests/ -v    # FastAPI

# E2E tests
npm run test:e2e --workspace=apps/api

# Integration tests (requires running API + DB)
npm run test:integration
```

---

## Roadmap & Known Limitations

### Current State
✅ Prescription OCR + NLP  
✅ Multi-tenant pharmacy network  
✅ Delivery & payment abstraction  
✅ Admin & pharmacy staff portals  
✅ Customer React Native app (Expo)  
✅ Real-time Socket.IO notifications  

### Next Phase
🔄 Offline mode for pharmacy staff  
🔄 Prescription refill automation  
🔄 Insurance integration (SriLankan insurance APIs)  
🔄 Doctor portal (upload Rx directly, not scanned)  

### Known Limitations
- No audit logging yet (required for healthcare compliance)
- Payment reconciliation is manual (not automated)
- AI confidence calibration is preliminary (needs more training data)
- Delivery tracking is simulated (adapters are stubs)

---

## Support

- **Bug reports:** GitHub Issues
- **Feature requests:** GitHub Discussions
- **Security concerns:** kavishkadinajara@gmail.com
