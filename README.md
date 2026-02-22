# 🏡 Nest
### Stop scrolling. Find the best apartment!

## What It Does
Nest is an intelligent apartment search platform that scrapes multiple rental listing sites, aggregates results, and ranks apartments based on your priorities, not generic algorithms. Tell us what matters (budget, space, amenities, or a balanced approach), and we deliver scored results in under 3 minutes.

No more juggling 47 browser tabs. No more manual spreadsheets. Just your top matches, ranked 0-100.

## Key Features
Priority-Based Matching
Users select one focus area (Budget, Space, Amenities, or Balanced), and apartments are scored using weighted algorithms that reflect what actually matters to them.

### Real-Time Scraping
Kubernetes workers scrape live listings from multiple platforms (Zillow, Apartments.com) simultaneously, pulling fresh data on every search.

### Smart Scoring Algorithm
Each apartment receives a 0-100 score calculated from:

Price Score (0-30 pts): Lower is better, relative to user's max budget
Space Score (0-30 pts): Bigger is better, relative to user's minimum
Amenities Score (0-20 pts): In-unit laundry, parking, gym, etc.
Lease Flexibility Score (0-20 pts): Month-to-month > 12-month leases

Scores are multiplied by priority weights (e.g., Budget Focused = 1.5x price weight).

### Async Processing

Searches are queued in SQS, processed asynchronously by EKS workers, and polled via REST API—no blocking, no timeouts.

Transparent Results

Users see exactly why an apartment scored high: match percentage, amenity breakdowns, and comparable listings.

## Quick Start to run Locally
Prerequisites

AWS Account (with EKS, RDS, SQS access)
Docker installed locally
kubectl configured for EKS cluster
Node.js 18+ (for frontend)
Java 17+ (for Spring Boot backend)
PostgreSQL client (for local DB testing)

1. Clone the Repository
bashgit clone https://github.com/bmar1/nest.git
cd nest
1. Set Up Infrastructure (AWS)
Create RDS PostgreSQL Instance
bashaws rds create-db-instance \
  --db-instance-identifier nest-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <YOUR_PASSWORD> \
  --allocated-storage 20
Create SQS Queue
bashaws sqs create-queue --queue-name nest-scraping-queue
aws sqs create-queue --queue-name nest-scraping-dlq
Create EKS Cluster
basheksctl create cluster \
  --name nest-cluster \
  --region us-east-1 \
  --nodegroup-name nest-workers \
  --node-type t3.small \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 5
1. Configure Environment Variables
Create backend/.env:
envDB_HOST=<RDS_ENDPOINT>
DB_PORT=5432
DB_NAME=nest
DB_USER=admin
DB_PASSWORD=<YOUR_PASSWORD>

SQS_QUEUE_URL=<YOUR_SQS_QUEUE_URL>
AWS_REGION=us-east-1

JWT_SECRET=<GENERATE_RANDOM_SECRET>
4. Build & Deploy Backend
Build Docker Image
bashcd backend
docker build -t nest-api:latest .
docker tag nest-api:latest <YOUR_ECR_REPO>/nest-api:latest
docker push <YOUR_ECR_REPO>/nest-api:latest
Deploy to EKS
bashkubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl apply -f k8s/service.yaml
Run Database Migrations
bashkubectl exec -it <API_POD_NAME> -- ./gradlew flywayMigrate
5. Run Frontend Locally
bashcd frontend
npm install
npm run dev
Visit http://localhost:5173
6. Test End-to-End
bashcurl -X POST http://<API_GATEWAY_URL>/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "BUDGET",
    "max_price": 2500,
    "min_sqft": 800,
    "desired_amenities": ["in_unit_laundry", "parking"],
    "max_lease_months": 12
  }'
Poll for results:
bashcurl http://<API_GATEWAY_URL>/api/v1/search/<SEARCH_ID>/results

---

### Flow:
1. **User submits search** → React app calls API Gateway
2. **API Gateway** → Validates JWT, forwards to Spring Boot API in EKS
3. **Spring Boot API** → Publishes job to SQS, returns `search_id`
4. **Worker Pods** → Consume SQS messages, scrape sites (Jsoup/Selenium)
5. **Workers** → Parse listings, calculate scores, store in PostgreSQL
6. **User polls API** → GET `/search/{id}/results` returns ranked apartments
7. **Frontend** → Displays results with scores, amenities, and links

---

## Tech Stack

### Frontend
| Layer        | Technology         |
|--------------|--------------------|
| Framework    | React 18           |
| Language     | TypeScript         |
| Styling      | Tailwind CSS       |
| Icons        | Lucide React       |
| Build Tool   | Vite               |
| Hosting      | Netlify            |

### Backend
| Layer           | Technology              |
|-----------------|-------------------------|
| Framework       | Spring Boot 3.2         |
| Language        | Java 17                 |
| ORM             | JPA (Hibernate)         |
| Validation      | Hibernate Validator     |
| Testing         | JUnit 5, Mockito        |
| Scraping        | Jsoup, Selenium         |
| Containerization| Docker                  |

### Infrastructure
| Service         | Technology              |
|-----------------|-------------------------|
| Orchestration   | Amazon EKS (Kubernetes) |
| Message Queue   | Amazon SQS              |
| Database        | RDS PostgreSQL          |
| API Gateway     | AWS API Gateway         |
| Monitoring      | CloudWatch              |
| Secrets         | AWS Secrets Manager     |

---

Contributing

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit changes (git commit -m 'Add amazing feature')
Push to branch (git push origin feature/amazing-feature)
Open a Pull Request

Acknowledgments

Apartment hunters everywhere who inspired this project
Anthropic for Claude (used to refine design patterns)
Spring Boot & React communities for amazing documentation

Built with ☕, late nights, and a deep hatred for apartment hunting.
