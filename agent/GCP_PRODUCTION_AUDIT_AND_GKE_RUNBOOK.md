# Nest Production Audit + GKE Runbook

Date: 2026-04-24
Scope audited: current Spring Boot API, scraping flow, database config, Kubernetes manifests, and deployment docs.

---

## Executive verdict

The codebase is **not production-ready yet** for the scaled architecture in `agent/PRD.md`.

Core product flow works for MVP/local environments, but there are critical blockers for safe production rollout:

1. secrets are committed in source,
2. Kubernetes readiness/liveness probe path does not match the actual health endpoint,
3. worker + RabbitMQ split is not implemented in code yet (current scraping is still in API process),
4. environment variables in manifests are not currently wired into Spring datasource config,
5. rate limiting is in-memory per pod and not cluster-consistent.

---

## Audit findings (prioritized)

## Critical

- Hardcoded production credentials in `src/main/resources/application.properties`
  - `spring.datasource.url` and `spring.datasource.password` are committed.
  - Risk: credential leakage, unauthorized DB access, emergency rotation required.
  - Production expectation: inject all secrets via Kubernetes Secret / Secret Manager only.

- Health probe path mismatch in `k8s/api-deployment.yaml`
  - Probes target `/api/v1/health`.
  - Actual health controller route is `GET /` in `src/main/java/com/nest/nestapp/controller/HealthController.java`.
  - Risk: pods can fail readiness/liveness checks and flap/restart.

- Scaled architecture (RabbitMQ + detached workers) not implemented yet
  - `SearchService.processSearchAsync(...)` still calls `scraperService.scrapeApartments(...)` directly.
  - No queue producer, no queue consumer worker app, no `scrape_source_tasks` table/entity/repository/service wiring yet.
  - Risk: cannot satisfy production scaling/reliability behavior described in PRD sections 4.1-4.4.

## High

- Runtime config mismatch: k8s env vars are currently unused
  - `k8s/api-deployment.yaml` sets `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`.
  - `application.properties` currently uses a hardcoded JDBC URL and password, not `${DB_*}` assembly.
  - Risk: changing k8s config may not affect the running app as expected.

- In-memory rate limiting is per-pod only (`RateLimitingFilter`)
  - Buckets are stored in each pod memory and reset on restart.
  - With multiple API replicas behind a load balancer, effective limits are inconsistent.
  - Risk: uneven throttling and abuse control drift across replicas.

- Ingress/TLS setup is incomplete for production
  - `k8s/ingress.yaml` has no `spec.tls` block and uses placeholder host.
  - Annotation assumes NGINX + cert-manager; GKE production usually needs GKE ingress class and managed certificate flow.
  - Risk: unclear HTTPS production posture.

## Medium

- Test reliability gap
  - Unit tests exist, but integration test is disabled (`NestappApplicationTests`).
  - Local Maven test execution failed in this environment (`NoClassDefFoundError: org/apache/commons/cli/ParseException`), so test signal is currently blocked.

- Job orchestration semantics differ from PRD target
  - Current job status is single `scraping_jobs` row with monolithic completion.
  - No durable per-source terminal tracking (`DONE/FAILED` per source) yet.

- Operational hardening missing
  - No HPA/KEDA manifests, no PodDisruptionBudget, no NetworkPolicy, no explicit non-root security context, no externalized structured metrics/tracing.

---

## What "good production state" should look like

Before go-live, minimum acceptance criteria:

- All secrets removed from git history and provided only via secret manager / Kubernetes secret references.
- API probes correctly check a stable health endpoint.
- Queue-based architecture implemented:
  - API publishes per-source scrape tasks to RabbitMQ.
  - Workers consume/ack tasks and update per-source task rows.
  - API scoring runs only when all tasks for a search become terminal.
- Shared rate-limiting strategy across replicas (Redis, gateway limits, or managed edge).
- CI/CD pipeline builds image, runs tests, scans image, deploys to GKE with rollback support.

---

## GKE deployment plan

This section describes a practical path to deploy:
1) full backend API,
2) detached scraper worker,
3) RabbitMQ setup.

### Phase 0 - Prerequisites

- GCP project with billing enabled.
- GKE cluster (Autopilot or Standard) in target region.
- Artifact Registry Docker repo in same region.
- Domain + DNS if exposing public HTTPS ingress.
- Cloud SQL Postgres (recommended) or Supabase (temporary option).

### Phase 1 - Backend API (Spring Boot) deployment

1. **Externalize configuration**
   - Replace hardcoded datasource settings with environment-driven values:
     - `SPRING_DATASOURCE_URL`
     - `SPRING_DATASOURCE_USERNAME`
     - `SPRING_DATASOURCE_PASSWORD`
   - Keep per-environment values outside code.

2. **Health endpoint alignment**
   - Either:
     - update probes to `/`, or
     - add `/api/v1/health` controller endpoint and point probes there.

3. **Build and publish image**
   - Build API image and push to Artifact Registry.
   - Use immutable tags (git SHA), avoid `latest`.

4. **Deploy API to GKE**
   - `Deployment` with at least 2 replicas.
   - Resource requests/limits.
   - Readiness + liveness probes.
   - Secret/config injection from Kubernetes Secret and ConfigMap.

5. **Expose API**
   - Service type `ClusterIP`.
   - GKE ingress/gateway for external routing and TLS.

6. **Autoscaling**
   - Add HPA for API (CPU and/or request latency target).

### Phase 2 - Detach `ScraperService` into worker

**Implemented shape:** keep Phase 1 safe by default with `SCRAPE_MODE=inline`. Queue mode is enabled only after `rabbitmq-deployment.yaml` is healthy and worker pods are ready.

1. **Introduce queue contracts**
   - `ScrapeJobMessage` carries `searchId`, `source`, search filters, and `correlationId`.
   - API publishes one message per enabled source when `SCRAPE_MODE=queue`.

2. **Add durable per-source orchestration table**
   - `scrape_source_tasks` tracks `search_id`, `source`, `status`, `attempts`, `error_message`, timestamps.
   - Status lifecycle: `PENDING -> PROCESSING -> DONE | FAILED`.
   - Completion remains authoritative in PostgreSQL.

3. **Refactor API behavior**
   - `POST /search`:
     - create search + scraping_job + source task rows,
     - in `inline` mode: preserve existing async API scraping fallback,
     - in `queue` mode: publish one RabbitMQ message per source,
     - return 202.
   - `GET /results`:
     - check whether all `scrape_source_tasks` for the search are terminal,
     - if terminal and not yet scored: run scoring once (single-writer guard),
     - return 200 terminal result or 202 processing.

4. **Create worker app/module**
   - Separate worker deployment/process (can share codebase with different entrypoint/profile).
   - Worker consumes queue messages.
   - For each message:
     - scrape one source,
     - insert apartments with `search_id`,
     - update corresponding source task row to `DONE` or `FAILED`,
     - ack/nack appropriately.

5. **Scale workers**
   - Start with fixed replica count.
   - Add `k8s/worker-keda.yaml` after KEDA is installed to scale on RabbitMQ queue depth.

**Queue-mode rollout commands (after image is pushed):**

```bash
kubectl apply -f k8s/rabbitmq-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl patch configmap api-config -n nest --type merge -p '{"data":{"SCRAPE_MODE":"queue"}}'
kubectl rollout restart deployment nest-api -n nest
kubectl scale deployment nest-worker --replicas=2 -n nest
```

**Rollback:**

```bash
kubectl patch configmap api-config -n nest --type merge -p '{"data":{"SCRAPE_MODE":"inline"}}'
kubectl rollout restart deployment nest-api -n nest
kubectl scale deployment nest-worker --replicas=0 -n nest
```

### Phase 3 - RabbitMQ on GKE

Choose one:

- **Option A (faster managed ops):** hosted AMQP provider.
- **Option B (in-cluster):** `k8s/rabbitmq-deployment.yaml` for MVP, then Helm/operator for stronger HA later.

Recommended in-cluster setup steps:

1. Create RabbitMQ namespace/resources.
2. Install RabbitMQ with persistence (PVC), memory/disk limits, and auth secret.
3. Create exchanges/queues/bindings:
   - e.g. `scrape.jobs` exchange
   - per-source or shared queue (with routing keys)
   - dead-letter exchange/queue for failed retries.
4. Configure API producer + worker consumer creds via secrets.
5. Add retry policy:
   - max attempts (e.g. 3),
   - backoff delays,
   - DLQ for poison messages.
6. Monitor queue depth, consumer lag, dead-letter counts.

---

## Suggested execution order (low-risk)

1. Fix secrets + runtime config injection.
2. Fix health endpoint/probes.
3. Add RabbitMQ and queue producer/consumer skeleton.
4. Add `scrape_source_tasks` + completion logic in `GET /results`.
5. Move scraping from API to worker fully.
6. Add HPA/KEDA + observability.
7. Load test and failure drills (source failure, broker outage, DB failover).
8. Production cutover with rollback plan.

---

## Concrete to-do checklist

- [ ] Remove DB credentials from `application.properties` and rotate compromised credentials.
- [ ] Update Spring config to consume env vars/secrets.
- [ ] Correct probe endpoint mismatch.
- [ ] Implement RabbitMQ producer in API.
- [ ] Implement worker consumer deployment.
- [ ] Add `scrape_source_tasks` migration + repository + service logic.
- [ ] Implement on-demand scoring guard for multi-replica API safety.
- [ ] Add KEDA worker autoscaling from RabbitMQ queue depth.
- [ ] Add shared/distributed rate limiting strategy.
- [ ] Add production ingress TLS configuration for GKE.
- [ ] Add CI test/build/deploy pipeline and smoke tests.

---

## Notes

- This audit is based on repository state at the time of review.
- It intentionally focuses on production readiness and architectural alignment with `agent/PRD.md` (Google Cloud + GKE + worker split).
