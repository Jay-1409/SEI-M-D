#!/usr/bin/env bash

# ==========================================
# Secure Microservice Deployer — Demo Controller
# 
# Usage:  ./start-demo.sh [sql|xss|rate|api]
#         Scales a specific demo service to 1 replica.
# ==========================================

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
DIM='\033[2m'

SERVICE_NAME=""
case "$1" in
    sql) SERVICE_NAME="expo-sqli-demo" ;;
    xss) SERVICE_NAME="expo-xss-demo" ;;
    rate) SERVICE_NAME="expo-rate-limit-demo" ;;
    api) SERVICE_NAME="expo-api-demo" ;;
    *) echo -e "${RED}Usage: ./start-demo.sh [sql|xss|rate|api]${NC}"; exit 1 ;;
esac

NAMESPACE="user-services"

echo -e "${BLUE}🛡️  Starting Service: ${YELLOW}$SERVICE_NAME${NC}"

# Check if deployment exists
if ! kubectl get deployment "$SERVICE_NAME" -n $NAMESPACE >/dev/null 2>&1; then
    echo -e "${RED}✗ Error: Deployment '$SERVICE_NAME' not found in namespace '$NAMESPACE'.${NC}"
    echo -e "  Please upload and deploy the service through the dashboard (http://localhost:30000) first."
    exit 1
fi

# Scale up
echo -ne "  ${DIM}Scaling up to 1 replica...${NC}"
kubectl scale deployment "$SERVICE_NAME" -n $NAMESPACE --replicas=1 >/dev/null
echo -e "\r  ${GREEN}✓${NC} Scaling command sent"

# Wait for readiness
echo -ne "  ${YELLOW}Waiting for readiness...${NC}"
if kubectl rollout status deployment/"$SERVICE_NAME" -n $NAMESPACE --timeout=60s >/dev/null 2>&1; then
    echo -e "\r  ${GREEN}✓${NC} Service is READY! You can now test it in the simulation.${NC}"
else
    echo -e "\r  ${RED}✗${NC} Service timed out while starting. Check logs with: ${DIM}kubectl logs -n $NAMESPACE -l app=$SERVICE_NAME${NC}"
fi

echo ""
