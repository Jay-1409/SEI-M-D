#!/usr/bin/env bash

# ==========================================
# Secure Microservice Deployer — Total Cleanup
# 
# Usage:  ./cleanup-all.sh
#         Scales ALL services to 0 to save RAM.
# ==========================================

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
DIM='\033[2m'

echo -e "${RED}🧹  Cleaning Up ALL Services...${NC}"

# Scale down platform services
echo -ne "  ${DIM}Scaling down platform services...${NC}"
kubectl scale deployment --all -n deployer-system --replicas=0 >/dev/null 2>&1
echo -e "\r  ${GREEN}✓${NC} Platform services scaled to zero"

# Scale down user services
echo -ne "  ${DIM}Scaling down user services...${NC}"
kubectl scale deployment --all -n user-services --replicas=0 >/dev/null 2>&1
echo -e "\r  ${GREEN}✓${NC} User services scaled to zero"

echo ""
echo -e "${GREEN}✓ All services stopped. RAM reclaimed!${NC}"
echo ""
