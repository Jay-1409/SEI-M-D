#!/usr/bin/env bash

set -e

echo "=========================================="
echo "Secure Microservice Deployer - Start"
echo "=========================================="
echo ""

# Color codes
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting all platform services (scaling up)...${NC}"
echo ""

# Scale deployments to 1
kubectl scale deployment --replicas=1 -n deployer-system --all

echo ""
echo -e "${BLUE}Waiting for pods to be ready...${NC}"
echo ""

kubectl wait --for=condition=ready pod -l app=redis -n deployer-system --timeout=60s || true
kubectl wait --for=condition=ready pod -l app=frontend -n deployer-system --timeout=60s || true
kubectl wait --for=condition=ready pod -l app=backend -n deployer-system --timeout=60s || true
kubectl wait --for=condition=ready pod -l app=image-service -n deployer-system --timeout=60s || true
kubectl wait --for=condition=ready pod -l app=nikto-service -n deployer-system --timeout=60s || true
kubectl wait --for=condition=ready pod -l app=gateway -n deployer-system --timeout=60s || true

echo ""
echo -e "${GREEN}✓${NC} All services started."
echo ""
