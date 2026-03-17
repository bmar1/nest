# <img src="\src\nestapp-frontend\nestapp\public\nest-logo-transparent-cropped.png" alt="Icon" width="35" height="35"> Nest

**Find your dream home cheaper & faster and without the hassle.**

Nest is an apartment search platform that scrapes live listings, reuses fresh cached listings from PostgreSQL, deduplicates results across sources, and ranks apartments based on your priorities instead of generic sort order. Tell Nest what matters most, and it returns scored results with source links, images, and transparent score breakdowns.

## 📋 Features

- **Priority-Based Matching**: Choose `BUDGET`, `SPACE`, `AMENITIES`, or `BALANCED`
- **Multi-Source Search**: Pulls listings from `Craigslist Toronto` and `Kijiji`
- **Smart Scoring Algorithm**: 0-100 score based on price, space, amenities, and lease flexibility
- **Fresh Listing Cache**: Reuses non-expired listings stored in PostgreSQL for faster follow-up searches
- **Deduped Results**: Merges live + cached listings and removes duplicates before scoring
- **Real Listing Images**: Returns real source images when available and shows them in the results UI
- **Docker Support**: Full containerization with Docker Compose for local development,
- 
## 🏗️ Architecture

```
React Frontend → Spring Boot REST API → PostgreSQL

Search flow:
1. Frontend submits a search request
2. Backend asynchronously scrapes live sources
3. Backend pulls fresh non-expired cached listings from PostgreSQL
4. Listings are normalized, deduplicated, filtered, and scored
5. Frontend polls for results and renders ranked cards with score explanations
```

**Tech Stack**:
- Backend: Spring Boot 4.0.2 (Java 21)
- Frontend: React 19 + TypeScript + Vite
- Database: PostgreSQL 16
- Scraping: Jsoup
- Live Sources: Craigslist Toronto + Kijiji
- Deployment: Docker + Kubernetes (DOKS)

## 🚀 Quick Start

### Prerequisites

- Java 21+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker Compose)

### Local Development with Docker Compose

```bash
# Start all services in the background
docker compose up -d --build

# Check container status
docker compose ps

# Tail logs
docker compose logs -f api
docker compose logs -f frontend
docker compose logs -f postgres

# Stop everything
docker compose down
```

**Services**
- Frontend: `http://localhost`
- API: `http://localhost:8080`
- Health check: `http://localhost:8080/api/v1/health`
- PostgreSQL: `localhost:5432`

**Default local database credentials**
- Database: `nest`
- Username: `postgres`
- Password: `postgres`

**Useful reset**
```bash
# Rebuild the stack and recreate the Docker network
docker compose down
docker compose up -d --build
```

### Local Development (Manual)

**1. Start PostgreSQL**

```bash
docker run -d \
  --name nest-postgres \
  -e POSTGRES_DB=nest \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

**2. Run Spring Boot API**

```bash
# Build and run
./mvnw spring-boot:run

# Or with custom DB config
DB_HOST=localhost DB_PORT=5432 DB_NAME=nest DB_USER=postgres DB_PASSWORD=postgres ./mvnw spring-boot:run
```

**3. Run React Frontend**

```bash
cd src/nestapp-frontend/nestapp
npm install
npm run dev
```

Navigate to `http://localhost:5173`



### Data Sources and Freshness

- **Live source 1:** `Craigslist Toronto`
- **Live source 2:** `Kijiji`
- **Fast source 3:** recently stored PostgreSQL listings that have **not expired**
- Cached listings currently get an `expires_at` timestamp and are reused while still fresh
- Live + cached results are merged and deduplicated before scoring

## 🧮 Scoring Algorithm

### Score Components (0-100 total)

- **Price Score** (0-30 pts): Lower price is better
  - Formula: `(maxPrice - apartmentPrice) / (maxPrice - minPrice) * 30`

- **Space Score** (0-30 pts): More square footage is better
  - Formula: `(apartmentSqft - minSqft) / (maxSqft - minSqft) * 30`

- **Amenities Score** (0-20 pts):
  - In-unit laundry: 10 pts
  - Parking: 5 pts
  - Gym: 3 pts
  - Other amenities: 2 pts each (capped at 20)

- **Lease Flexibility Score** (0-20 pts):
  - Month-to-month: 20 pts
  - 6-month: 15 pts
  - 12-month: 10 pts
  - 12+ months: 5 pts

### Priority Weight Multipliers

| Priority   | Price | Space | Amenities | Lease |
|------------|-------|-------|-----------|-------|
| BUDGET     | 1.5x  | 0.8x  | 0.8x      | 0.9x  |
| SPACE      | 0.8x  | 1.5x  | 0.8x      | 0.9x  |
| AMENITIES  | 0.9x  | 0.9x  | 1.5x      | 0.9x  |
| BALANCED   | 1.0x  | 1.0x  | 1.0x      | 1.0x  |

## ☸️ Kubernetes Deployment

See [`k8s/README.md`](k8s/README.md) for detailed deployment instructions to DigitalOcean Kubernetes.

**Quick Deploy:**

```bash
# Build and push images
docker build -t yourusername/nest-api:latest .
docker push yourusername/nest-api:latest

cd src/nestapp-frontend/nestapp
docker build -t yourusername/nest-frontend:latest .
docker push yourusername/nest-frontend:latest

# Deploy to K8s
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

## 📁 Project Structure

```
nestapp/
├── src/
│   ├── main/java/com/nest/nestapp/
│   │   ├── controller/         # REST API controllers
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── model/              # JPA entities
│   │   ├── repository/         # JPA repositories
│   │   └── service/            # Business logic
│   ├── main/resources/
│   │   ├── db/migration/       # Flyway SQL migrations
│   │   └── application.yml     # Spring Boot config
│   ├── nestapp-frontend/nestapp/
│   │   └── src/
│   │       ├── components/     # React components
│   │       └── App.tsx         # Main React app
│   └── test/                   # Unit & integration tests
├── k8s/                        # Kubernetes manifests
├── Dockerfile                  # Backend Docker image
├── docker-compose.yml          # Local dev environment
└── pom.xml                     # Maven dependencies
```



## 🗄️ Persistence Notes

- Listings are stored in PostgreSQL after scraping
- Listings include source metadata, raw HTML, expiry timestamps, and image data when available
- Cached listings are reused for future searches while they are still fresh
- Apartment scores are stored per search so result polling is fast once scoring completes

## 📝 Development Guidelines

See [`agent/CODESTYLE.md`](agent/CODESTYLE.md) for coding standards.

**Key Principles:**
- Functions under 80 lines
- Single responsibility per class/method
- No more than 4 parameters per function
- Comprehensive error handling
- 90%+ test coverage for business logic

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow CODESTYLE.md guidelines
4. Write tests for new features
5. Submit a pull request

## 📧 Contact

Built with ☕, late nights, a deep hatred for apartment hunting, and a little help from Cursor Agent.

For questions or issues, please open a GitHub issue.
