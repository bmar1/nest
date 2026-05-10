# Audit Remediation Plan

This document captures the required follow-up work from the production audit, grouped by security, deployment correctness, performance, reliability, and maintainability.

## Priority 0 - Immediate Security Fixes

### Remove Plaintext Secrets From Git-Tracked Files

**Problem:** Kubernetes manifests and local config have contained real or real-looking credentials. Even if files are now ignored, anything previously pushed should be treated as exposed.

**Required changes:**

- Rotate all exposed credentials:
  - Cloud SQL / Postgres password.
  - RabbitMQ / CloudAMQP username and password.
  - Any AMQP URLs containing credentials.
- Keep real Kubernetes manifests outside the public repository.
- Commit only sanitized examples if needed, using placeholders such as `CHANGE_ME`.
- Use one of:
  - Google Secret Manager + External Secrets Operator.
  - Sealed Secrets.
  - SOPS-encrypted manifests.
  - CI-created Kubernetes secrets using GitHub Actions environment secrets.

**Files/areas involved:**

- `k8s/api-deployment.yaml` (local/private now)
- `k8s/rabbitmq-deployment.yaml` (local/private now)
- `src/main/resources/application.properties` (gitignored local file)

### Stop Baking Local Secrets Into Docker Images

**Problem:** `Dockerfile` copies `src/` into the image. If `src/main/resources/application.properties` exists locally with real credentials, the built production image may contain those credentials.

**Required changes:**

- Replace local `application.properties` with a safe template-based setup.
- Prefer committed `application.properties.example` with placeholders.
- Use environment variables in production:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - `SPRING_RABBITMQ_HOST`
  - `SPRING_RABBITMQ_USERNAME`
  - `SPRING_RABBITMQ_PASSWORD`
- Add a Docker build guard or `.dockerignore` rule if local properties should never enter images.

**Acceptance check:**

- A production image can be built from a developer machine without including local DB passwords.
- Runtime secrets come only from Kubernetes/GCP secret injection.

## Priority 1 - Correct Runtime Wiring

### Use Spring-Native Datasource Environment Variables

**Problem:** The Kubernetes config has used `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`, but Spring Boot automatically reads `SPRING_DATASOURCE_*`. Unless explicitly mapped, the `DB_*` values may not control the datasource.

**Required changes:**

- In deployment secrets/config, use:
  - `SPRING_DATASOURCE_URL=jdbc:postgresql://HOST:5432/DB_NAME`
  - `SPRING_DATASOURCE_USERNAME=postgres`
  - `SPRING_DATASOURCE_PASSWORD=...`
- Remove or clearly document any unused `DB_*` variables.
- Update worker and API deployments so both read the same DB config.

**Acceptance check:**

- `kubectl exec` or logs confirm the API connects to Cloud SQL, not a baked-in local/Supabase URL.
- API and worker pods connect to the same database.

### Align RabbitMQ Configuration Across API, Workers, And KEDA

**Problem:** API/workers may point to the in-cluster `rabbitmq` service while KEDA reads `RABBITMQ_AMQP_URL`, which has previously pointed to CloudAMQP. That can make workers consume one broker while KEDA scales from another.

**Required changes:**

- Choose one broker for production:
  - In-cluster RabbitMQ, or
  - managed RabbitMQ / CloudAMQP.
- Ensure all three use the same broker:
  - API publisher.
  - Worker consumer.
  - KEDA scaler.
- If using in-cluster RabbitMQ, set:
  - `SPRING_RABBITMQ_HOST=rabbitmq`
  - `SPRING_RABBITMQ_PORT=5672`
  - `RABBITMQ_AMQP_URL=amqp://USER:PASSWORD@rabbitmq.nest.svc.cluster.local:5672/`
- If using managed RabbitMQ, point `SPRING_RABBITMQ_*` and KEDA to the managed host.

**Acceptance check:**

- Publishing a search creates messages in the same queue workers consume.
- KEDA queue depth matches the actual worker queue.

## Priority 2 - Public Edge And Access Control

### Move API Behind HTTPS Ingress/Gateway

**Problem:** The frontend has proxied to a raw HTTP LoadBalancer IP. This avoids browser mixed-content errors but still uses plaintext from Vercel to the backend and couples deployment to a drifting IP.

**Required changes:**

- Use a stable API hostname.
- Terminate TLS through:
  - GKE Ingress,
  - Gateway API,
  - Google Cloud HTTP(S) Load Balancer,
  - or another managed HTTPS edge.
- Update frontend rewrites/API base URL to use HTTPS.
- Prefer `ClusterIP` for internal services once Ingress/Gateway is configured.

**Acceptance check:**

- Frontend calls `https://api-domain/...` or same-origin HTTPS proxy.
- No production traffic uses `http://<raw-ip>:8080`.

### Add Authentication Or Abuse Protection

**Problem:** Search endpoints are public if the API URL is reachable. Rate limiting helps but is not authentication.

**Required changes:**

- Decide whether the product is intentionally anonymous.
- If not anonymous, add one of:
  - Firebase/Auth0/OIDC login.
  - Session-based auth.
  - API key auth for private use.
- Keep `/api/v1/health` public or separately protected depending on deployment needs.

**Acceptance check:**

- Unauthorized clients cannot create expensive scraping jobs.
- Health checks still work for Kubernetes probes.

## Priority 3 - Reliability And Job Semantics

### Define Worker Retry And DLQ Policy

**Problem:** `ScrapeJobConsumer` catches exceptions and marks a task as `FAILED`. This means RabbitMQ will consider the message handled rather than retrying through broker redelivery/DLQ.

**Required changes:**

- Decide failure policy per source:
  - No retry, mark failed immediately.
  - Retry N times with backoff, then mark failed.
  - Broker DLQ for poison messages.
- If retries are desired:
  - Track attempts in `scrape_source_tasks`.
  - Re-throw selected exceptions so Rabbit can nack/retry, or explicitly republish delayed retry messages.
  - Route exhausted jobs to `scrape.jobs.dlq`.

**Acceptance check:**

- A transient source/network error is retried predictably.
- Permanent failures do not block final scoring forever.

### Add Worker Health Checks

**Problem:** Worker pods currently rely mostly on process health. Kubernetes cannot distinguish "JVM is alive" from "worker is connected to required dependencies."

**Required changes:**

- Add Spring Boot Actuator or a custom lightweight worker health endpoint.
- Add `readinessProbe` and `livenessProbe` to the worker deployment.
- Ensure readiness checks do not fail too aggressively during RabbitMQ startup.

**Acceptance check:**

- Rolling updates wait for ready workers.
- Bad worker pods are restarted automatically.

### Use Immutable Image Tags

**Problem:** `latest` tags make deployments and rollbacks ambiguous.

**Required changes:**

- CI should push:
  - `:<git-sha>`
  - optionally `:latest` for convenience only.
- Kubernetes deploy should use the SHA tag.
- Rollback should point to a previous SHA tag.

**Acceptance check:**

- `kubectl describe deployment` shows a specific commit SHA image.
- You can reproduce which code is running in production.

## Priority 4 - Performance And Scaling

### Replace Per-Pod Rate Limiting

**Problem:** Current rate limiting is in-memory per API pod. Effective limits increase as replicas increase, and clearing the map resets all clients.

**Required changes:**

- Use a shared rate limiter backend:
  - Redis,
  - API Gateway / Cloud Armor,
  - or another central policy layer.
- Use a sliding window or token bucket keyed by trusted client identity/IP.
- Ensure `X-Forwarded-For` is trusted only from known proxies.

**Acceptance check:**

- Rate limits are consistent across API replicas.
- Scaling API pods does not multiply allowed scraping requests.

### Tune Scraper Concurrency And Resource Limits

**Problem:** Scraping performs many external HTTP requests and parsing operations. Worker CPU/memory limits must match concurrency and JVM heap.

**Required changes:**

- Load test representative searches.
- Tune:
  - worker replica count,
  - per-worker concurrency,
  - RabbitMQ prefetch,
  - JVM `-Xmx`,
  - pod memory limits,
  - HTTP timeouts.
- Watch for:
  - `OOMKilled`,
  - long GC pauses,
  - RabbitMQ unacked messages,
  - source-site timeouts.

**Acceptance check:**

- A burst of searches drains predictably.
- Workers do not churn under normal load.

### Add Static Asset Caching For Frontend Container

**Problem:** If using the Dockerized frontend/nginx path, static assets should be cached efficiently.

**Required changes:**

- Enable gzip or Brotli if supported.
- Cache hashed Vite assets aggressively.
- Keep `index.html` short-cache or no-cache.

**Acceptance check:**

- Browser reloads do not refetch unchanged static assets unnecessarily.

## Priority 5 - Maintainability

### Split `ScraperService`

**Problem:** `ScraperService` is large and mixes orchestration, source-specific scraping, HTML parsing, deduping, and cache fallback.

**Required changes:**

- Introduce source-specific components:
  - `CraigslistScraper`
  - `KijijiScraper`
  - shared parser/dedupe utilities
- Keep `ScraperService` as orchestration only.
- Preserve current behavior while moving one source at a time.

**Acceptance check:**

- Adding a new source does not require editing an 800-line service.
- Source-specific failures are easier to test.

### Keep Complex Lifecycle Sections Commented

**Problem:** Queue/pub-sub lifecycle code is correct but non-obvious without context.

**Required changes:**

- Keep explanatory comments around:
  - after-commit scheduling,
  - queue vs inline dispatch,
  - one-message-per-source publishing,
  - worker source task transitions,
  - `GET /results` finalization,
  - scoring idempotency/locking.
- Avoid comments that restate obvious code.

**Acceptance check:**

- A reviewer can trace the request lifecycle without external explanation.

### Refresh Documentation After `k8s/` Became Private

**Problem:** Some docs may still point to committed `k8s/` manifests even though that folder is now ignored locally/private.

**Required changes:**

- Update docs to clarify:
  - real manifests are local/private,
  - sanitized examples may be committed later,
  - production secrets must not be stored in Git.
- Optionally add sanitized manifests under `k8s-examples/`.

**Acceptance check:**

- A new developer understands where deployment manifests live and why real ones are not committed.

## Priority 6 - CI/CD Hardening

### Complete GitHub Actions WIF Setup

**Problem:** CI/CD now uses Workload Identity Federation but depends on GitHub variables and GCP IAM bindings.

**Required changes:**

- Set GitHub variables:
  - `GCP_PROJECT_ID`
  - `GCP_REGION`
  - `ARTIFACT_REPOSITORY`
  - `IMAGE_NAME`
  - `GCP_GITHUB_ACTIONS_SA`
  - `GCP_WORKLOAD_IDENTITY_PROVIDER`
- Optional deploy variables:
  - `GKE_CLUSTER_NAME`
  - `GKE_CLUSTER_LOCATION`
  - `K8S_NAMESPACE`
  - `K8S_DEPLOYMENT`
  - `K8S_CONTAINER`
- Grant the GitHub Actions service account:
  - `roles/artifactregistry.writer`
  - `roles/container.developer` if deploying to GKE
- Bind GitHub repo identity to the service account with `roles/iam.workloadIdentityUser`.

**Acceptance check:**

- Pull requests run tests.
- Pushes to `main` build and push a Docker image to Artifact Registry.
- Optional deploy updates the GKE deployment image to the commit SHA tag.

### Run Tests Before Building Production Images

**Problem:** `Dockerfile` uses `-DskipTests`. That is fine only if CI gates builds with tests.

**Required changes:**

- Keep GitHub Actions `mvn test` as a required step before image push.
- Consider branch protection requiring CI to pass before merging to `main`.
- Add integration test job later with a real Postgres service.

**Acceptance check:**

- A failing test blocks image publishing and deployment.

## Suggested Execution Order

1. Rotate exposed secrets and remove all real secret values from committed or image-baked files.
2. Fix datasource env wiring to `SPRING_DATASOURCE_*`.
3. Align RabbitMQ/KEDA broker config.
4. Put API behind HTTPS and remove raw HTTP IP usage.
5. Add CI branch protection and verify WIF-based image push.
6. Add worker retry/DLQ policy.
7. Add worker probes and immutable deploy tags.
8. Replace in-memory rate limiting with shared/global rate limiting.
9. Split `ScraperService` into source-specific components.
10. Refresh docs now that real `k8s/` manifests are private.
