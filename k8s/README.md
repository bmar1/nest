# Kubernetes Deployment Guide for Nest

## Prerequisites

1. DigitalOcean account with Kubernetes cluster created
2. `doctl` CLI installed and configured
3. `kubectl` installed
4. Docker Hub account for image hosting

## Setup Steps

### 1. Create DigitalOcean Kubernetes Cluster

```bash
# Via DigitalOcean CLI
doctl kubernetes cluster create nest-cluster \
  --region tor1 \
  --size s-2vcpu-2gb \
  --count 2 \
  --auto-upgrade

# Get cluster credentials
doctl kubernetes cluster kubeconfig save nest-cluster
```

Or create via DigitalOcean web console:
- Name: nest-cluster
- Region: Toronto (tor1)
- Node pool: 2 nodes, Basic (2GB RAM / 2 vCPUs) - $24/month
- Auto-upgrade: Enabled

### 2. Build and Push Docker Images

```bash
# Build Spring Boot API
docker build -t YOUR_DOCKERHUB_USERNAME/nest-api:latest .
docker push YOUR_DOCKERHUB_USERNAME/nest-api:latest

# Build React Frontend
cd src/nestapp-frontend/nestapp
docker build -t YOUR_DOCKERHUB_USERNAME/nest-frontend:latest .
docker push YOUR_DOCKERHUB_USERNAME/nest-frontend:latest
```

### 3. Update Image Names in K8s Manifests

Edit the following files and replace `YOUR_DOCKERHUB_USERNAME` with your actual Docker Hub username:
- `k8s/api-deployment.yaml`
- `k8s/frontend-deployment.yaml`

### 4. Deploy to Kubernetes

```bash
# Apply manifests in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Optional: Apply ingress if you have a domain
# kubectl apply -f k8s/ingress.yaml
```

### 5. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n nest

# Check services
kubectl get svc -n nest

# Get LoadBalancer external IP for frontend
kubectl get svc nest-frontend -n nest

# Check API health
kubectl port-forward svc/nest-api 8080:8080 -n nest
curl http://localhost:8080/api/v1/health
```

### 6. Access the Application

Once the LoadBalancer is provisioned, you'll get an external IP:

```bash
kubectl get svc nest-frontend -n nest
```

Navigate to `http://<EXTERNAL-IP>` in your browser.

## Using RDS PostgreSQL Instead

To use AWS RDS or DigitalOcean Managed PostgreSQL instead of in-cluster Postgres:

1. Create managed database instance
2. Update `api-config` ConfigMap with RDS endpoint:
   ```yaml
   data:
     DB_HOST: your-rds-endpoint.rds.amazonaws.com
     DB_PORT: "5432"
     DB_NAME: nest
     DB_USER: admin
   ```
3. Update `api-secret` with RDS password
4. Skip applying `postgres-deployment.yaml`

## Scaling

```bash
# Scale API replicas
kubectl scale deployment nest-api --replicas=3 -n nest

# Scale frontend replicas
kubectl scale deployment nest-frontend --replicas=3 -n nest
```

## Monitoring

```bash
# View logs
kubectl logs -f deployment/nest-api -n nest
kubectl logs -f deployment/nest-frontend -n nest

# Describe pod for troubleshooting
kubectl describe pod <POD_NAME> -n nest
```

## Cost Optimization

- Use 1-2 nodes for development ($12-24/month)
- Scale up to 3-5 nodes for production ($36-60/month)
- Use DigitalOcean's managed PostgreSQL instead of StatefulSet ($15/month for smallest tier)

## Cleanup

```bash
# Delete all resources
kubectl delete namespace nest

# Delete cluster
doctl kubernetes cluster delete nest-cluster
```
