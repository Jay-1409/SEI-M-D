#!/usr/bin/env bash

set -e

echo "=========================================="
echo "Secure Microservice Deployer - Full Redeploy"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ docker not found. Please install Docker first."
    exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes cluster is not running."
    exit 1
fi

echo -e "${GREEN}✓${NC} Kubernetes cluster is running"
echo ""

# ── Step 1: Rebuild all Docker images ──
echo -e "${BLUE}Step 1/4: Rebuilding all Docker images...${NC}"
echo ""

echo "  → Building deployer-backend:latest"
docker build -t deployer-backend:latest ./backend/deployer -q

echo "  → Building image-service:latest"
docker build -t image-service:latest ./backend/image -q

echo "  → Building nikto-service:latest"
docker build -t nikto-service:latest ./backend/nikto -q

echo "  → Building deployer-gateway:latest"
docker build -t deployer-gateway:latest ./backend/gateway -q

echo "  → Building deployer-frontend:latest"
docker build -t deployer-frontend:latest ./frontendv2 -q

echo ""
echo -e "${GREEN}✓${NC} All images rebuilt"
echo ""

# ── Step 2: Apply manifests (in case any changed) ──
echo -e "${BLUE}Step 2/4: Applying Kubernetes manifests...${NC}"
echo ""

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/user-namespace.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/image-service.yaml
kubectl apply -f k8s/nikto-service.yaml
kubectl apply -f k8s/gateway.yaml
kubectl apply -f k8s/frontend.yaml

echo ""
echo -e "${GREEN}✓${NC} Manifests applied"
echo ""

# ── Step 3: Force rollout restart (picks up new images) ──
echo -e "${BLUE}Step 3/4: Restarting all deployments...${NC}"
echo ""

kubectl rollout restart deployment/redis -n deployer-system
kubectl rollout restart deployment/backend -n deployer-system
kubectl rollout restart deployment/image-service -n deployer-system
kubectl rollout restart deployment/nikto-service -n deployer-system
kubectl rollout restart deployment/gateway -n deployer-system
kubectl rollout restart deployment/frontend -n deployer-system

echo ""
echo -e "${GREEN}✓${NC} Rollout restart triggered"
echo ""

# ── Step 4: Wait for all pods to be ready ──
echo -e "${BLUE}Step 4/4: Waiting for pods to be ready...${NC}"
echo ""

kubectl rollout status deployment/redis -n deployer-system --timeout=90s
kubectl rollout status deployment/backend -n deployer-system --timeout=90s
kubectl rollout status deployment/image-service -n deployer-system --timeout=90s
kubectl rollout status deployment/nikto-service -n deployer-system --timeout=90s
kubectl rollout status deployment/gateway -n deployer-system --timeout=90s
kubectl rollout status deployment/frontend -n deployer-system --timeout=90s

echo ""

# Show pod status
echo -e "${BLUE}Pod Status:${NC}"
echo -e "  ${YELLOW}Platform Services (deployer-system):${NC}"
kubectl get pods -n deployer-system
echo ""

echo -e "  ${YELLOW}User Services (user-services):${NC}"
kubectl get pods -n user-services 2>/dev/null || echo "  (no user services deployed)"
echo ""

# Access URLs
echo "=========================================="
echo -e "${GREEN}Full Redeploy Complete!${NC}"
echo "=========================================="
echo ""

if command -v minikube &> /dev/null && minikube status &> /dev/null; then
    MINIKUBE_IP=$(minikube ip)
    echo -e "${YELLOW}📍 Access URLs (Minikube):${NC}"
    echo ""
    echo "  Frontend:  http://${MINIKUBE_IP}:30000"
    echo "  Gateway:   http://${MINIKUBE_IP}:30080"
else
    echo -e "${YELLOW}📍 Access URLs:${NC}"
    echo ""
    echo "  Frontend:  http://localhost:30000"
    echo "  Gateway:   http://localhost:30080"
fi

echo ""
echo "=========================================="
echo ""
