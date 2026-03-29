#!/usr/bin/env bash

# ==========================================
# Secure Microservice Deployer — Platform Foundation (Stage 1)
# 
# Starts only the core components needed to access the dashboard
# and the upload service. Skips expensive scanners and demo services.
# ==========================================

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
DIM='\033[2m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$SCRIPT_DIR/../../k8s"
NAMESPACE="deployer-system"

echo -e "${BLUE}🏗️  Starting Platform Foundation (Core Only)...${NC}"

# 1. Base Setup
echo -ne "  ${DIM}Applying Namespaces and RBAC...${NC}"
kubectl apply -f "$K8S_DIR/namespace.yaml" >/dev/null
kubectl apply -f "$K8S_DIR/user-namespace.yaml" >/dev/null
kubectl apply -f "$K8S_DIR/rbac.yaml" >/dev/null
echo -e "\r  ${GREEN}✓${NC} Namespaces and RBAC ready"

# 2. Redis (CRITICAL)
echo -ne "  ${YELLOW}Starting Redis... (waiting for readiness)${NC}"
kubectl apply -f "$K8S_DIR/redis.yaml" >/dev/null
# Wait loop for Redis
MAX_RETRIES=30
COUNT=0
while [[ $COUNT -lt $MAX_RETRIES ]]; do
    if kubectl get pod -n "$NAMESPACE" -l app=redis | grep -q "1/1"; then
        echo -e "\r  ${GREEN}✓${NC} Redis is healthy and ready             "
        break
    fi
    sleep 3
    COUNT=$((COUNT + 1))
done

if [[ $COUNT -eq $MAX_RETRIES ]]; then
    echo -e "\r  ${RED}✗${NC} Redis failed to start within 90s. Checking logs...${NC}"
    kubectl logs -n "$NAMESPACE" -l app=redis --tail=20
    exit 1
fi

# 3. Core Services
echo -ne "  ${DIM}Starting Backend, Gateway, and Image Service...${NC}"
kubectl apply -f "$K8S_DIR/backend.yaml" >/dev/null
kubectl apply -f "$K8S_DIR/image-service.yaml" >/dev/null
kubectl apply -f "$K8S_DIR/gateway.yaml" >/dev/null
kubectl apply -f "$K8S_DIR/frontend.yaml" >/dev/null
echo -e "\r  ${GREEN}✓${NC} Core Services are deploying             "

# 4. Final Wait for Dashboard
echo -ne "  ${YELLOW}Waiting for Dashboard access...${NC}"
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=60s >/dev/null 2>&1
kubectl rollout status deployment/gateway -n "$NAMESPACE" --timeout=60s >/dev/null 2>&1
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=60s >/dev/null 2>&1
echo -e "\r  ${GREEN}✓${NC} Dashboard is ready at: ${YELLOW}http://localhost:30000${NC}"
echo -e "  ${GREEN}✓${NC} Gateway is ready at:   ${YELLOW}http://localhost:30080${NC}"

echo ""
echo -e "${BLUE}🚀 Core Platform is up! You can now start individual demos.${NC}"
echo ""
