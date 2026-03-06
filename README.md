# 🏡 Nest

**Stop scrolling. Start scoring.**

Nest is an intelligent apartment search platform that scrapes Craigslist Toronto (soon to be other websites), aggregates listings, and ranks apartments based on your priorities—not generic algorithms. Tell us what matters (Budget, Space, Amenities, or Balanced), and we deliver scored results.

## 📋 Features

- **Priority-Based Matching**: Choose Budget/Space/Amenities/Balanced priority
- **Smart Scoring Algorithm**: 0-100 score based on price, space, amenities, and lease flexibility
- **Microservices Architecture**: Spring Boot REST API + React frontend
- **Kubernetes-Ready**: Deploy to DigitalOcean Kubernetes with included manifests
- **Docker Support**: Full containerization with Docker Compose for local development

## 🏗️ Architecture

```
React Frontend → Spring Boot REST API → PostgreSQL
```

**Tech Stack**:
- Backend: Spring Boot 4.0.2 (Java 21)
- Frontend: React 19 + TypeScript + Vite
- Database: PostgreSQL 16
- Scraping: Jsoup
- Deployment: Docker + Kubernetes (DOKS)

## 🚀 Quick Start

### Prerequisites

- Java 21+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker Compose)

### Local Development with Docker Compose

```bash
# Start all services (PostgreSQL + API + Frontend)
docker-compose up --build

# Access the application
# Frontend: http://localhost
# API: http://localhost:8080
# Health check: http://localhost:8080/api/v1/health
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

Navigate to http://localhost:5173

## 📊 API Endpoints

### POST `/api/v1/search`

Create a new apartment search.

**Request:**
```json
{
  "priority": "BUDGET",
  "maxPrice": 2500,
  "minSqft": 800,
  "desiredAmenities": ["laundry", "parking"],
  "maxLeaseMonths": 12
}
```

**Response (202 Accepted):**
```json
{
  "searchId": "uuid",
  "status": "PENDING",
  "pollingUrl": "/api/v1/search/{uuid}/results",
  "estimatedWaitSeconds": 120
}
```

### GET `/api/v1/search/{searchId}/results`

Poll for search results.

**Response (200 OK - when completed):**
```json
{
  "searchId": "uuid",
  "status": "COMPLETED",
  "totalApartmentsFound": 50,
  "apartments": [
    {
      "id": "uuid",
      "title": "Modern 2BR in Downtown",
      "price": 2000,
      "sqft": 950,
      "bedrooms": 2,
      "amenities": ["laundry", "parking"],
      "finalScore": 87.5,
      "scoreBreakdown": {
        "priceScore": 25.0,
        "spaceScore": 22.5,
        "amenitiesScore": 15.0,
        "leaseScore": 10.0
      },
      "sourceUrl": "https://toronto.craigslist.org/..."
    }
  ]
}
```

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

## 🧪 Testing

```bash
# Run all tests
./mvnw test

# Run with coverage
./mvnw test jacoco:report

# View coverage report
open target/site/jacoco/index.html
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

## 🔧 Environment Variables

| Variable      | Description              | Default       |
|---------------|--------------------------|---------------|
| DB_HOST       | PostgreSQL hostname      | localhost     |
| DB_PORT       | PostgreSQL port          | 5432          |
| DB_NAME       | Database name            | nest          |
| DB_USER       | Database username        | postgres      |
| DB_PASSWORD   | Database password        | postgres      |

## 📝 Development Guidelines

See [`agent/CODESTYLE.md`](agent/CODESTYLE.md) for coding standards.

**Key Principles:**
- Functions under 80 lines
- Single responsibility per class/method
- No more than 4 parameters per function
- Comprehensive error handling
- 90%+ test coverage for business logic

## 🎯 Roadmap

- [x] Database schema with Flyway migrations
- [x] REST API endpoints
- [x] Scoring algorithm implementation
- [x] React frontend with Tailwind CSS
- [x] Docker & Docker Compose setup
- [x] Kubernetes manifests
- [ ] Craigslist scraper implementation
- [ ] RabbitMQ async job processing
- [ ] Email notifications
- [ ] User authentication (JWT)
- [ ] Saved searches
- [ ] CI/CD pipeline (GitHub Actions)

## 💰 Cost Optimization

**DigitalOcean Kubernetes:**
- 2-node cluster (2GB RAM/node): $24/month
- Managed PostgreSQL (smallest tier): $15/month
- Total: ~$39/month

**Free Tier Alternative:**
- Use local Kubernetes (minikube/Docker Desktop) for development
- Deploy to DOKS only for demos/production

## 📄 License

MIT License - see LICENSE for details.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow CODESTYLE.md guidelines
4. Write tests for new features
5. Submit a pull request

## 📧 Contact

Built with ☕, late nights, and a deep hatred for apartment hunting.

For questions or issues, please open a GitHub issue.
