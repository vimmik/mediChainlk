# Local Development Guide

Get MediChainLK running on your machine for development.

---

## Prerequisites

- **Node 22** (check `.nvmrc`)
  ```bash
  nvm use  # or manually install node 22
  node --version  # should be v22.x.x
  ```

- **npm 10+**
  ```bash
  npm --version
  ```

- **Docker & Docker Compose** (for PostgreSQL + Redis)
  ```bash
  docker --version
  docker-compose --version
  ```

- **Python 3.12** (for AI service)
  ```bash
  python --version
  ```

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/vimmik/mediChainlk.git
cd mediChainlk
npm install
```

### 2. Database & Cache

Start PostgreSQL + Redis:
```bash
docker-compose up -d
```

Verify they're running:
```bash
docker-compose ps
# Expected: postgres (5432), redis (6379) both running
```

### 3. Generate Prisma Client & Run Migrations

```bash
npm run db:generate
npm run db:migrate
```

This creates the schema in your local PostgreSQL.

### 4. Firebase Setup

Create `apps/api/firebase-admin-key.json`:
```json
{
  "type": "service_account",
  "project_id": "medichainlk-dev",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

Then in `apps/api/.env`:
```
FIREBASE_ADMIN_KEY="$(cat firebase-admin-key.json)"
```

(Or if your shell doesn't support command substitution, paste the JSON directly.)

### 5. Environment Files

Copy `.env.example` → `.env` in each app:

**Root monorepo** — no env needed

**apps/api/.env**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medichainlk"
REDIS_URL="redis://localhost:6379"
FIREBASE_ADMIN_KEY="{...json from step 4...}"
AWS_ACCESS_KEY_ID="dev-key-id"          # dummy values OK for local dev
AWS_SECRET_ACCESS_KEY="dev-secret"
AWS_BUCKET_NAME="medichainlk-dev-prescriptions"
AWS_REGION="ap-south-1"
AI_SERVICE_URL="http://localhost:8000"
```

**apps/admin-portal/.env.local**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_FIREBASE_CONFIG='{"apiKey":"...","projectId":"medichainlk-dev",...}'
```

**apps/pharmacy-portal/.env.local**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_FIREBASE_CONFIG='{"apiKey":"...","projectId":"medichainlk-dev",...}'
```

**apps/customer-app/.env**
```bash
EXPO_PUBLIC_API_URL="http://localhost:3001"
```

**apps/ai-service/.env**
```bash
GOOGLE_APPLICATION_CREDENTIALS="/path/to/google-cloud-key.json"  # optional for local
AWS_ACCESS_KEY_ID="dev-key-id"
AWS_SECRET_ACCESS_KEY="dev-secret"
AWS_BUCKET_NAME="medichainlk-dev-prescriptions"
AWS_REGION="ap-south-1"
```

**apps/demo/.env** — not needed (no backend calls)

---

## Running Locally

### Terminal 1: NestJS API

```bash
npm run dev --workspace=apps/api
# Listens on http://localhost:3001
# Swagger: http://localhost:3001/api/docs
```

### Terminal 2: FastAPI AI Service

```bash
cd apps/ai-service

# Create virtual environment (first time only)
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Download Med7 spaCy model (first time only)
python -m spacy download en_core_med7_lg

# Run dev server
uvicorn app.main:app --reload --port 8000
# Listens on http://localhost:8000
# Interactive docs: http://localhost:8000/docs
```

### Terminal 3: Admin Portal

```bash
npm run dev --workspace=apps/admin-portal
# Listens on http://localhost:3002
```

### Terminal 4: Pharmacy Portal

```bash
npm run dev --workspace=apps/pharmacy-portal
# Listens on http://localhost:3003
```

### Terminal 5: Customer App (Optional)

```bash
cd apps/customer-app
npx expo start

# Then press 'w' for web, or scan the QR code with Expo Go app on your phone
# Listens on http://localhost:8081
```

### Terminal 6: Demo App (Optional)

```bash
npm run dev --workspace=apps/demo
# Listens on http://localhost:3010
# No backend calls — all mock data
```

---

## Useful Commands

### Database

```bash
# Open Prisma Studio (visual DB browser)
npm run db:studio

# Run migrations
npm run db:migrate

# Regenerate Prisma client after schema changes
npm run db:generate

# Reset database (⚠️ deletes all data)
cd apps/api && npx prisma migrate reset --skip-generate
```

### Linting

```bash
# Lint all workspaces
npm run lint

# Lint specific app
npm run lint --workspace=apps/api
npm run lint --workspace=apps/admin-portal
```

### Testing

```bash
# Run tests in all workspaces
npm run test

# NestJS unit tests
npm run test --workspace=apps/api

# NestJS watch mode
npm run test:watch --workspace=apps/api

# NestJS e2e tests
npm run test:e2e --workspace=apps/api

# FastAPI tests
cd apps/ai-service && pytest tests/ -v --tb=short
```

### Building

```bash
# Build all workspaces
npm run build

# Build specific app
npm run build --workspace=apps/api
npm run build --workspace=apps/admin-portal
```

---

## Testing a Feature End-to-End

### Example: Upload & Process a Prescription

**Step 1: Prepare test prescription image**
Save a sample prescription image as `test-rx.jpg`

**Step 2: Upload via cURL (API)**
```bash
curl -X POST http://localhost:3001/prescriptions/upload \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "image=@test-rx.jpg"
```

**Expected response:**
```json
{
  "id": "rx-abc123",
  "status": "PENDING_OCCLUSION",
  "imageUrl": "s3://bucket/prescriptions/rx-abc123.jpg"
}
```

**Step 3: Monitor logs**
In the API terminal, you'll see:
```
[Prescription] POST /prescriptions/upload
[Prescription] Uploaded to S3: rx-abc123.jpg
```

**Step 4: Check Prisma Studio**
```bash
npm run db:studio
# Navigate to Prescription table, see the new record
```

**Step 5: Trigger AI analysis**
```bash
curl -X POST http://localhost:3001/prescriptions/analyze \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prescriptionId":"rx-abc123"}'
```

**Step 6: Check AI service logs**
In the FastAPI terminal:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
POST /prescriptions/analyze
  Downloading s3://bucket/prescriptions/rx-abc123.jpg...
  Running OpenCV preprocessing...
  Calling Google Cloud Vision...
  Running Med7 NLP...
  Confidence: MEDIUM (0.82)
```

**Step 7: Verify in DB**
Re-open Prisma Studio, refresh Prescription record — status should be `PENDING_REVIEW` and confidence should be populated.

---

## Common Issues

### 1. "database does not exist"

```bash
# PostgreSQL is not running
docker-compose up -d

# Or, create the database manually
psql postgresql://postgres:postgres@localhost:5432
CREATE DATABASE medichainlk;
```

### 2. "Cannot find module @medichainlk/shared-types"

```bash
# Regenerate the Prisma client
npm run db:generate

# Or, rebuild node_modules
rm -rf node_modules package-lock.json
npm install
```

### 3. "FIREBASE_ADMIN_KEY is invalid JSON"

```bash
# Check that the key file exists and is valid JSON
cat apps/api/firebase-admin-key.json | jq .

# If invalid, download a fresh service account key from Firebase Console
# https://console.firebase.google.com → Project Settings → Service Accounts
```

### 4. "Port 3001 already in use"

```bash
# Kill the process using port 3001
lsof -i :3001  # on macOS/Linux
netstat -ano | findstr :3001  # on Windows
kill -9 <PID>
```

### 5. "Med7 model not found (FastAPI)"

```bash
# In the ai-service venv:
python -m spacy download en_core_med7_lg
```

### 6. "Cannot get a connection, pool error"

```bash
# Docker postgres is up but not ready
docker-compose logs postgres

# Wait a few seconds, then try again
# Or restart:
docker-compose restart postgres
```

---

## Development Workflow

### Adding an API Endpoint

1. **Define DTO** — `apps/api/src/module/dto/create.dto.ts`
2. **Add Prisma model** — `apps/api/prisma/schema.prisma` (if new entity)
3. **Write service method** — `apps/api/src/module/module.service.ts`
4. **Add controller endpoint** — `apps/api/src/module/module.controller.ts`
5. **Test with cURL or Swagger** — http://localhost:3001/api/docs

### Adding a UI Page

1. **Create page component** — `apps/admin-portal/src/app/page.tsx`
2. **Add route to navigation** — update sidebar/nav config
3. **Import shared components** — `@medichainlk/ui`, `@medichainlk/shared-types`
4. **Test in dev server** — `npm run dev --workspace=apps/admin-portal`

### Modifying Database Schema

1. **Edit Prisma schema** — `apps/api/prisma/schema.prisma`
2. **Create migration** — `npm run db:migrate` (guided)
3. **Regenerate client** — `npm run db:generate`
4. **Type-check** — `npm run lint` in apps/api

---

## Debugging

### NestJS API

```bash
# Enable verbose logging
DEBUG=* npm run dev --workspace=apps/api

# Or add to .env:
LOG_LEVEL=debug

# Swagger UI helps visualize endpoints
http://localhost:3001/api/docs
```

### FastAPI

```bash
# Logs are printed to console; increase verbosity with:
uvicorn app.main:app --reload --log-level debug

# Interactive API docs
http://localhost:8000/docs
```

### Frontend (Next.js / React)

```bash
# Open browser DevTools (F12)
# Sources tab → Webpack → src/ for original TypeScript
# Console tab for React errors
```

### Database

```bash
# Open Prisma Studio
npm run db:studio

# Query directly with psql
psql postgresql://postgres:postgres@localhost:5432/medichainlk
\dt  -- list tables
SELECT * FROM "Prescription" LIMIT 5;
```

---

## Production-like Local Testing

To test with a more production-like setup locally:

```bash
# 1. Build all services
npm run build

# 2. Create a .env file for production values (don't commit!)
cp apps/api/.env.example apps/api/.env.prod

# 3. Run services in production mode
NODE_ENV=production npm run start --workspace=apps/api

# 4. Run Next.js builds as standalone
npm run build --workspace=apps/admin-portal
NODE_ENV=production npm run start --workspace=apps/admin-portal
```

---

## Next Steps

- [OVERVIEW.md](./OVERVIEW.md) — understand the architecture
- [API.md](./API.md) — API endpoint reference
- [DEMO.md](./DEMO.md) — run the client demo
