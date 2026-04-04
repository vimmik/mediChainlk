# MediChainLK Documentation

Complete guides for the MediChainLK platform — from architecture to client presentations.

## Quick Navigation

- **[OVERVIEW.md](./OVERVIEW.md)** — Platform architecture, tech stack, module breakdown
- **[DEMO.md](./DEMO.md)** — Client presentation demo walkthrough (10 pages, mock data, presenting tips)
- **[API.md](./API.md)** — NestJS API endpoints, auth, multi-tenancy, adapters
- **[AI_SERVICE.md](./AI_SERVICE.md)** — FastAPI AI pipeline, OCR, NLP, confidence tiers
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — AWS infrastructure (Terraform), ECS Fargate, RDS, Redis
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** — Local setup, useful commands, debugging

## For First-Time Readers

1. **[OVERVIEW.md](./OVERVIEW.md)** — Understand the platform in 10 minutes
2. **[DEVELOPMENT.md](./DEVELOPMENT.md)** — Get the repo running locally
3. **[DEMO.md](./DEMO.md)** — See the client-facing demo in action

## For Specific Tasks

| Task | Document |
|------|----------|
| Adding a new API endpoint | [API.md](./API.md) |
| Understanding the AI pipeline | [AI_SERVICE.md](./AI_SERVICE.md) |
| Deploying to AWS | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Debugging a prescription flow issue | [OVERVIEW.md](./OVERVIEW.md#architecture) → [API.md](./API.md#prescription-module) → [AI_SERVICE.md](./AI_SERVICE.md) |
| Setting up a local dev environment | [DEVELOPMENT.md](./DEVELOPMENT.md) |
| Presenting the platform to clients | [DEMO.md](./DEMO.md) |

---

## Files

```
docs/
├── README.md              # This file
├── OVERVIEW.md            # High-level architecture & module guide
├── DEMO.md                # Client presentation demo (all 10 pages)
├── API.md                 # NestJS API reference
├── AI_SERVICE.md          # FastAPI AI pipeline reference
├── DEPLOYMENT.md          # AWS infrastructure & Terraform
└── DEVELOPMENT.md         # Local development setup & commands
```
