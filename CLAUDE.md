# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start everything (via Turborepo)
npm run dev

# Per-app development
npm run dev --workspace=apps/api          # NestJS API on :3001
npm run dev --workspace=apps/admin-portal  # Admin portal on :3002
npm run dev --workspace=apps/pharmacy-portal # Pharmacy portal on :3003
cd apps/ai-service && uvicorn app.main:app --reload  # FastAPI on :8000
cd apps/customer-app && npx expo start    # Expo on :8081

# Database
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:migrate    # Run pending migrations (needs DATABASE_URL in apps/api/.env)
npm run db:studio     # Open Prisma Studio GUI

# Local infrastructure
docker-compose up -d  # Start PostgreSQL :5432 + Redis :6379

# Testing
npm run test                              # All workspaces via Turbo
npm run test --workspace=apps/api         # NestJS unit tests only
cd apps/ai-service && pytest tests/ -v    # Python tests
```

## Monorepo Structure

Turborepo monorepo. Each app is independent; shared code lives in `packages/`.

```text
apps/
  api/               # NestJS 11 — modular monolith, port 3001
  admin-portal/      # Next.js 15 — system admin, port 3002
  pharmacy-portal/   # Next.js 15 — pharmacy staff, port 3003
  customer-app/      # React Native (Expo SDK 52), port 8081
  ai-service/        # FastAPI (Python 3.12), port 8000
packages/
  shared-types/      # TypeScript types — imported by all apps as @medichainlk/shared-types
  shared-utils/      # Zod schemas + formatters — @medichainlk/shared-utils
  ui/                # shadcn/ui components — @medichainlk/ui (web portals only)
infrastructure/
  terraform/         # AWS (ap-south-1) — ECS Fargate, RDS, ElastiCache, S3
```

## NestJS API Architecture (`apps/api`)

Modular monolith. Each module has `module.ts`, `controller.ts`, `service.ts`, `dto/`. Module boundaries:

| Module | Responsibility |
| ------ | -------------- |
| `auth` | Firebase Admin SDK init, `FirebaseAuthGuard`, `RolesGuard` |
| `prescription` | S3 upload, AI service orchestration, pharmacist review queue |
| `inventory` | Stock levels, low-stock alerts, quantity adjustments |
| `billing` | Invoice + order creation, pricing |
| `payment` | `IPaymentAdapter` implementations: `PayHereAdapter`, `WebxpayAdapter` |
| `delivery` | Scatter-gather quotes, `IDeliveryAdapter` implementations: `PickMeAdapter`, `GrasshoppersAdapter` |
| `notification` | FCM push via `firebase-admin`, Socket.IO gateway |
| `tenant` | Pharmacy tenant CRUD (system_admin only) |
| `user` | User management per tenant |

**Key files:**

- [src/common/guards/firebase-auth.guard.ts](apps/api/src/common/guards/firebase-auth.guard.ts) — validates Firebase ID token, attaches `user` to request
- [src/common/guards/roles.guard.ts](apps/api/src/common/guards/roles.guard.ts) — RBAC via `@Roles()` decorator
- [src/delivery/delivery.service.ts](apps/api/src/delivery/delivery.service.ts) — scatter-gather with 3s timeout
- [prisma/schema.prisma](apps/api/prisma/schema.prisma) — all models have `tenantId` for multi-tenancy

## FastAPI AI Service (`apps/ai-service`)

Python-only. Called by NestJS via `POST /prescriptions/analyze`. Must not contain business logic.

Pipeline: `S3 download → OpenCV preprocess → Google Cloud Vision OCR → Med7/spaCy NLP → rapidfuzz match → confidence tier`

- Confidence tiers: `HIGH ≥ 0.90` (auto-accept), `MEDIUM 0.70–0.90` (pharmacist review), `LOW < 0.70` (reject)
- High-alert medicines (insulin, warfarin) always route to pharmacist regardless of confidence
- Install Med7 model manually: `python -m spacy download en_core_med7_lg`

## Key Architectural Patterns

**Adapter Pattern** — both delivery and payment use `IDeliveryAdapter` / `IPaymentAdapter` interfaces. Add providers by implementing the interface; no changes to service layer needed.

**Scatter-Gather** — `DeliveryService.getQuotes()` fires all adapters in parallel with `Promise.race` against a 3-second timeout. Results sorted cheapest-first.

**Multi-tenancy** — every Prisma model has `tenantId`. The `FirebaseAuthGuard` reads `tenantId` from Firebase Custom Claims and attaches it to `request.user`. Use `@CurrentTenant()` decorator in controllers to extract it.

**Auth & Capture** — `PayHereAdapter.authorizePayment()` holds funds; `capturePayment()` is called after pharmacist confirmation. Never capture before confirmation.

## Third-Party Integrations

**Delivery** (both require corporate accounts, not self-serve):

- **PickMe Flash** — contact `engineering@pickme.lk`; adapter stub in [apps/api/src/delivery/adapters/pickme.adapter.ts](apps/api/src/delivery/adapters/pickme.adapter.ts)
- **Grasshoppers** — requires Corporate ID; stub in [apps/api/src/delivery/adapters/grasshoppers.adapter.ts](apps/api/src/delivery/adapters/grasshoppers.adapter.ts)

**Payments:**

- **PayHere** sandbox: `sandbox.payhere.lk` — stub in [apps/api/src/payment/adapters/payhere.adapter.ts](apps/api/src/payment/adapters/payhere.adapter.ts)
- Webhook endpoints: `POST /payments/webhook/payhere` and `POST /payments/webhook/webxpay`

**Firebase Auth:** phone/SMS is primary for customers; email+password for pharmacy staff and admin. Custom Claims must include `{ tenantId, role, permissions }`.

**No Stripe** — not directly available in Sri Lanka. Use PayHere (primary) + WEBXPAY (backup).

## Environment Setup

Copy `.env.example` → `.env` for each app:

- `apps/api/.env` — DATABASE_URL, REDIS_URL, Firebase Admin, AWS S3, AI_SERVICE_URL, PayHere
- `apps/admin-portal/.env.local` — NEXT_PUBLIC_API_URL, Firebase web config
- `apps/pharmacy-portal/.env.local` — same as admin
- `apps/ai-service/.env` — GOOGLE_APPLICATION_CREDENTIALS, AWS S3, API_URL
- `apps/customer-app/.env` — EXPO_PUBLIC_API_URL

## TypeScript Configuration

`apps/api/tsconfig.json` uses `"module": "node16", "moduleResolution": "node16"` (not `commonjs`) to avoid TS 7.0 deprecation warnings. Workspace package imports (`@medichainlk/*`) are resolved via `paths` pointing to source — no build step needed during development.

## Language Conventions

- TypeScript strict mode everywhere in `apps/` (except `ai-service`) and `packages/`
- Python only in `apps/ai-service/` — format with Black + isort
- Shared types in `packages/shared-types/src/` — import as `@medichainlk/shared-types`
- Medicine names on prescriptions are in English even when patient details are in Sinhala/Tamil
