# Pharmacy Management Platform: Technical System Design Report

**A next-generation, AI-powered pharmacy platform for Sri Lanka with expansion potential to India and Bangladesh. This report covers AI prescription reading, delivery integration, payment gateways, full tech stack recommendations, system architecture, and a phased implementation plan.**

The platform serves three user tiers — a System Admin Panel (web), a Pharmacy Portal (web), and a Customer Portal (Android + iOS). Its core innovation is an AI-driven prescription workflow: customers photograph prescriptions, AI extracts medicine details, pharmacists confirm, and the system handles billing, payment, and delivery through integrated third-party services. The delivery module aggregates real-time quotes from multiple Sri Lankan courier and ride-hailing services, giving customers choice and transparency. This report synthesizes research across every technical layer to provide an actionable blueprint for building this system.

---

## 1. AI prescription reading: OCR, NLP, and multilingual support

### 1.1 Cloud OCR API comparison

The prescription reading pipeline must handle printed text, semi-legible handwriting, and mixed English/Sinhala/Tamil content. Three major cloud APIs were evaluated:

**Google Cloud Vision API** emerges as the strongest option for Sri Lanka. It supports both Sinhala (`si`) and Tamil (`ta`) at GA level, handles handwriting via `DOCUMENT_TEXT_DETECTION` without special flags, and a 2025 zero-shot benchmark (arXiv:2507.18264) confirmed near-identical accuracy to Google Document AI for both scripts. Pricing is **$1.50 per 1,000 pages** with a permanent free tier of 1,000 units/month — highly economical for a startup.

**AWS Textract** excels in structured document extraction (forms, tables, key-value pairs) and is HIPAA-eligible. NHS BSA processes **54 million paper prescriptions monthly** using Textract. However, it **does not officially support Sinhala or Tamil**, making it unsuitable as the primary OCR for this platform. Its Queries feature and Amazon A2I (human-in-the-loop) integration remain valuable for English-only prescription processing at scale.

**Azure AI Document Intelligence** (v4.0 GA, Nov 2024) offers custom neural models trainable with as few as 5–10 documents and pairs well with Azure Text Analytics for Health. Sinhala support is minimal, and Tamil support is limited to experimental Indic language models — not production-ready for Sri Lanka.

| API | Sinhala Support | Tamil Support | Handwriting | Pricing (per 1K pages) | Medical Features |
|-----|----------------|---------------|-------------|----------------------|-----------------|
| **Google Cloud Vision** | ✅ Full | ✅ Full | ✅ Good | $1.50 | Downstream NLP needed |
| AWS Textract | ❌ No | ❌ No | ✅ Good (English) | $1.50–$15.00 | Comprehend Medical integration |
| Azure Document Intelligence | ❌ Minimal | ⚠️ Limited | ✅ Good | $1.50–$40.00 | Text Analytics for Health |

### 1.2 Medical NLP for medicine name extraction

Once OCR produces raw text, a medical NLP layer extracts structured entities — drug names, dosages, frequencies, and routes. **In practice, most Sri Lankan prescriptions use English for medicine names**, even when patient details appear in Sinhala or Tamil. This means the NLP pipeline can be English-focused.

**Med7** (spaCy model `en_core_med7_lg`) is purpose-built for prescription parsing. It extracts seven entity types — drug name, dosage, strength, form, frequency, route, and duration — with **~85–89% micro F1**. It runs on CPU, requires no GPU, and costs nothing beyond hosting. For a startup, Med7 is the optimal starting point.

**Amazon Comprehend Medical** offers HIPAA-eligible extraction with RxNorm ontology linking — mapping "Amoxicillin 500mg TDS" to standardized drug codes. At **$0.01 per 100 characters** (~$0.05/prescription), it becomes expensive at scale. Reserve this for production environments requiring regulatory-grade ontology mapping.

**Vision-Language Models** (Gemini Pro Vision, GPT-4V) represent an emerging single-step approach: send the prescription image with a structured prompt and receive JSON output with medicine names, dosages, and frequencies. Cost is approximately **$0.01 per prescription image**. The caveat is that LLMs can hallucinate — mandatory pharmacist verification and medicine database cross-referencing are essential safeguards.

For medicine matching against a local formulary, build a searchable database from the Sri Lanka NMRA registered drug list. Use **fuzzy matching** (Levenshtein/Jaro-Winkler via `rapidfuzz`) to handle OCR errors, combined with trigram similarity indexing in PostgreSQL (`pg_trgm`).

### 1.3 Sinhala and Tamil prescription handling

A 2025 zero-shot OCR benchmark provides the definitive comparison for Sri Lankan scripts:

| Engine | Sinhala WER | Tamil CER | Open Source |
|--------|------------|-----------|-------------|
| **Surya OCR** | **2.61%** (best) | Good | ✅ Yes |
| Google Cloud Vision | Good | Good | ❌ Commercial |
| Google Document AI | Good | **0.78%** (best) | ❌ Commercial |
| Tesseract 5 | Higher error | Higher error | ✅ Yes |
| EasyOCR | ❌ Not supported | Supported | ✅ Yes |

**Surya OCR** is the best open-source engine for Sinhala. Google Cloud Vision offers the best commercial option supporting both languages. A key challenge is **Sinhala Unicode ordering** — Tesseract outputs characters in Unicode order, which differs from visual glyph order. University of Colombo researchers developed normalization that improved word accuracy from **53% to 73%** for Sinhala Tesseract.

The practical recommendation: use **Google Cloud Vision** with language hints for mixed English/Sinhala/Tamil prescriptions. For difficult handwritten Sinhala, fall back to **Gemini Pro Vision** with a multilingual extraction prompt. Since medicine names are in English, the NLP extraction pipeline remains English-focused regardless.

### 1.4 Confidence scoring and human-in-the-loop design

Implement a three-tier confidence system using per-word scores from the OCR API:

- **HIGH (>0.90)**: Auto-accept, proceed to medicine database matching
- **MEDIUM (0.70–0.90)**: Present to pharmacist with highlighted uncertain fields
- **LOW (<0.70)**: Reject OCR output, request re-scan or manual entry

Research from a 2024 clinical study (PMC10775023) found pharmacists prefer a **hybrid model** with stepwise checkmarks comparing extracted data against expected values. Uncertainty-aware AI (showing probability scores alongside predictions) resulted in faster and safer pharmacist decisions compared to black-box AI. Implement **tiered review**: auto-approve low-risk items with high confidence; require pharmacist review for high-risk medications (insulin, warfarin, chemotherapy drugs) regardless of confidence.

### 1.5 Recommended AI pipeline architecture

```
[Mobile Camera] → Image Upload (S3)
    → [Pre-processing] (deskew, binarize, enhance — OpenCV)
    → [OCR Service] (Google Cloud Vision API — supports EN/SI/TA)
    → [NLP Extraction] (Med7 / spaCy — drug, dosage, frequency)
    → [Medicine Matching] (PostgreSQL + pg_trgm fuzzy search against NMRA formulary)
    → [Confidence Engine] (threshold rules + dosage range validation)
    → [Pharmacist Review Queue] (if confidence < threshold)
    → [Confirmed Prescription] → Billing
```

**Estimated cost at 5,000 prescriptions/month**: ~$240/month (self-hosted Med7) or ~$440/month (with Amazon Comprehend Medical). At 50,000 prescriptions/month, self-hosted Med7 stays under **$500/month** — far cheaper than cloud NLP services.

---

## 2. Delivery integration: Sri Lanka's evolving logistics ecosystem

### 2.1 PickMe Flash is the primary delivery partner

**PickMe** is Sri Lanka's dominant ride-hailing platform and offers the **PickMe Flash Delivery API** via corporate merchant accounts. Access is not self-serve — it requires establishing a business relationship through PickMe's corporate hotline (1331) or engineering@pickme.lk.

Confirmed API capabilities include **auto-dispatch** (system requests a rider when an order is ready), **real-time fee calculation** at checkout, **live status tracking** (Assigned → Picked Up → Delivered), and **vehicle selection** (Bikes for small orders, Tuks, Cars). Integration has been confirmed by web-dev.lk, a Sri Lankan development agency that has completed PickMe Flash integrations for WooCommerce, Shopify, and custom platforms. PickMe's infrastructure runs on **100+ Go microservices on GCP/Azure with Kafka and Kubernetes** — a mature engineering stack that suggests reliable API availability.

PickMe was publicly listed on the Colombo Stock Exchange in September 2024, signaling business stability and growth trajectory.

### 2.2 Grasshoppers provides islandwide coverage

**Grasshoppers** (a Kapruka venture) offers e-commerce delivery fulfillment across all of Sri Lanka with confirmed API integration capabilities. Integration uses a **Corporate ID** assigned upon registration, with a dedicated delivery price request endpoint. Features include automated delivery assignment, tracking, and COD support with cash settlement every 15 days. A WooCommerce plugin exists on GitHub, confirming the API's existence and usability.

Grasshoppers complements PickMe perfectly: PickMe handles urgent, on-demand delivery in Colombo metro, while Grasshoppers provides **islandwide scheduled delivery including rural areas** — critical for a pharmacy platform serving the entire country.

### 2.3 HelaGo and Uber Direct are not viable for Phase 1

**HelaGo** launched only on January 6, 2026, covers only the Western Province, operates primarily as a ride-hailing service (not dedicated delivery), and has no developer API. It uses a unique bidding model where drivers set their own fares. Built by Bhasha Lanka (the same company behind Helakuru and PayHere), it may eventually add delivery APIs, but is too early-stage for integration now.

**Uber Direct** is available in approximately 24 countries, and **Sri Lanka is not among them**. While the Uber Direct API documentation is excellent (RESTful, OAuth 2.0, webhook-based tracking, sandbox environment), the service cannot be activated for Sri Lankan addresses. Keep the adapter architecture ready for potential future expansion.

### 2.4 Delivery service comparison

| Service | API Available | On-Demand | Islandwide | COD | Real-Time Tracking | Best For |
|---------|:---:|:---:|:---:|:---:|:---:|------|
| **PickMe Flash** | ✅ Corp. Account | ✅ | ⚠️ Major cities | ✅ | ✅ | Urgent urban pharmacy delivery |
| **Grasshoppers** | ✅ Partnership | ❌ | ✅ | ✅ | ✅ | Scheduled islandwide fulfillment |
| **Pronto Lanka** | ⚠️ Upon request | ❌ | ✅ | ✅ | ✅ | Documents, scheduled delivery |
| **HelaGo** | ❌ | ❌ | ❌ | N/A | N/A | Not ready |
| **Uber Direct** | ✅ (not in SL) | ✅ | ❌ | ❌ | ✅ | Future international expansion |
| **Aramex** | ✅ Full REST | ❌ | Via partners | ✅ | ✅ | International pharma shipments |
| **Domex** | ❌ | ⚠️ Colombo | ✅ | ✅ | ⚠️ Limited | Backup traditional courier |

### 2.5 Delivery aggregator architecture

The delivery module should use the **Adapter Pattern + Scatter-Gather Pattern**. Each delivery provider gets a dedicated adapter that translates between a Canonical Data Model (CDM) and provider-specific formats.

```
[Pharmacy Platform] → [Delivery Aggregator Service]
                           ├── [PickMe Adapter] → PickMe Flash API
                           ├── [Grasshoppers Adapter] → Grasshoppers API
                           ├── [Own Fleet Adapter] → Internal Fleet Management (Phase 2)
                           └── [Manual Adapter] → WhatsApp/SMS dispatch (fallback)
```

The **quote aggregation flow** sends parallel requests to all available providers for a given pickup/dropoff pair, collects fee quotes with a 3-second timeout, caches results with a 5-minute TTL, and returns sorted options (cheapest, fastest). The customer selects their preferred option, and the system dispatches through the chosen provider's adapter.

**Fallback strategies** when APIs are unavailable include cached rate tables (refreshed daily), distance-based formula estimation (base fee + per-km rate), circuit breaker pattern to auto-disable failing providers, and WhatsApp Business API dispatch for manual coordination. Multiple Sri Lankan WhatsApp Business API providers (Go4whatsup, Bloomwire, CloudCoder) support automated messaging.

Real-time tracking is normalized across providers to a unified status flow: `PENDING → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED → FAILED`. Each adapter maps provider-specific statuses to this canonical flow and pushes updates via WebSocket to the customer app.

---

## 3. Payment integration: PayHere leads a maturing ecosystem

### 3.1 Gateway comparison

| Feature | PayHere | WEBXPAY | DirectPay | Genie (Dialog) |
|---------|---------|---------|-----------|----------------|
| **Transaction Fee** | 2.69–3.90% | 2.5–2.8% | 2.6–2.9% | 1–1.5% |
| **Monthly Fee** | FREE–LKR 9,990 | LKR 1,000/yr–8,990/mo | LKR 3,000–8,000/mo | Pay-as-you-go |
| **Payment Methods** | 10+ (cards, eZ Cash, mCash, Genie, FriMi, HelaPay) | 12+ (incl. Alipay, WeChat, UPI) | Cards, JustPay, LankaQR | Cards, eZ Cash, Genie Wallet, LankaQR |
| **Mobile SDK** | ✅ Android, iOS, React Native, Flutter | ✅ Available | ✅ Available | ⚠️ Android only |
| **Refunds (API)** | ✅ Full + Partial | ✅ Dashboard | ✅ Supported | ✅ Supported |
| **Recurring Billing** | ✅ Full API + Subscription Manager | ✅ Supported | ✅ Tokenization | ✅ Tokenization |
| **Settlement** | 3–5 business days | **T+1 (next day)** | T+3 | Real-time |
| **API Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Stripe is not directly available in Sri Lanka.** Using it through a US LLC adds unnecessary legal complexity for a local pharmacy platform.

### 3.2 PayHere is the recommended primary gateway

**PayHere** is the clear winner for this platform. It offers the **widest payment method coverage** (10+ methods including all major mobile wallets), the most **comprehensive SDK ecosystem** (official, maintained SDKs for Android, iOS, React Native, and Flutter), and the richest API surface — including Checkout, Recurring, Refund, Auth & Capture, and Subscription Manager endpoints.

Critical features for the pharmacy use case include **Auth & Capture** (hold payment amount during prescription verification, capture only after pharmacist confirmation), **partial refunds via API** (essential for order corrections and returns), and **tokenization** for returning customers who refill prescriptions regularly. The sandbox environment at sandbox.payhere.lk enables thorough testing before going live.

Start with the **Plus plan at LKR 2,990/month (~$9) with 2.99% per transaction**, upgrading to Premium (2.69%) as volume grows. The free Lite tier works for initial testing but caps at LKR 200,000/month.

**WEBXPAY** is the recommended backup gateway, offering **T+1 next-day settlement** (significantly faster than PayHere's 3–5 days), ISO 27001 + PCI DSS compliance, and cross-border payment support via LankaQR/UPI/Alipay+. Its HNB bank partnership (versus PayHere's Sampath Bank) provides redundancy.

### 3.3 Split payments require application-level handling

**No Sri Lankan payment gateway natively supports split payments.** The pharmacy + delivery fee split must be managed at the application level: collect the full amount through PayHere, track the delivery fee in the application database, and settle with delivery partners via separate bank transfers or internal ledger. PayHere's Auth & Capture feature may enable two-step capture (pharmacy amount first, delivery amount second) — this needs testing.

### 3.4 Regional expansion payment strategy

Build a **payment abstraction layer** from day one. The adapter pattern for delivery providers applies equally to payments:

- **Sri Lanka**: PayHere (primary) + WEBXPAY (backup)
- **India expansion**: Razorpay (India's leading gateway, comprehensive APIs, Flutter/React Native SDKs)
- **Bangladesh expansion**: bKash (dominant mobile wallet with merchant APIs)

LankaQR ↔ UPI interoperability is already live via LankaPay partnership with India's NPCI, providing a cross-border payment bridge.

---

## 4. Tech stack: a unified TypeScript ecosystem

### 4.1 Frontend web portals

**Next.js 16 (App Router) + shadcn/ui + Tailwind CSS v4 + TypeScript** is the recommended stack. Next.js provides SSR/SSG for fast-loading pharmacy dashboards, React 19 Server Components reduce client-side JavaScript, and middleware handles authentication routing. The shadcn/ui component library (built on Radix UI primitives) provides accessible, customizable components that are copied directly into the project — **full code ownership with zero dependency lock-in**, critical for customizing inventory tables, procurement forms, and payroll interfaces.

Supporting libraries include **TanStack Table v8** for complex data tables (inventory lists, order management), **TanStack Query** for server state management with caching and background sync, **Recharts** for analytics dashboards, and **Zustand** for minimal client state.

### 4.2 Mobile customer app

**React Native (New Architecture)** is recommended over Flutter for this specific platform. The deciding factors are:

- **PayHere SDK availability**: PayHere provides first-class React Native and Flutter SDKs, but the React Native JavaScript ecosystem has broader coverage for Sri Lankan payment and delivery integrations
- **Code sharing**: TypeScript business logic, API clients, validation schemas, and type definitions can be shared between Next.js web and React Native mobile — a massive efficiency gain for a small team
- **Developer availability**: Sri Lanka has a significantly larger JavaScript/TypeScript developer pool than Dart developers, reducing hiring difficulty and cost
- **Low-end device performance**: React Native's Hermes engine produces smaller APK sizes (~20MB base vs ~30MB Flutter), important for storage-constrained Android devices common in South Asia

React Native's New Architecture (Fabric renderer, JSI bridge, TurboModules) has closed the historical performance gap with Flutter. For the camera (prescription capture), `expo-camera` provides excellent native integration. For maps (delivery tracking), `react-native-maps` is the gold standard.

### 4.3 Backend: modular monolith on NestJS

**NestJS (Node.js + TypeScript) as a modular monolith** is the recommended backend architecture. The consensus from 2025-2026 engineering literature is clear: **below 10 developers, monoliths consistently outperform microservices** in development velocity. Shopify, GitHub, and Basecamp all scaled with monolithic foundations.

Structure the single NestJS application into well-defined modules with clear boundaries:

- `prescription` — AI pipeline orchestration, pharmacist review queue
- `inventory` — stock management, alerts, procurement
- `billing` — invoice generation, pricing engine
- `payment` — PayHere/WEBXPAY adapter layer
- `delivery` — aggregator service, provider adapters, tracking
- `auth` — Firebase Auth integration, RBAC middleware
- `notifications` — FCM push, SMS, in-app
- `payroll` — staff management, salary processing

NestJS wins over FastAPI (Python) and Spring Boot (Java) because of the **unified TypeScript stack** — one language across web, mobile, and backend enables a single development team working across all layers. NestJS provides built-in WebSocket gateway support (Socket.IO), modular dependency injection matching the monolith pattern, and auto-generated OpenAPI/Swagger documentation.

The AI/ML layer runs as a **separate FastAPI (Python) microservice** called via REST from NestJS. This is the standard hybrid pattern: TypeScript for the application layer, Python for ML inference. Model artifacts live in S3, inference runs on ECS Fargate containers.

**Evolution path**: Extract high-traffic modules (delivery tracking, notifications) as independent microservices when specific bottlenecks emerge. Move to full microservices only when the team exceeds 10 developers and regional expansion demands it.

### 4.4 Database design

**PostgreSQL (AWS RDS)** serves as the primary relational database, with **Redis (ElastiCache)** for caching, sessions, and real-time data.

Multi-tenancy uses a **shared schema with `tenant_id`** on every table, enforced by PostgreSQL Row-Level Security (RLS). Strong consensus from Crunchy Data, Neon, and Citus validates this approach: "For the vast majority of modern SaaS applications, the shared-schema model using a tenant_id column is the way to go." For a pharmacy platform with hundreds (not millions) of tenants, this is optimal — single schema to maintain, one database to back up, easy tenant onboarding.

PostgreSQL's JSONB columns handle flexible data (prescription OCR output, provider-specific delivery metadata) without needing MongoDB. The `pg_trgm` extension enables fuzzy medicine name matching. The `pgvector` extension is available for future AI/RAG features.

Redis handles session management, JWT blacklists, rate limiting, delivery location caching (driver positions updated every few seconds), and inventory count caching.

### 4.5 Real-time, notifications, and file storage

**Socket.IO via NestJS gateway** handles all real-time features — delivery driver location broadcasts, order status updates, inventory alerts. NestJS has first-class Socket.IO support requiring zero additional infrastructure. Socket.IO's automatic fallback to long-polling is critical for unreliable network conditions in Sri Lanka. Scale horizontally with the Redis adapter (`@socket.io/redis-adapter`).

**Firebase Cloud Messaging (FCM)** handles push notifications across Android and iOS from a single API. It's free for unlimited notifications, and `@react-native-firebase/messaging` is the most mature React Native integration available.

**AWS S3 (Mumbai region)** stores prescription images with server-side encryption (SSE-KMS), Object Lock for immutable medical records, and versioning for audit trails. CloudFront CDN distributes static assets from Mumbai/Singapore edge locations. An image optimization pipeline (S3 upload → Lambda trigger → Sharp resize/compress → store optimized version → forward to OCR) keeps storage costs low and OCR performance high.

### 4.6 Authentication for three user roles

**Firebase Authentication** is recommended for Phase 1. Its phone/SMS authentication is best-in-class — critical for Sri Lanka where phone-based identity dominates over email. It's free up to 50,000 MAU and supports Google, Facebook, and Apple social login.

Implement RBAC using **Firebase Custom Claims** embedded in JWT tokens:

```json
{
  "tenantId": "pharmacy_123",
  "role": "pharmacy_staff",
  "permissions": ["view_inventory", "confirm_prescription", "manage_orders"]
}
```

The NestJS backend validates these claims on every request and enforces tenant isolation via PostgreSQL RLS policies that filter by `tenant_id`.

Migrate to **Keycloak** (self-hosted, open-source) when regulatory compliance demands full control over authentication infrastructure, or when costs at scale make Firebase's per-SMS pricing prohibitive.

### 4.7 Cloud hosting optimized for Sri Lanka

**AWS Mumbai (ap-south-1)** provides the lowest latency from Colombo at approximately **25–40ms** — well within acceptable thresholds for real-time features. GCP Mumbai (asia-south1) offers comparable latency but AWS has the richest service catalog for this stack (RDS, ElastiCache, ECS, S3, CloudFront, SES, SQS).

Local Sri Lankan hosting providers (SriLankaHosting.lk, Register.lk) primarily offer shared hosting with US-based servers and lack managed databases, container orchestration, and production-grade infrastructure. Use them only for `.lk` domain registration.

The Mumbai region naturally serves India and Bangladesh expansion, with Singapore (ap-southeast-1) as a backup for geo-redundancy.

**Startup-phase AWS costs**:

| Service | Monthly Cost |
|---------|-------------|
| ECS Fargate (3 tasks, 0.5 vCPU, 1GB each) | ~$50 |
| RDS PostgreSQL (db.t3.medium) | ~$65 |
| ElastiCache Redis (cache.t3.micro) | ~$15 |
| S3 + CloudFront | ~$15 |
| Misc (Route53, SES, CloudWatch) | ~$20 |
| Google Cloud Vision API | ~$5 |
| Firebase Auth + FCM | $0 |
| **Total** | **~$200–250/month** |

### 4.8 DevOps and CI/CD

**GitHub Actions** provides CI/CD with 2,000 free minutes/month for private repos. The pipeline: push to `main` → build Docker image → push to AWS ECR → deploy to ECS Fargate. Preview deployments for pull requests enable safe testing.

**AWS ECS Fargate** (not Kubernetes) is the correct choice for a startup. EKS costs $72/month just for the control plane before any workloads. Fargate provides serverless containers with zero cluster management and built-in auto-scaling. Migrate to EKS only when you exceed 20+ services.

**Terraform** manages infrastructure as code with multi-cloud support for future expansion. **Sentry** (free tier: 5,000 events/month) provides error tracking across React Native and NestJS. CloudWatch handles logs and metrics initially.

---

## 5. High-level system architecture

The following describes the complete system architecture suitable for rendering as a Mermaid diagram:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                   │
│                                                                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────┐    │
│  │ System Admin  │  │ Pharmacy Portal  │  │  Customer Mobile App   │    │
│  │  (Next.js)   │  │    (Next.js)     │  │   (React Native)       │    │
│  └──────┬───────┘  └────────┬─────────┘  └───────────┬────────────┘    │
│         │                   │                         │                  │
│         │           HTTPS/WSS (REST + Socket.IO)      │                  │
└─────────┼───────────────────┼─────────────────────────┼──────────────────┘
          │                   │                         │
          ▼                   ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       AWS CLOUD (Mumbai ap-south-1)                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    CloudFront CDN                                │    │
│  │              (Static assets, image delivery)                     │    │
│  └─────────────────────────┬───────────────────────────────────────┘    │
│                             │                                           │
│  ┌─────────────────────────▼───────────────────────────────────────┐    │
│  │                   APPLICATION LAYER (ECS Fargate)                │    │
│  │                                                                  │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │              NestJS Modular Monolith                      │   │    │
│  │  │                                                           │   │    │
│  │  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │   │    │
│  │  │  │ Prescription│  │   Inventory   │  │   Billing    │    │   │    │
│  │  │  │   Module    │  │    Module     │  │   Module     │    │   │    │
│  │  │  └─────────────┘  └──────────────┘  └──────────────┘    │   │    │
│  │  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │   │    │
│  │  │  │  Delivery   │  │   Payment    │  │    Auth      │    │   │    │
│  │  │  │  Aggregator │  │   Adapter    │  │   Module     │    │   │    │
│  │  │  └──────┬──────┘  └──────┬───────┘  └──────────────┘    │   │    │
│  │  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │   │    │
│  │  │  │Notification │  │  Procurement │  │   Payroll    │    │   │    │
│  │  │  │   Module    │  │    Module    │  │   Module     │    │   │    │
│  │  │  └─────────────┘  └──────────────┘  └──────────────┘    │   │    │
│  │  │                                                           │   │    │
│  │  │  ┌──────────────────────────────────┐                    │   │    │
│  │  │  │ Socket.IO Gateway (Real-Time)     │                    │   │    │
│  │  │  │ • Delivery tracking broadcasts    │                    │   │    │
│  │  │  │ • Order status updates            │                    │   │    │
│  │  │  │ • Inventory alerts                │                    │   │    │
│  │  │  └──────────────────────────────────┘                    │   │    │
│  │  └───────────────────────────────────────────────────────────┘   │    │
│  │                                                                  │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │          AI/ML Service (FastAPI Python)                   │   │    │
│  │  │  • Image preprocessing (OpenCV)                           │   │    │
│  │  │  • Google Cloud Vision API (OCR)                          │   │    │
│  │  │  • Med7 / spaCy (NLP extraction)                          │   │    │
│  │  │  • Medicine fuzzy matching                                │   │    │
│  │  │  • Confidence scoring engine                              │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        DATA LAYER                                  │  │
│  │                                                                    │  │
│  │  ┌──────────────────┐  ┌──────────────┐  ┌────────────────────┐  │  │
│  │  │  PostgreSQL RDS  │  │ Redis Cache  │  │   S3 Storage       │  │  │
│  │  │  (Multi-tenant   │  │ (Sessions,   │  │   (Prescriptions,  │  │  │
│  │  │   with RLS)      │  │  Tracking,   │  │    Images, ML      │  │  │
│  │  │                  │  │  Rate Limit) │  │    Artifacts)      │  │  │
│  │  └──────────────────┘  └──────────────┘  └────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    EXTERNAL INTEGRATIONS                           │  │
│  │                                                                    │  │
│  │  ┌───────────┐ ┌──────────────┐ ┌──────────┐ ┌────────────────┐  │  │
│  │  │  PickMe   │ │ Grasshoppers │ │ PayHere  │ │ Firebase       │  │  │
│  │  │  Flash    │ │   Delivery   │ │ Payment  │ │ (Auth + FCM)   │  │  │
│  │  │  API      │ │     API      │ │ Gateway  │ │                │  │  │
│  │  └───────────┘ └──────────────┘ └──────────┘ └────────────────┘  │  │
│  │  ┌───────────┐ ┌──────────────┐ ┌──────────┐                    │  │
│  │  │  WEBXPAY  │ │ Google Cloud │ │ WhatsApp │                    │  │
│  │  │  (Backup) │ │ Vision API   │ │ Business │                    │  │
│  │  │           │ │   (OCR)      │ │  (Fallbk)│                    │  │
│  │  └───────────┘ └──────────────┘ └──────────┘                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key data flows

**Prescription submission flow**: Customer captures photo → React Native uploads to S3 → NestJS Prescription Module triggers AI/ML Service → FastAPI preprocesses image → Google Cloud Vision OCR → Med7 extracts medicines → fuzzy match against PostgreSQL formulary → confidence scoring → if HIGH: auto-populate bill; if MEDIUM/LOW: route to Pharmacy Portal review queue → Pharmacist confirms/corrects → NestJS Billing Module generates invoice → push notification to customer.

**Delivery flow**: Customer selects delivery address → NestJS Delivery Aggregator sends parallel requests to PickMe + Grasshoppers adapters → collect quotes (3s timeout) → return sorted options to customer → customer selects provider → aggregator dispatches via selected adapter → Socket.IO broadcasts tracking updates → delivery status webhooks update order state → push notification on delivery.

**Payment flow**: Customer reviews bill (medicine + delivery fee) → initiates PayHere checkout via React Native SDK → PayHere processes payment → webhook callback to NestJS Payment Adapter → payment confirmed → trigger delivery dispatch → update order status → push confirmation to customer and pharmacy.

---

## 6. Phased implementation plan

### Phase 1: Core platform (months 1–6)

**Months 1–2: Foundation**
- Set up AWS infrastructure (ECS Fargate, RDS PostgreSQL, S3, Redis) via Terraform
- Implement NestJS modular monolith with Auth, Prescription, and Billing modules
- Build Firebase Auth integration with phone verification and RBAC Custom Claims
- Develop PostgreSQL schema with multi-tenant RLS
- Set up CI/CD pipeline (GitHub Actions → ECR → ECS)

**Months 2–3: AI Pipeline + Pharmacy Portal**
- Deploy FastAPI AI/ML service with Google Cloud Vision OCR + Med7 NLP
- Build prescription upload flow (mobile → S3 → OCR → NLP → matching)
- Build Sri Lanka medicine formulary database from NMRA registered drug list
- Develop Pharmacy Portal (Next.js): prescription review queue, pharmacist confirm/correct workflow, basic inventory management
- Implement confidence scoring with three-tier thresholds

**Months 3–4: Payment + Customer App**
- Integrate PayHere (primary) with Auth & Capture flow
- Build React Native customer app: registration, prescription capture (camera), order tracking, payment checkout
- Implement Socket.IO for real-time order status updates
- Set up FCM push notifications for order lifecycle events
- Build billing engine (medicine cost + delivery fee calculation)

**Months 5–6: Delivery + Admin Panel**
- Integrate PickMe Flash API (corporate merchant account) for on-demand delivery
- Integrate Grasshoppers API for islandwide scheduled delivery
- Build delivery aggregator with adapter pattern and scatter-gather quoting
- Develop System Admin Panel (Next.js): tenant management, user management, system monitoring
- WhatsApp Business fallback for delivery dispatch in uncovered areas
- End-to-end testing, soft launch with 3–5 partner pharmacies in Colombo

**Phase 1 deliverables**: Working platform with AI prescription reading (100% pharmacist review), PayHere payments, PickMe + Grasshoppers delivery, basic inventory management, functional across all three portals.

### Phase 2: Optimization and expansion (months 7–18)

**Months 7–9: AI improvement + Pharmacy operations**
- Fine-tune OCR model on collected Sri Lankan prescription images (TrOCR architecture)
- Reduce pharmacist review rate from 100% to ~30–50% based on confidence scoring
- Add Gemini Pro Vision as alternative OCR for difficult handwriting
- Build complete inventory management (stock levels, reorder alerts, supplier management)
- Build procurement management module
- Build payroll management module

**Months 10–12: Own delivery + advanced features**
- Develop own delivery fleet management (rider app, route optimization, shift management)
- Hybrid delivery model: own fleet for high-volume zones, PickMe/Grasshoppers for overflow
- Add drug interaction checking and dosage validation
- Advanced analytics dashboard (prescription volumes, revenue, delivery metrics, AI accuracy)
- WEBXPAY as payment backup integration
- Performance optimization and load testing

**Months 13–18: Regional expansion readiness**
- Multi-currency support (LKR, INR, BDT) via payment abstraction layer
- Razorpay integration for India market
- bKash integration for Bangladesh market
- Sinhala/Tamil/Hindi/Bengali localization (i18next)
- Multi-region AWS deployment (Mumbai primary, Singapore secondary)
- Migrate auth to Keycloak for compliance in multiple jurisdictions
- Extract delivery tracking and notifications as independent microservices
- Regulatory compliance review for India (CDSCO) and Bangladesh (DGDA)

---

## Summary tech stack table

| Layer | Technology | Key Justification |
|-------|-----------|-------------------|
| **Frontend (Web)** | Next.js 16 + shadcn/ui + Tailwind CSS v4 + TypeScript | SSR dashboards, accessible components, code ownership |
| **Mobile (Customer)** | React Native (New Architecture) + Expo | Shared TS codebase, PayHere SDK, larger SL dev pool |
| **Backend** | NestJS (TypeScript) — Modular Monolith | Unified TS stack, built-in WebSocket, modular DI |
| **AI/ML Service** | FastAPI (Python) + Google Cloud Vision + Med7 | Best ML ecosystem, Sinhala/Tamil OCR support |
| **Database** | PostgreSQL (RDS) + Redis (ElastiCache) | JSONB flexibility, RLS multi-tenancy, trigram search |
| **Multi-Tenancy** | Shared schema + `tenant_id` + PostgreSQL RLS | Simplest ops, scales to thousands of tenants |
| **Real-Time** | Socket.IO via NestJS + Redis adapter | Zero extra infra, auto-fallback for weak networks |
| **Push Notifications** | Firebase Cloud Messaging | Free, cross-platform, mature RN integration |
| **Auth** | Firebase Auth → Keycloak (Phase 2) | Phone-first auth, Custom Claims RBAC, free 50K MAU |
| **Payments** | PayHere (primary) + WEBXPAY (backup) | Widest method coverage, best SDKs, Central Bank approved |
| **Delivery** | PickMe Flash + Grasshoppers (adapter pattern) | On-demand urban + islandwide scheduled coverage |
| **File Storage** | AWS S3 (Mumbai) + CloudFront CDN | Encryption, immutable records, low-latency delivery |
| **Cloud** | AWS Mumbai (ap-south-1) | ~25–40ms from Colombo, richest services, serves IN/BD |
| **Compute** | AWS ECS Fargate | Serverless containers, no K8s overhead |
| **CI/CD** | GitHub Actions + Docker + AWS ECR | Free tier sufficient, direct ECS deployment |
| **IaC** | Terraform | Multi-cloud ready for expansion |
| **Monitoring** | CloudWatch + Sentry + Better Uptime | Cost-effective, Sentry for RN crash reporting |
| **API Docs** | OpenAPI/Swagger (NestJS auto-generation) | Built into framework, interactive explorer |

## Conclusion: a practical path from MVP to regional scale

This architecture prioritizes **developer velocity through a unified TypeScript stack**, choosing a modular monolith over premature microservices and managed services over self-hosted infrastructure. The AI prescription pipeline starts with proven cloud APIs (Google Cloud Vision + Med7) at **~$240/month for 5,000 prescriptions**, avoiding expensive custom model development until sufficient training data accumulates.

The delivery aggregator's adapter pattern is the most strategically important architectural decision — it decouples the platform from any single provider and enables seamless addition of new delivery services (including the platform's own fleet in Phase 2) without modifying core business logic. PickMe Flash provides the essential on-demand urban delivery capability, while Grasshoppers extends reach to the entire island.

PayHere's Auth & Capture flow solves the pharmacy-specific problem of provisional billing — hold the customer's payment during prescription verification, then capture only after pharmacist confirmation. No other Sri Lankan gateway provides this capability with comparable SDK quality.

The estimated **infrastructure cost of $200–250/month** at launch scales linearly to $500–800/month at moderate traffic (50 pharmacies, 10,000 MAU) and $2,000–5,000/month at regional scale. The unified TypeScript ecosystem means a team of **5–7 developers** can build and maintain all three portals, the backend, and the AI pipeline — a critical efficiency for a startup entering an emerging market.