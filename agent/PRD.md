# Product Requirements Document: ApartmentFinder MVP

**Project Name:** *Nest*
**Version:** 1.1 (MVP + platform architecture spec)
**Timeline:** 2 months

## 1\. Overview

Nest is a web application that scrapes apartment listings from rental websites, aggregates them, and recommends the best apartments based on user-defined priorities. The MVP focuses on delivering core functionality with a scalable architecture using Kubernetes (EKS) from day one.

**Document scope:** Sections **4.1–4.4** and the **§5** *Scrape source task* entity describe the **target** platform: API and scraper workers in-cluster, message queue for jobs, PostgreSQL for durable state and completion tracking. The currently shipped product may still run scraping inside the API process until that split is implemented.

### Geography & deployment (locked decisions)

- **Market:** **Toronto only** — no multi-city or region abstraction required in the product model for the foreseeable future; scrapers stay fixed to Toronto listings.
- **Primary deployment (current phase):** **Local / self-hosted** on the developer’s machine — e.g. **Kubernetes** (kind, k3s, Docker Desktop, or similar) running containerized **Spring Boot API**, **RabbitMQ**, **PostgreSQL**, and scraper worker images. **No requirement** for paid cloud (EKS, RDS, etc.) to ship or learn this stack; cloud patterns remain **portable** if you move later.
- **Partial source failure:** If **one source succeeds** and **another fails** (task `FAILED`, timeout, or zero listings), the product **still delivers results** from whatever succeeded: all `scrape_source_tasks` become terminal, then **only the Spring Boot API** runs **ScoringService** on `apartments` for that `search_id` and returns **COMPLETED** with available listings (optional: expose per-source status in API responses for transparency).
- **Cache / deduplication:** Immediately **after** extracting listings from a live scrape, **before** treating a row as new work for this `search_id`, check whether a non-expired row already exists for the same stable key (**`source_url`** in the Toronto-only model). If it exists, **do not re-scrape or duplicate** that listing for cache’s sake — **reuse** the cached payload (copy/link into this search per implementation) so workers stay fast and storage stays bounded.

## 2\. Goals & Success Metrics

**Primary Goals:**

- Users can input apartment search criteria and receive ranked recommendations
- System successfully scrapes and processes listings from at least 2 apartment listing sites
- Architecture demonstrates Kubernetes scalability and senior-level system design patterns
- User receives results within 3 minutes of submitting a search

**Success Metrics:**

- Ability to scrape and rank 100+ apartments per search
- Response time: < 3 minutes from request to results
- Zero data loss on scraping failures
- Codebase ready for resume/interview discussions

## 3\. Matching Logic & Scoring Algorithm

### User Priority Selection

Users select ONE primary priority from dropdown: **Budget Focused**, **Space Focused**, **Amenities Focused**, or **Balanced**

### Scoring Components (Out of 100)

**Price Score (0-30 points):**

- Formula: `(max_price - apartment_price) / (max_price - min_price) * 30`
- Apartments at or below user's max budget get full points

**Space Score (0-30 points):**

- Formula: `(apartment_sqft - min_sqft) / (max_sqft - min_sqft) * 30`
- Anything below user minimum gets reduced score

**Amenities Score (0-20 points):**

- In-unit laundry = 10 pts
- Parking = 5 pts
- Gym = 3 pts
- Other amenities = 2 pts each (capped at 20 total)

**Lease Flexibility Score (0-20 points):**

- Month-to-month = 20 pts
- 6-month = 15 pts
- 12-month = 10 pts
- 12+ months = 5 pts

### Weight Multipliers (by Priority)

- **Budget Focused:** Price × 1.5, Space × 0.8, Amenities × 0.8, Lease × 0.9
- **Space Focused:** Space × 1.5, Price × 0.8, Amenities × 0.8, Lease × 0.9
- **Amenities Focused:** Amenities × 1.5, Price × 0.9, Space × 0.9, Lease × 0.9
- **Balanced:** All × 1.0

**Final Score:** Normalized to 0-100, apartments ranked highest to lowest. Top 20 results shown.

## 4\. System Architecture

High-level diagram (target platform):

```
React (e.g. Vercel)
        │ HTTPS
        ▼
Kubernetes Ingress
        │
        ▼
Spring Boot API (Deployment, N replicas)
        │ AMQP publish (jobs)
        ▼
Message broker (RabbitMQ in-cluster, or AWS SQS in AWS deployments)
        │ consume
        ▼
Scraper worker Deployment (KEDA-scaled pods)
        │ JDBC insert
        ▼
PostgreSQL (apartments, searches, scraping jobs, scrape source tasks)
```

**Local-first setup (current phase):** The same topology runs on a **single PC**: e.g. kind/k3s/Docker Kubernetes with Services for API, RabbitMQ, Postgres, and workers; the React app may run **outside** the cluster (`npm run dev`) or as another pod. **Ingress** is optional locally (e.g. `kubectl port-forward` or NodePort) until you add a proper ingress controller.

**Ingress / API:** Single entry for HTTPS in production-style clusters; forwards to **Spring Boot**. Rate limiting and validation live on the API (and optionally API Gateway / edge later).

**Spring Boot API** (runs **inside** the cluster as containerized pods):

- REST: `POST /api/v1/search`, `GET /api/v1/search/{id}/results`, `GET /api/v1/health`.
- On accept: persists **search request** + **scraping job** + **scrape source task** rows (see §5), then **publishes one queue message per source** (e.g. Craigslist, Kijiji) including `search_id` and parameters.
- **Does not** scrape HTML in this model; **scrapers** do.
- **Scoring** runs in the API after scraping is **orchestrationally complete** for that `search_id` (see §4.3): loads rows from **`apartments WHERE search_id = ?`**, writes `apartment_scores`, updates job/search status.

**Message queue:** **Work distribution only.** Messages are scrape jobs (`search_id`, `source`, budget filters, etc.). Protocol: **AMQP** (RabbitMQ) or **SQS** (AWS). Not HTTP.

**Scraper worker pods:** Stateless consumers; **read job from queue → scrape → INSERT apartments** with the **same `search_id`** as the message → **update the matching scrape source task** to `DONE` or `FAILED`. Optionally publish a lightweight “source completed” event; **authoritative** completion remains in PostgreSQL.

**PostgreSQL:** Source of truth for listings, job state, per-source completion, and scores.

### 4.1 Request and queue flow (step-by-step)

1. Client **POST /api/v1/search** → Ingress → API.
2. API validates input, creates/updates DB rows (`search_requests`, `scraping_jobs`, `scrape_source_tasks` all **PENDING**).
3. API **publishes N messages** (N = number of sources for this search), each including **`search_id`**.
4. API returns **202** + `search_id` + polling URL (unchanged contract).
5. Workers consume messages; each worker processes **one source** for **one `search_id`**.
6. Worker inserts **`apartments`** rows with **`search_id`** set; marks its **`scrape_source_tasks`** row **DONE** / **FAILED**.
7. When **all** `scrape_source_tasks` for that **`search_id`** are **terminal**, **only the API** runs **ScoringService**, persists **apartment_scores**, sets search/job **COMPLETED** if any listings exist for that `search_id`, else **FAILED** (see §4.3, §12).
8. Client **GET /results** sees **COMPLETED** and ranked payloads.

### 4.2 Scraper workers and PostgreSQL

- Workers **do not** send “all apartment IDs” back through the queue for the common case: every **`INSERT`** into **`apartments`** includes **`search_id`**. The batch for scoring is **`SELECT * FROM apartments WHERE search_id = ?`**.
- **Completion is not inferred** from apartment row counts (sources may return 0 listings; timing varies; retries).
- **Cache reuse (see §1):** When persisting scraped listings, resolve **`source_url`** against existing **non-expired** rows; skip redundant detail fetches and avoid duplicate storage **for the same listing**, while still attaching usable rows to the current **`search_id`** for scoring.

### 4.2a Scoring ownership

- **Only the Spring Boot API** runs **`ScoringService`** after **all** `scrape_source_tasks` for that **`search_id`** are **terminal** (`DONE` or `FAILED`). Workers **do not** score. The API persists **`apartment_scores`**, updates **`scraping_jobs` / `search_requests`**, and serves **`GET /results`** to the client — no separate scoring microservice in this design.

### 4.3 Completion strategy (how we know scraping is done)

**Rule:** One relational row per **`(search_id, source)`** — **`scrape_source_tasks`** (name MAY vary in implementation).

Suggested columns:

- `id` (PK), `search_id` (FK), `source` (enum: e.g. CRAIGSLIST, KIJIJI), `status` (PENDING → PROCESSING → DONE | FAILED), optional `attempts`, optional `error_message`, `updated_at`.

**Behaviour:**

1. When enqueueing work, API creates **one task row per source** (all **PENDING**).
2. Worker for `(search_id S, source X)` finishes scraping: sets that row to **DONE** or **FAILED** after persisting listings.
3. **Scraping phase complete for search S** when every task row for **S** is in a **terminal** state (**DONE** or **FAILED**), and **expected task count** matches (no missing sources).
4. **Then** **only the API** loads **`apartments WHERE search_id = S`**, runs **ScoringService**, updates **`scraping_jobs` / `search_requests`**.

**Policy (locked):** **Partial source failure is allowed.** If some tasks are **FAILED** and others **DONE**, the API **still scores** whatever **`apartments`** exist for **S** and sets the job to **COMPLETED** when there is at least one listing to return. **FAILED** for the overall search applies when **no** usable listings exist after all tasks are terminal (see §12). Optional: include per-source task status or counts in API payloads for debugging and UX.

Optional: **Redis** for shared rate limits across API replicas only; **completion state stays in PostgreSQL** for durability and auditability.

### 4.4 Concurrent searches

- Each search has a unique **`search_id`** (UUID).
- All **`scrape_source_tasks`** and **`apartments`** rows are keyed by **`search_id`**.
- Worker updates **always** filter by **`search_id`** (and **`source`**), so jobs for search **A** never mutate tasks or listings for search **B**.
- **“Done?”** is always evaluated **per `search_id`**: e.g. “all tasks for **this** `search_id` are terminal?” — never global.

## 5\. Data Model

**Search Request**

- id (UUID), user_id (optional / future), priority (enum), max_price, min_sqft, desired_amenities (JSON), max_lease_months, desired_bedrooms, desired_bathrooms (optional), status (PENDING/PROCESSING/COMPLETED/FAILED), created_at, updated_at

**Apartment Listing**

- id (UUID), **search_id (FK, required)** — all listings for a search share this id; scoring query is by `search_id`, not by “latest global”
- source_url, source_site (CRAIGSLIST/KIJIJI/…), price, sqft, bedrooms, bathrooms, amenities (JSON), lease_term_months, image metadata, raw_html (optional / deprioritize), expires_at, created_at

**Scrape source task** _(required for multi-worker / queue architecture)_

- id (UUID), **search_id (FK)**, **source** (enum), **status** (PENDING, PROCESSING, DONE, FAILED), attempts (optional), error_message (optional), created_at, updated_at
- **Purpose:** Orchestration — know when **each source** has finished for **this** search. **Not** replaced by counting apartment rows.

**Job Status (scraping_jobs)**

- id, search_id (FK, unique), status, error_message, total_attempted, total_successful, total_failed, started_at, completed_at, created_at

## 6\. API Specification

**POST /api/v1/search** Request: `{ "priority": "BUDGET", "max_price": 2500, "min_sqft": 800, "desired_amenities": ["in_unit_laundry", "parking"], "max_lease_months": 12 }` Response (202): `{ "search_id": "uuid", "status": "PENDING", "estimated_wait_seconds": 120, "polling_url": "/api/v1/search/uuid/results" }`

**GET /api/v1/search/{search_id}/results** Response (200 when ready): `{ "search_id": "uuid", "status": "COMPLETED", "total_apartments_found": 145, "apartments": [...] }` Response (202 while processing): `{ "search_id": "uuid", "status": "PROCESSING", "estimated_wait_seconds": 45 }`

## 7\. Technology Stack

| Layer          | Technology |
| -------------- | ---------- |
| Frontend       | React + TypeScript |
| API            | Spring Boot (Java 21), Kubernetes Deployment |
| Message Queue  | **RabbitMQ** (AMQP, in-cluster or managed) or **AWS SQS** on AWS |
| Workers        | Spring Boot or JVM-light consumer pods; **KEDA** optional for queue-driven scaling |
| Orchestration  | Kubernetes (DOKS, EKS, kind, etc.) |
| Database       | PostgreSQL (managed RDS/Neon or in-cluster) |
| Scraping       | Jsoup; Selenium if needed |
| Hosting        | **Primary:** local self-hosted Kubernetes + Docker on developer PC; cloud (AWS, DO, etc.) optional later |

## 8\. 2-Month Phasing

**Weeks 1-3 (Foundation):**

- Spring Boot API with basic endpoints
- Queue producer/consumer patterns (RabbitMQ or SQS); `scrape_source_tasks` schema when splitting workers
- PostgreSQL schema and ORM
- Mock scraper with hardcoded data
- Matching algorithm implementation
- Deploy to EKS (2 nodes)

**Weeks 4-5 (Real Scraping):**

- Zillow listings scraper
- Apartments.com scraper
- Error handling and retry logic
- Scale test (500+ listings)

**Weeks 6-7 (Frontend):**

- React search form UI
- Results page with sorting/filtering
- Polling mechanism for async results
- Progress indicator

**Week 8 (Polish & Deploy):**

- End-to-end testing
- Performance testing
- UI refinement
- Production deployment
- Resume documentation

## 9\. Out of Scope for MVP

- Saved searches
- Email notifications (this should come very soon)
- Mobile app
- Distance-based filtering


## 10\. Success Criteria

✅ End-to-end flow works in < 3 minutes
✅ 10-30+ apartments scraped and ranked per search
✅ EKS auto-scaling (2-5 pods)
✅ Zero data loss on failures
✅ API documented
✅ Responsive frontend
✅ Code ready for resume discussion
✅ No hardcoded credentials

## 11\. Security & Authentication

JWT via API Gateway (optional / future):

- API Gateway generates short-lived JWT on first request (24hr expiration)
- JWT includes rate limiting identifier to prevent abuse
- All subsequent API calls require valid JWT in Authorization header

**MVP / current:** Per-IP rate limiting and validation on Spring Boot; CORS and secrets via Kubernetes Secrets.

## 12\. Error Handling & Resilience

**Source-level failures (aligned with §1):**

- If **one source** completes (**DONE**) and **another** ends **FAILED** (or returns zero rows), the search is still **COMPLETED** with **partial results** from successful sources once scoring runs.
- Overall search **FAILED** only when **all** source tasks are terminal **and** there are **no** `apartments` rows for that `search_id` (nothing to show the user).

**Per-listing scrape failures:**

- Individual listing parse failures: Log error, skip listing, continue scraping
- Failed listings do NOT persist to database
- Response may include: `"total_attempted": …, "total_successful": …, "total_failed": …` at listing granularity where implemented

**Queue retry logic (SQS or RabbitMQ):**

- Max 3 retries per message with exponential backoff (30s, 60s, 120s)
- After max failures → **Dead Letter Queue (DLQ)**
- DLQ monitored via CloudWatch / Prometheus alarm

**Scraping best practices:**

- Respect robots.txt
- 2-second delay between requests per domain
- Rotate User-Agent headers
- Timeout after 30s per page load

## 13\. Monitoring & Observability

**Metrics & logs:**

- Application logs: INFO level for successful operations, ERROR for failures
- Metrics: Scrape success rate, average response time, queue depth, scrape-source task completion
- Alarms: DLQ message count >5, API error rate >10%, EKS pod failures

**Health checks:**

- `GET /api/v1/health` — Returns API status + database connectivity
- Kubernetes liveness/readiness probes configured

## 14\. AWS Free Tier Constraints (if using AWS)

- EKS: 2 t3.small nodes max (monitor costs, EKS control plane NOT free)
- RDS: db.t3.micro PostgreSQL (20GB storage)
- CloudWatch: 5GB logs, 10 custom metrics
- SQS: 1M requests/month free tier
- Budget Alert: $10/month threshold with email notification