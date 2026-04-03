# MediChainLK

AI-powered pharmacy management platform for Sri Lanka with delivery aggregation, payment processing, and multi-tenant pharmacy operations.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│  Admin Portal (3002)  Pharmacy Portal (3003)  Mobile App │
│     Next.js 15            Next.js 15          React Native│
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────▼──────────────────────────────┐
│              NestJS API (3001) — Modular Monolith         │
│  auth │ prescription │ inventory │ billing │ payment      │
│  delivery │ notification │ tenant │ user                  │
└────────────────┬──────────────────┬─────────────────────┘
                 │                  │
     ┌───────────▼───┐    ┌────────▼────────┐
     │  PostgreSQL   │    │  Redis          │
     │  (RDS)        │    │  (ElastiCache)  │
     └───────────────┘    └─────────────────┘
                 │
     ┌───────────▼──────────────┐
     │  FastAPI AI Service (8000)│
     │  OCR → NLP → Match        │
     └──────────────────────────┘
```

## Quick Start

**Prerequisites**: Node.js 22, Docker, Python 3.12

```bash
# 1. Start local infrastructure
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Set up environment files
cp apps/api/.env.example apps/api/.env
cp apps/admin-portal/.env.local.example apps/admin-portal/.env.local
cp apps/pharmacy-portal/.env.local.example apps/pharmacy-portal/.env.local
cp apps/ai-service/.env.example apps/ai-service/.env
# Fill in Firebase, AWS, and PayHere credentials

# 4. Run database migrations
npm run db:generate
npm run db:migrate

# 5. Install Python dependencies
cd apps/ai-service && pip install -r requirements.txt && cd ../..

# 6. Start all apps
npm run dev
```

## Ports

| Service | Port |
|---------|------|
| NestJS API | 3001 |
| Admin Portal | 3002 |
| Pharmacy Portal | 3003 |
| FastAPI AI Service | 8000 |
| Expo Customer App | 8081 |
| PostgreSQL | 5432 |
| Redis | 6379 |

## Project Structure

```
apps/
  api/                # NestJS modular monolith
  admin-portal/       # Next.js — system admin
  pharmacy-portal/    # Next.js — pharmacy staff
  customer-app/       # React Native (Expo)
  ai-service/         # FastAPI — OCR/NLP pipeline
packages/
  shared-types/       # TypeScript types shared across all apps
  shared-utils/       # Shared Zod schemas and utilities
  ui/                 # shadcn/ui components (web portals)
infrastructure/
  terraform/          # AWS infrastructure (Mumbai ap-south-1)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Portals | Next.js 15 + shadcn/ui + Tailwind CSS v4 |
| Mobile | React Native (Expo SDK 52, New Architecture) |
| Backend | NestJS 11 + Prisma 6 + PostgreSQL 16 |
| AI/ML | FastAPI + Google Cloud Vision + Med7 (spaCy) |
| Real-time | Socket.IO via NestJS Gateway + Redis adapter |
| Auth | Firebase Authentication (phone/SMS primary) |
| Payments | PayHere (primary) + WEBXPAY (backup) |
| Delivery | PickMe Flash + Grasshoppers (adapter pattern) |
| Infrastructure | AWS ECS Fargate, RDS, ElastiCache, S3, CloudFront |
| IaC | Terraform |
| CI/CD | GitHub Actions |

## Development Commands

```bash
npm run dev          # Start all apps in parallel (via Turbo)
npm run build        # Build all apps
npm run lint         # Lint all apps
npm run test         # Run all tests
npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Prisma Studio
```

## Environment Variables

Each app has a `.env.example` file. Required credentials:

- **Firebase**: Project ID, private key, client email (admin SDK) + web config (client SDK)
- **AWS**: Access key ID, secret, region, S3 bucket name
- **PayHere**: Merchant ID, secret (use sandbox for development)
- **Google Cloud Vision**: Service account JSON path

## Delivery Partners

- **PickMe Flash** — corporate account required (engineering@pickme.lk)
- **Grasshoppers** — partnership registration required (Corporate ID issued upon approval)
