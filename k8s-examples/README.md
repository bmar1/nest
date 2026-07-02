# Kubernetes examples (sanitized)

Real clusters should keep private manifests and secrets out of Git (see `.gitignore` on `k8s/`). These files are **templates**: replace placeholders and wire secrets via Secret Manager / External Secrets / CI-injected secrets.

## Immutable image tags

CI pushes `REGION-docker.pkg.dev/PROJECT/REPO/IMAGE:$GITHUB_SHA` and optionally runs `deploy-gke` so Deployments use that exact SHA (not `:latest`).

## Actuator probes

The app exposes Kubernetes-friendly endpoints when `spring-boot-starter-actuator` is on the classpath:

- **Liveness:** `GET /actuator/health/liveness`
- **Readiness:** `GET /actuator/health/readiness`

Workers (`SPRING_PROFILES_ACTIVE=worker`) load `application-worker.yaml`, which includes **RabbitMQ** in the readiness group. The default API profile does not require a broker for readiness (helps local `scrape.mode=inline`).

For **queue-mode API** pods, you can align readiness with Rabbit using env (Spring relaxed binding), for example:

```yaml
env:

  - name: MANAGEMENT_HEALTH_RABBIT_ENABLED

    value: "true"

  - name: MANAGEMENT_ENDPOINT_HEALTH_GROUP_READINESS_INCLUDE

    value: readinessState,db,rabbit

```

## Scrape jobs: no retries

Application failures mark `scrape_source_tasks` as failed and **ack** the message. The listener container sets `defaultRequeueRejected=false`, so Rabbit does not redeliver to workers for retries. See `RabbitConfig` and `ScrapeJobConsumer`.

## Queue dead-letter exchange

The main queue is still declared with a DLX for **unexpected** poison / reject scenarios (operations visibility), not for application-level retry loops.

## Observability on GCP (profiles + metrics)

### Activate the `gcp` profile

In cluster env (API and worker), append **`gcp`** so logs are JSON for Cloud Logging and Prometheus is served on the **management port 8081** at `/actuator/prometheus` (not on the public API port 8080), for example:

```yaml
env:

  - name: SPRING_PROFILES_ACTIVE

    value: "worker,gcp"
```

API pods might use `gcp` alone or `default,gcp` depending on how you set profiles.

### Logs

With `gcp`, stdout is **JSON** (`severity`, `message`, `logger`, MDC fields). HTTP handling logs one line per request when `nest.logging.http-requests` is true (set in `application-gcp.yaml`). Pass **`X-Request-Id`** from your gateway or clients to correlate; otherwise the app generates one and echoes it on the response.

### Prometheus / GKE Managed Prometheus

1. Enable [Google Cloud Managed Service for Prometheus](https://cloud.google.com/stackdriver/docs/managed-prometheus) on the cluster if needed.
2. Apply a `PodMonitoring` manifest that selects your pods and scrapes **`/actuator/prometheus` on port 8081** (see `k8s-examples/pod-monitoring.yaml` as a template).
3. Restrict exposure: do **not** route port 8081 or `/actuator/prometheus` on a public ingress; rely on in-cluster scrape or network policy. Spring Security denies `/actuator/prometheus` on port 8080.

### Custom metric: scrape queue depth

When `scrape.mode=queue` and Rabbit is configured, the app exports **`nest_rabbit_scrape_queue_messages_ready`** (Prometheus name; dots become underscores) with tag `queue`. Use it for backlog alerts.

### Suggested Cloud Monitoring alerts

| Goal | What to alert on |
|------|------------------|
| High queue backlog | PromQL / GMP: `nest_rabbit_scrape_queue_messages_ready` above your SLO (e.g. > 200 for 10m). Only available when queue mode + Rabbit + scraping runs. |
| High CPU (container) | Use built-in **GKE Container** metrics, e.g. `kubernetes.io/container/cpu/limit_utilization` > 0.85 for 5m on your deployment’s container. Works for API and worker without app changes. |
| High error rate | Logs-based: log `severity>=ERROR` rate, or HTTP 5xx from ingress if you terminate TLS there. |

Create alerts in **Google Cloud Console → Monitoring → Alerting** using Metrics Explorer, MQL, or PromQL (GMP).
