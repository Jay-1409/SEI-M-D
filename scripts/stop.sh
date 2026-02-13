#!/usr/bin/env bash

set -e

echo "=========================================="
echo "Secure Microservice Deployer - Stop"
echo "=========================================="
echo ""

# Color codes
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping all platform services (scaling to 0)...${NC}"
echo "Data will be preserved."
echo ""

# Scale deployments to 0
kubectl scale deployment --replicas=0 -n deployer-system --all

echo ""
echo -e "${GREEN}✓${NC} All services stopped."
echo "To restart, run: ./scripts/start.sh"
echo ""
