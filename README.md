# DevFlow — Developer Productivity Analytics Platform

A full-stack DORA metrics dashboard that ingests real-time GitHub webhook events to track engineering team productivity — cycle time, deployment frequency, PR throughput, and contributor activity.

**Live Demo:** http://44.220.245.228:3000

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, REST API, Prisma ORM |
| Database | PostgreSQL (AWS RDS) |
| Caching | Redis (5-min TTL) |
| Infrastructure | AWS EC2, AWS RDS |
| CI/CD | GitHub Actions |

## Architecture

```
GitHub Webhooks
      │
      ▼
AWS EC2 (Next.js + Node.js)
      │
      ├── PostgreSQL (AWS RDS)   ← stores events & daily metrics
      └── Redis                  ← caches API responses (5-min TTL)
```

## Features

- **DORA Metrics Dashboard** — tracks cycle time, deployment frequency, PRs merged, and commit frequency
- **Real-time Webhook Processing** — ingests GitHub push and pull_request events via HMAC-verified webhooks
- **Contributor Activity Chart** — visualizes commits and PR contributions per team member
- **Multi-repo Support** — track multiple repositories with one-click webhook registration
- **Redis Caching** — sub-50ms metric queries with automatic cache invalidation
- **GitHub OAuth** — secure authentication via GitHub OAuth 2.0

## CI/CD Pipeline

Every push to `main` triggers:
1. TypeScript type check
2. Production build
3. Automated deploy to AWS EC2 via SSH

## Local Development

```bash
# Prerequisites: Docker, Node.js 20+

# Start PostgreSQL and Redis
docker-compose up -d

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```
