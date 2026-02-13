#!/usr/bin/env bash

set -e

echo "=========================================="
echo "Secure Microservice Deployer - Teardown"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This will delete all deployed services and the deployer platform.${NC}"
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Teardown cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Deleting all resources in the 'deployer-system' and 'user-services' namespaces...${NC}"
echo ""

kubectl delete namespace deployer-system user-services

echo ""
echo -e "${GREEN}✓${NC} All deployments and services deleted"
echo ""

echo -e "${YELLOW}Optional: Clean up Docker images?${NC}"
echo ""
read -p "Remove deployer Docker images? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Removing Docker images..."
    docker rmi -f deployer-backend:latest 2>/dev/null || true
    docker rmi -f deployer-gateway:latest 2>/dev/null || true
    docker rmi -f deployer-frontend:latest 2>/dev/null || true
    docker rmi -f example-api:latest 2>/dev/null || true
    echo ""
    echo -e "${GREEN}✓${NC} Docker images removed"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Teardown Complete${NC}"
echo "=========================================="
echo ""
echo "The platform has been completely removed."
echo "To redeploy, run: ./scripts/deploy.sh"
echo ""
