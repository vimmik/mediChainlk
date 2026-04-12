# Project Guidelines

## Overview

MediChainLK — Sri Lankan pharmacy management platform. Turborepo monorepo with 5 apps and 3 shared packages. See [CLAUDE.md](../CLAUDE.md) for full architectural context, [docs/OVERVIEW.md](../docs/OVERVIEW.md) for platform purpose and data flow.

## Build and Test

```bash
# Infrastructure
docker-compose up -d              # PostgreSQL :5432 + Redis :6379

# Start all apps
npm run dev                       # Turborepo parallel dev

# Per-app
npm run dev --workspace=apps/api           # NestJS :3001
npm run dev --workspace=apps/admin-portal  # Next.js :3002
npm run dev --workspace=apps/pharmacy-portal # Next.js :3003
cd apps/ai-service && uvicorn app.main:app --reload  # FastAPI :8000
cd apps/customer-app && npx expo start     # Expo :8081

# Database (always generate before migrate)
npm run db:generate               # Regenerate Prisma client
npm run db:migrate                # Run pending migrations

# Tests
npm run test                      # All workspaces
npm run test --workspace=apps/api # NestJS only
cd apps/ai-service && pytest tests/ -v  # Python only
```

Requires **Node >=22.0.0**, **Python 3.12** (ai-service only). See [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) for full setup.

## Architecture

**NestJS API** (`apps/api`): Modular monolith. Each module has `module.ts`, `controller.ts`, `service.ts`, `dto/`. Key modules: `auth`, `prescription`, `inventory`, `billing`, `payment`, `delivery`, `notification`, `tenant`, `user`.

**Multi-tenancy**: Every Prisma model has `tenantId`. `FirebaseAuthGuard` extracts `tenantId` from Firebase Custom Claims → use `@CurrentTenant()` decorator in controllers. Always filter queries by `tenantId`.

**Adapter Pattern**: `payment/` and `delivery/` use interface-based adapters (`IPaymentAdapter`, `IDeliveryAdapter`). Add providers by implementing the interface — no changes to service layer needed.

**Scatter-Gather**: `DeliveryService.getQuotes()` fires all adapters in parallel, 3s timeout per adapter, results sorted cheapest-first.

**Auth & Capture**: `PayHereAdapter.authorizePayment()` holds funds. Call `capturePayment()` only after pharmacist confirmation. Never capture before confirmation.

## Conventions

- **TypeScript strict mode** everywhere (except `ai-service`). No `any` types.
- `tsconfig.json` uses `"module": "node16", "moduleResolution": "node16"` — not `"commonjs"`.
- Shared packages imported as `@medichainlk/shared-types`, `@medichainlk/shared-utils`, `@medichainlk/ui`. Resolved via `paths` — no build step during dev.
- **DTOs** use `class-validator`; **shared schemas** use Zod in `@medichainlk/shared-utils`.
- **Roles** are snake_case strings: `system_admin`, `pharmacy_staff`, `pharmacy_owner`, `customer`.
- **Prisma models**: CUID primary keys, always include `tenantId`, `createdAt`, `updatedAt`.
- **Python** (ai-service only): format with Black + isort.
- Medicine names on prescriptions are always in English.

## Gotchas

- **Med7 model**: Must install manually — `python -m spacy download en_core_med7_lg`. NLP fails silently without it.
- **High-alert medicines** (insulin, warfarin): Always route to pharmacist review regardless of OCR confidence.
- **Firebase private key**: `\n` must be escaped as `\\n` in `.env` files.
- **Delivery partners** (PickMe, Grasshoppers): Require corporate accounts — adapters are stubs with TODOs.
- **No Stripe**: Not available in Sri Lanka. Use PayHere (primary) + WEBXPAY (backup).
- **Turbo cache**: Run `npm run build -- --no-cache` if seeing stale outputs.

## Error Response Format

All API errors follow this structure:
```json
{ "success": false, "error": "message", "code": "ERROR_CODE", "statusCode": 401 }
```

## Key References

| Topic | Doc |
|-------|-----|
| Full architecture & commands | [CLAUDE.md](../CLAUDE.md) |
| Local development setup | [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) |
| Platform overview & data flow | [docs/OVERVIEW.md](../docs/OVERVIEW.md) |
| AI/OCR pipeline | [apps/ai-service/README.md](../apps/ai-service/README.md) |
| Demo walkthrough | [docs/DEMO.md](../docs/DEMO.md) |
| AWS infrastructure | [infrastructure/terraform/](../infrastructure/terraform/) |
