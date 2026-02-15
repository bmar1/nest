# Product Requirements Document: ApartmentFinder MVP

**Project Name:** *Nest*
**Version:** 1.0 (MVP)
**Timeline:** 2 months

## 1\. Overview

Nest is a web application that scrapes apartment listings from rental websites, aggregates them, and recommends the best apartments based on user-defined priorities. The MVP focuses on delivering core functionality with a scalable architecture using Kubernetes (EKS) from day one.

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

```
React Frontend → API Gateway → Spring Boot REST API → SQS Queue → EKS Cluster → RDS/PostgreSQL
```

**API Gateway:** Rate limiting (100 req/min), request validation, JWT

**Spring Boot API:** Receives search → validates input → publishes to SQS → polls database for results, then returns final ranks based on points

**SQS Queue:** Stores job requests with unique job IDs for idempotency and retry logic

**EKS Worker Pods:** Consume SQS messages, scrape listings, parse data, calculate scores, store in database

**PostgreSQL:** Stores apartments, job status, search requests, and user-apartment-scores

## 5\. Data Model

**Search Request**

- id (UUID), user_id, priority (enum), max_price, min_sqft, desired_amenities (JSON), max_lease_months, status (PENDING/PROCESSING/COMPLETED/FAILED), created_at

**Apartment Listing**

- id, search_id (FK), source_url, source_site (ZILLOW/APARTMENTS_COM), price, sqft, amenities (JSON), lease_term_months, match_score, created_at

**Job Status**

- id, search_id (FK), status, error_message, started_at, completed_at

## 6\. API Specification

**POST /api/v1/search** Request: `{ "priority": "BUDGET", "max_price": 2500, "min_sqft": 800, "desired_amenities": ["in_unit_laundry", "parking"], "max_lease_months": 12 }` Response (202): `{ "search_id": "uuid", "status": "PENDING", "estimated_wait_seconds": 120, "polling_url": "/api/v1/search/uuid/results" }`

**GET /api/v1/search/{search_id}/results** Response (200 when ready): `{ "search_id": "uuid", "status": "COMPLETED", "total_apartments_found": 145, "apartments": [...] }` Response (202 while processing): `{ "search_id": "uuid", "status": "PROCESSING", "estimated_wait_seconds": 45 }`

## 7\. Technology Stack

| Layer         | Technology         |
| ------------- | ------------------ |
| Frontend      | React + TypeScript |
| API           | Spring Boot 3.x on EKS   |
| Message Queue | AWS SQS            |
| Orchestration | Amazon EKS         |
| Database      | RDS PostgreSQL     |
| Scraping      | Jsoup / Selenium   |
| Hosting       | AWS                |

## 8\. 2-Month Phasing

**Weeks 1-3 (Foundation):**

- Spring Boot API with basic endpoints
- SQS producer/consumer patterns
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

Section 11: Security & Authentication
JWT via API Gateway:

API Gateway generates short-lived JWT on first request (24hr expiration)
JWT includes rate limiting identifier to prevent abuse
All subsequent API calls require valid JWT in Authorization header

Section 12: Error Handling & Resilience
Scraping Failures:

Individual listing parse failures: Log error, skip listing, continue scraping
Failed listings do NOT persist to database
Search completes with partial results if ≥10 apartments successfully scraped
Search marked as FAILED if <10 apartments scraped successfully
Response includes: "total_attempted": 150, "total_successful": 145, "total_failed": 5

SQS Retry Logic:

Max 3 retries per job with exponential backoff (30s, 60s, 120s)
After 3 failures → move to Dead Letter Queue (DLQ)
DLQ monitored via CloudWatch alarm

Scraping Best Practices:

Respect robots.txt
2-second delay between requests per domain
Rotate User-Agent headers
Timeout after 30s per page load

Section 13: Monitoring & Observability
CloudWatch Integration:

Application logs: INFO level for successful operations, ERROR for failures
Metrics: Scrape success rate, average response time, queue depth
Alarms: DLQ message count >5, API error rate >10%, EKS pod failures

Health Checks:

GET /api/v1/health - Returns API status + database connectivity
Kubernetes liveness/readiness probes configured

Section 14: AWS Free Tier Constraints

EKS: 2 t3.small nodes max (monitor costs, EKS control plane NOT free)
RDS: db.t3.micro PostgreSQL (20GB storage)
CloudWatch: 5GB logs, 10 custom metrics
SQS: 1M requests/month free tier
Budget Alert: $10/month threshold with email notification