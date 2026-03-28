#!/usr/bin/env bash

# ==========================================
# Secure Microservice Deployer — Demo Controller
# 
# Usage:  ./stop-demo.sh [sql|xss|rate|api]
#         Scales a specific demo service to 0 replicas.
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
    *) echo -e "${RED}Usage: ./stop-demo.sh [sql|xss|rate|api]${NC}"; exit 1 ;;
esac

NAMESPACE="user-services"

echo -e "${BLUE}🧹  Stopping Service: ${YELLOW}$SERVICE_NAME${NC}"

# Check if deployment exists
if ! kubectl get deployment "$SERVICE_NAME" -n $NAMESPACE >/dev/null 2>&1; then
    echo -e "${RED}✗ Error: Deployment '$SERVICE_NAME' not found in namespace '$NAMESPACE'.${NC}"
    exit 1
fi

# Scale down
echo -ne "  ${DIM}Scaling down to 0 replicas...${NC}"
kubectl scale deployment "$SERVICE_NAME" -n $NAMESPACE --replicas=0 >/dev/null
echo -e "\r  ${GREEN}✓${NC} Done! Service stopped. RAM reclaimed."

echo ""
