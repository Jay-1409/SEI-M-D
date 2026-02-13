# Secure Microservice Deployer

A web-based platform that deploys Docker images into Kubernetes as internal microservices and exposes them securely through a centralized API gateway.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                       │
│                      (namespace: deployer)                   │
│                                                              │
│   ┌──────────┐     ┌──────────┐     ┌──────────────────┐    │
│   │ Frontend │────▶│ Backend  │────▶│  K8s API Server  │    │
│   │ (nginx)  │     │ (FastAPI)│     │  (create deploy/ │    │
│   │ :30000   │     │ ClusterIP│     │   svc resources) │    │
│   └──────────┘     └────┬─────┘     └──────────────────┘    │
│                         │ register route                     │
│                         ▼                                    │
│   ┌────────────────────────────────────┐                     │
│   │         Gateway (FastAPI)          │ ◀── only external   │
│   │    NodePort :30080                 │     entry point     │
│   │    /{service_name} → ClusterIP     │                     │
│   └───────┬────────┬───────┬──────────┘                     │
│           │        │       │                                 │
│           ▼        ▼       ▼                                 │
│   ┌────────┐ ┌────────┐ ┌────────┐                          │
│   │ svc-a  │ │ svc-b  │ │ svc-c  │  ← ClusterIP only       │
│   │ (int.) │ │ (int.) │ │ (int.) │    NOT exposed           │
│   └────────┘ └────────┘ └────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

### Security Model

| Component       | Service Type | External Access |
|-----------------|-------------|-----------------|
| Frontend        | NodePort    | ✅ Port 30000    |
| Backend API     | ClusterIP   | ❌ Internal only |
| Gateway         | NodePort    | ✅ Port 30080    |
| User Services   | ClusterIP   | ❌ Internal only |

All user-deployed microservices are **ClusterIP only** — they are never directly accessible from outside the cluster. The gateway is the **sole entry point** for reaching any deployed service.

## Folder Structure

```
secure-microservice-deployer/
├── backend/
│   ├── main.py              # FastAPI – deploy/list/delete endpoints
│   ├── k8s_client.py         # Kubernetes Python client helpers
│   ├── models.py             # Pydantic request/response models
│   ├── requirements.txt
│   └── Dockerfile
├── gateway/
│   ├── main.py              # FastAPI – reverse proxy + route registry
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html            # Single-page deploy UI
│   ├── nginx.conf            # Proxies /api → backend
│   └── Dockerfile
├── k8s/
│   ├── namespace.yaml
│   ├── rbac.yaml             # ServiceAccount + Role + RoleBinding
│   ├── backend.yaml          # Deployment + ClusterIP Service
│   ├── gateway.yaml          # Deployment + NodePort Service
│   └── frontend.yaml         # Deployment + NodePort Service
└── README.md
```

## Deployment Instructions

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- **Option 1**: [Docker Desktop](https://www.docker.com/products/docker-desktop) with Kubernetes enabled (recommended for local dev)
- **Option 2**: [Minikube](https://minikube.sigs.k8s.io/docs/start/)

### Quick Start Script

The easiest way to deploy:

```bash
cd secure-microservice-deployer
./scripts/deploy.sh
```

This will build all images, apply manifests, and print access URLs.

### Manual Deployment

#### Step 1 — Ensure Kubernetes is running

**For Docker Desktop:**
- Enable Kubernetes: Docker Desktop → Settings → Kubernetes → Enable Kubernetes

**For Minikube:**
```bash
minikube start --driver=docker
eval $(minikube docker-env)  # Use Minikube's Docker daemon
```

#### Step 2 — Build Docker images

```bash
cd secure-microservice-deployer

docker build -t deployer-backend:latest ./backend
docker build -t deployer-gateway:latest ./gateway
docker build -t deployer-frontend:latest ./frontend
```

#### Step 3 — Apply Kubernetes manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/gateway.yaml
kubectl apply -f k8s/frontend.yaml
```

#### Step 4 — Verify all pods are running

```bash
kubectl get pods -n deployer
```

Expected output:
```
NAME                        READY   STATUS    RESTARTS   AGE
backend-xxx                 1/1     Running   0          30s
gateway-xxx                 1/1     Running   0          30s
frontend-xxx                1/1     Running   0          30s
```

#### Step 5 — Access the application

**For Docker Desktop Kubernetes:**
```
Frontend: http://localhost:30000
Gateway:  http://localhost:30080
```

**For Minikube:**
```bash
echo "Frontend: http://$(minikube ip):30000"
echo "Gateway:  http://$(minikube ip):30080"
```

## Example Test Scenario

### Build and Deploy the Example API

The repository includes a sample microservice for testing.

**Step 1 — Build the example image:**

```bash
./scripts/build-example.sh
```

This creates `examples/simple-api/example-api.tar`

**Step 2 — Open the frontend:**

```
http://localhost:30000
```

(Or `http://<minikube-ip>:30000` for Minikube)

**Step 3 — Deploy via the UI:**

1. **Service Name**: `example-api`
2. **Docker Image**: Drag and drop `examples/simple-api/example-api.tar`
3. **Container Port**: `8000`
4. Click **Deploy Service**

**Step 4 — Access through the gateway:**

```bash
curl http://localhost:30080/example-api
# {"service":"example-microservice","status":"running",...}

curl http://localhost:30080/example-api/info
# {"service":"example-microservice","version":"1.0.0",...}
```

### Verify via CLI

```bash
# Check the deployment was created
kubectl get deployments -n deployer
# → example-api   1/1   1   Running

# Check the service is ClusterIP only (NOT NodePort)
kubectl get svc -n deployer
# → example-api-service   ClusterIP   10.x.x.x   <none>   8000/TCP

# Access through the gateway (Docker Desktop)
curl http://localhost:30080/example-api
# → example service JSON response

# Confirm direct access is impossible from outside the cluster
# (this should fail — service is internal only)
curl http://localhost:8000  # ← connection refused
```

### Using Pre-existing Images

You can also deploy public Docker Hub images without upload:

```bash
# Build a public image and save as tar
docker pull nginx:latest
docker save nginx:latest -o nginx.tar

# Upload via UI or API
curl -X POST http://localhost:30000/api/upload-image \
  -F "file=@nginx.tar"

# Then deploy through the form
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload-image` | Upload a Docker image .tar file |
| `POST` | `/deploy-service` | Deploy a new microservice |
| `GET` | `/services` | List all deployed services |
| `DELETE` | `/services/{name}` | Remove a deployed service |
| `GET` | `/health` | Backend health check |

### POST /upload-image

**Request:** `multipart/form-data` with file field

**Response:**
```json
{
  "status": "success",
  "image_name": "example-api:latest",
  "image_id": "abc123def456",
  "message": "Image loaded: example-api:latest"
}
```

### POST /deploy-service

**Request:**
```json
{
  "service_name": "payment",
  "docker_image": "nginx:latest",
  "container_port": 80
}
```

**Response:**
```json
{
  "status": "success",
  "service_name": "payment",
  "public_url": "http://<gateway-host>:30080/payment",
  "message": "Service 'payment' deployed successfully"
}
```
