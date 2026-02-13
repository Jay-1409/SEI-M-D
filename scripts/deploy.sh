#!/usr/bin/env bash

set -e

echo "=========================================="
echo "Secure Microservice Deployer - Setup"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if Kubernetes is running
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes cluster is not running. Please start Docker Desktop Kubernetes or Minikube."
    exit 1
fi

echo -e "${GREEN}✓${NC} Kubernetes cluster is running"
echo ""

# Build Docker images
echo -e "${BLUE}Building Docker images...${NC}"
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
docker build -t deployer-frontend:latest ./frontend -q

echo ""
echo -e "${GREEN}✓${NC} All images built successfully"
echo ""

# Apply Kubernetes manifests
echo -e "${BLUE}Applying Kubernetes manifests...${NC}"
echo ""

# Create both namespaces
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/user-namespace.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/image-service.yaml
kubectl apply -f k8s/nikto-service.yaml
kubectl apply -f k8s/gateway.yaml
kubectl apply -f k8s/frontend.yaml

echo ""
echo -e "${GREEN}✓${NC} Manifests applied"
echo ""

# Wait for pods to be ready
echo -e "${BLUE}Waiting for pods to be ready...${NC}"
echo ""

kubectl wait --for=condition=ready pod -l app=frontend -n deployer-system --timeout=60s || true
kubectl wait --for=condition=ready pod -l app=backend -n deployer-system --timeout=60s || true
kubectl wait --for=condition=ready pod -l app=image-service -n deployer-system --timeout=60s || true
kubectl wait --for=condition=ready pod -l app=nikto-service -n deployer-system --timeout=60s || true
kubectl wait --for=condition=ready pod -l app=gateway -n deployer-system --timeout=60s || true

echo ""

# Show pod status
echo -e "${BLUE}Pod Status:${NC}"
echo -e "  ${YELLOW}Platform Services (deployer-system):${NC}"
kubectl get pods -n deployer-system
echo ""

# Determine access URLs
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""

# Check if we're using Minikube or Docker Desktop
if command -v minikube &> /dev/null && minikube status &> /dev/null; then
    # Minikube
    MINIKUBE_IP=$(minikube ip)
    echo -e "${YELLOW}📍 Access URLs (Minikube):${NC}"
    echo ""
    echo "  Frontend:  http://${MINIKUBE_IP}:30000"
    echo "  Gateway:   http://${MINIKUBE_IP}:30080"
else
    # Docker Desktop or generic K8s
    echo -e "${YELLOW}📍 Access URLs:${NC}"
    echo ""
    echo "  Frontend:  http://localhost:30000"
    echo "  Gateway:   http://localhost:30080"
fi

echo ""
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Open the Frontend URL in your browser"
echo "  2. Deploy a test service (e.g., nginx:latest on port 80)"
echo "  3. Access it via the Gateway URL"
echo ""
echo "To view logs:"
echo "  kubectl logs -n deployer-system -l app=backend -f"
echo "  kubectl logs -n deployer-system -l app=gateway -f"
echo ""
echo "To tear down:"
echo "  kubectl delete namespace deployer-system user-services"
echo ""
