# Kubernetes Deployment Guide for Nest

This directory holds manifests for a **namespace-scoped** deploy: **API**, **frontend**, **Postgres** (optional if you use managed DB), and **Ingress**. You can run the same YAML on **local** (kind, k3s, Docker Desktop), **Google Kubernetes Engine (GKE)** (reference for production in the PRD), or **other** managed Kubernetes (DigitalOcean, EKS, AKS).

**Reference stack (see `agent/PRD.md` §4, §7):** **GKE** for workloads, **Cloud SQL for PostgreSQL** for production data, **Artifact Registry** for images, **RabbitMQ** in-cluster (add manifests when splitting workers) or managed AMQP, **HTTPS** via **GKE Ingress** with Google Cloud **HTTP(S) Load Balancing**. Secrets: **Google Secret Manager** + **GKE Workload Identity** in production; **Kubernetes `Secret`** for local dev.

---

## Prerequisites (all targets)

- `kubectl` configured against your cluster
- `docker` (or Cloud Build) to build and push images
- An image registry the cluster can pull from

---

## Option A: Google Kubernetes Engine (GKE) — reference

### 1. Create a GKE cluster

Use **gcloud** (install [Google Cloud SDK](https://cloud.google.com/sdk)). Pick a **region** near you (e.g. `northamerica-northeast1` for Toronto area).

**Autopilot** (simpler operations; billed per pod):

```bash
gcloud container clusters create-auto nest-cluster \
  --region=northamerica-northeast1 \
  --project=YOUR_GCP_PROJECT_ID
```

**Standard** (you manage node pools):

```bash
gcloud container clusters create nest-cluster \
  --region=northamerica-northeast1 \
  --num-nodes=2 \
  --machine-type=e2-medium \
  --project=YOUR_GCP_PROJECT_ID
```

Get credentials:

```bash
gcloud container clusters get-credentials nest-cluster \
  --region=northamerica-northeast1 \
  --project=YOUR_GCP_PROJECT_ID
```

### 2. Build and push images to Artifact Registry

Create a repository once (e.g. `docker` format in the same region as GKE):

```bash
gcloud artifacts repositories create nest \
  --repository-format=docker \
  --location=northamerica-northeast1 \
  --project=YOUR_GCP_PROJECT_ID
```

Configure Docker auth:

```bash
gcloud auth configure-docker northamerica-northeast1-docker.pkg.dev
```

Build and tag (example host — replace with your project and region):

```bash
REGISTRY="northamerica-northeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/nest"
docker build -t "${REGISTRY}/nest-api:latest" .
docker push "${REGISTRY}/nest-api:latest"

cd src/nestapp-frontend/nestapp
docker build -t "${REGISTRY}/nest-frontend:latest" .
docker push "${REGISTRY}/nest-frontend:latest"
```

Update `k8s/api-deployment.yaml` and `k8s/frontend-deployment.yaml` to use the **Artifact Registry** image URLs above instead of `YOUR_DOCKERHUB_USERNAME/...`.

### 3. PostgreSQL on Google Cloud (recommended for production)

Create **Cloud SQL for PostgreSQL** in the same project; use **private IP** in the same VPC as GKE, or the **Cloud SQL Auth Proxy** sidecar. Update your API **ConfigMap** / **Secret** with `DB_HOST` (instance connection name or private IP), `DB_USER`, and password from **Secret Manager** or a Kubernetes `Secret`. **Skip** `k8s/postgres-deployment.yaml` when using Cloud SQL.

### 4. Deploy manifests

```bash
kubectl apply -f k8s/namespace.yaml
# kubectl apply -f k8s/postgres-deployment.yaml   # omit if using Cloud SQL
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
# kubectl apply -f k8s/worker-deployment.yaml      # template only; replicas=0 by default
# kubectl apply -f k8s/ingress.yaml              # when DNS + GKE Ingress are ready
```

For **HTTPS** and a stable URL, reserve a static IP, point DNS at it, and use **ManagedCertificate** (or cert-manager) with your Ingress — see [GKE Ingress](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress).

### 5. Verify

```bash
kubectl get pods -n nest
kubectl get svc -n nest
kubectl port-forward svc/nest-api 8080:8080 -n nest
curl http://localhost:8080/api/v1/health
```

### 6. Cleanup (GKE)

```bash
kubectl delete namespace nest
gcloud container clusters delete nest-cluster --region=northamerica-northeast1 --project=YOUR_GCP_PROJECT_ID
```

---

## Option B: DigitalOcean Kubernetes (DOKS)

### 1. Create cluster

1. **DigitalOcean** account and Kubernetes cluster
2. **`doctl`** CLI installed and configured
3. `kubectl` installed
4. Docker Hub (or any registry) for images

```bash
doctl kubernetes cluster create nest-cluster \
  --region tor1 \
  --size s-2vcpu-2gb \
  --count 2 \
  --auto-upgrade

doctl kubernetes cluster kubeconfig save nest-cluster
```

Or create in the control panel: **tor1** (Toronto), 2 nodes, Basic 2GB/2vCPU, auto-upgrade on.

### 2. Build and push images (Docker Hub example)

```bash
docker build -t YOUR_DOCKERHUB_USERNAME/nest-api:latest .
docker push YOUR_DOCKERHUB_USERNAME/nest-api:latest

cd src/nestapp-frontend/nestapp
docker build -t YOUR_DOCKERHUB_USERNAME/nest-frontend:latest .
docker push YOUR_DOCKERHUB_USERNAME/nest-frontend:latest
```

Edit `k8s/api-deployment.yaml` and `k8s/frontend-deployment.yaml` and replace `YOUR_DOCKERHUB_USERNAME` with your registry path.

### 3. Deploy

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
# kubectl apply -f k8s/worker-deployment.yaml      # template only; replicas=0 by default
# Optional: kubectl apply -f k8s/ingress.yaml
```

### 4. Verify & access

```bash
kubectl get pods -n nest
kubectl get svc -n nest
kubectl get svc nest-frontend -n nest
kubectl port-forward svc/nest-api 8080:8080 -n nest
curl http://localhost:8080/api/v1/health
```

### Managed PostgreSQL (DOKS / general)

To use **AWS RDS**, **Cloud SQL**, or **DigitalOcean Managed Databases** instead of in-cluster Postgres:

1. Create the managed instance.
2. Update the API ConfigMap (e.g. `DB_HOST` to the managed endpoint).
3. Update the API `Secret` with the DB password.
4. **Do not** apply `postgres-deployment.yaml`.

## Scaling

```bash
kubectl scale deployment nest-api --replicas=3 -n nest
kubectl scale deployment nest-frontend --replicas=3 -n nest
```

On **GKE**, prefer **HPA** and (for workers) **KEDA** on queue depth per `agent/PRD.md`.

Worker deployment template:

```bash
# Apply template (safe; starts at 0 replicas)
kubectl apply -f k8s/worker-deployment.yaml

# After implementing worker-mode code and RabbitMQ wiring:
kubectl scale deployment nest-worker --replicas=2 -n nest
```

The worker detach implementation sequence is documented in
`agent/WORKER_DETACHMENT_STEPS.md`.

Optional autoscaling and availability manifests in this repo:

```bash
# API autoscaling (CPU-based)
kubectl apply -f k8s/api-hpa.yaml

# API disruption budget (safer node drains/rollouts)
kubectl apply -f k8s/api-pdb.yaml
```

## Monitoring

- **GKE:** [Cloud Logging / Cloud Monitoring](https://cloud.google.com/kubernetes-engine/docs/how-to/monitoring) for control plane and workloads; set alerts on error rate, DLQ depth, pod restarts.
- **All clusters:** `kubectl logs -f deployment/nest-api -n nest` and `kubectl describe pod` for triage.

## Cost tips

- **GKE Autopilot** vs **Standard:** compare the [pricing calculator](https://cloud.google.com/products/calculator); Autopilot reduces ops, Standard gives more control.
- **Cloud SQL:** start with the smallest dev instance; add HA only when needed.
- **DOKS:** 1–2 small nodes for dev; scale node pool for production. Consider DO Managed DB instead of in-cluster StatefulSet for durability.

## Cleanup (DOKS)

```bash
kubectl delete namespace nest
doctl kubernetes cluster delete nest-cluster
```
