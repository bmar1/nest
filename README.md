<p align="center">
  <img src="src/nestapp-frontend/nestapp/public/hero.png" alt="Nest — Apartment hunting, reimagined." width="100%" />
</p>

<h1 align="center">
  <img src="src/nestapp-frontend/nestapp/public/nest-logo.svg" alt="" width="36" height="36" />
  Nest
</h1>

<p align="center">
  <strong>Find a better apartment, faster — with less noise.</strong><br/>
  One search. Ranked results. Under a minute.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#scoring">Scoring</a> ·
  <a href="#deployment">Deployment</a>
</p>

---

Renting shouldn't mean refreshing five tabs, reconciling duplicate posts, and guessing which "great deal" is actually a fit. **Nest** is an apartment search tool built for people who want clarity: one place to search, priorities you control, and ranked results that explain *why* a listing scored the way it did.

Currently live for the **Toronto** rental market — aggregating listings from **Craigslist** and **Kijiji**.

<br/>

## ✦ Features

| | |
|:--|:--|
| 🎯 **Priority-driven search** | Choose what matters most — budget, space, amenities, or a balanced mix — and results re-rank to match. |
| 🔗 **Multi-source aggregation** | Listings from Craigslist Toronto and Kijiji, merged and deduplicated automatically. |
| ⚡ **Cached freshness** | Recent non-expired listings are reused for instant follow-up searches. |
| 📊 **Transparent scoring** | Every listing gets a 0–100 score with a full breakdown, so you see the tradeoffs at a glance. |
| 🖼️ **Source images** | Real listing photos from the original sources, displayed directly in the results. |

<br/>

## How It Works

```
React Frontend  →  Spring Boot REST API  →  PostgreSQL
```

1. You submit a search with your budget, size, and priority preferences.
2. The backend asynchronously scrapes live sources and pulls fresh cached listings from PostgreSQL.
3. Listings are normalized, deduplicated, filtered by your criteria, and scored.
4. The frontend polls for results and renders ranked cards with score breakdowns.

<br/>

## Stack

| Layer | Technology |
|:--|:--|
| **Backend** | Spring Boot 4.0.2, Java 21 |
| **Frontend** | React 19, TypeScript, Vite |
| **Database** | PostgreSQL 16 (Supabase) |
| **Scraping** | Jsoup |
| **Deployment** | Docker, Docker Compose, Kubernetes (DOKS) |

<br/>

## Scoring

Each listing receives a **0–100 composite score** built from four weighted components:

| Component | Max Points | Logic |
|:--|:--:|:--|
| **Price** | 30 | Lower price → higher score, normalized against the result set |
| **Space** | 30 | More square footage → higher score, normalized against the result set |
| **Amenities** | 20 | In-unit laundry (10), parking (5), gym (3), other (2 each, capped) |
| **Lease flexibility** | 20 | Month-to-month (20), 6-mo (15), 12-mo (10), 12+ (5) |

### Priority multipliers

Your chosen priority amplifies the dimension that matters most:

| Priority | Price | Space | Amenities | Lease |
|:--|:--:|:--:|:--:|:--:|
| `BUDGET` | **1.5×** | 0.8× | 0.8× | 0.9× |
| `SPACE` | 0.8× | **1.5×** | 0.8× | 0.9× |
| `AMENITIES` | 0.9× | 0.9× | **1.5×** | 0.9× |
| `BALANCED` | 1.0× | 1.0× | 1.0× | 1.0× |

<br/>

## Quick Start

### Prerequisites

- Java 21+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker Compose)

### Docker Compose (recommended)

```bash
# Start all services
docker compose up -d --build

# Tail logs
docker compose logs -f api
```

| Service | URL |
|:--|:--|
| Frontend | `http://localhost` |
| API | `http://localhost:8080` |
| Health check | `http://localhost:8080/api/v1/health` |
| PostgreSQL | `localhost:5432` |

Default local DB credentials: `nest` / `postgres` / `postgres`

### Manual setup

```bash
# 1. Start PostgreSQL
docker run -d --name nest-postgres \
  -e POSTGRES_DB=nest \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16-alpine

# 2. Run Spring Boot API
./mvnw spring-boot:run

# 3. Run React frontend
cd src/nestapp-frontend/nestapp
npm install && npm run dev
```

Frontend available at `http://localhost:5173`

<br/>

## Deployment

### Kubernetes (DigitalOcean)

See [`k8s/README.md`](k8s/README.md) for full instructions.

```bash
# Build and push images
docker build -t yourusername/nest-api:latest .
docker push yourusername/nest-api:latest

cd src/nestapp-frontend/nestapp
docker build -t yourusername/nest-frontend:latest .
docker push yourusername/nest-frontend:latest

# Deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

<br/>

## Project Structure

```
nestapp/
├── src/
│   ├── main/java/com/nest/nestapp/
│   │   ├── controller/          # REST endpoints
│   │   ├── converter/           # JPA type converters
│   │   ├── dto/                 # Request/response objects
│   │   ├── model/               # JPA entities
│   │   ├── repository/          # Data access layer
│   │   └── service/             # Business logic & scraping
│   ├── main/resources/
│   │   ├── db/migration/        # Flyway SQL migrations
│   │   └── application.properties # Spring Boot config
│   ├── nestapp-frontend/nestapp/
│   │   └── src/
│   │       ├── components/      # Shared React components
│   │       └── pages/           # Landing, Search, Results
│   └── test/                    # Unit & integration tests
├── k8s/                         # Kubernetes manifests
├── Dockerfile
├── docker-compose.yml
└── pom.xml
```

<br/>

## Contributing

1. Fork the repo
2. Create a feature branch
3. Write tests for new functionality
4. Submit a pull request

---

<p align="center">
  Built with care for anyone who has spent too long apartment hunting.<br/>
  <sub>Questions or issues? <a href="../../issues">Open an issue</a>.</sub>
</p>
