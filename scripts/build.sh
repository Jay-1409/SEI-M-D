#!/usr/bin/env bash

set -e

echo "=========================================="
echo "Building Docker Images"
echo "=========================================="
echo ""

# Build backend (deployer)
echo "→ Building deployer-backend:latest"
docker build -t deployer-backend:latest ./backend/deployer -q
echo "✓ Backend built"
echo ""

# Build image-service
echo "→ Building image-service:latest"
docker build -t image-service:latest ./backend/image -q
echo "✓ Image service built"
echo ""

# Build nikto-service
echo "→ Building nikto-service:latest"
docker build -t nikto-service:latest ./backend/nikto -q
echo "✓ Nikto service built"
echo ""

# Build gateway
echo "→ Building deployer-gateway:latest"
docker build -t deployer-gateway:latest ./backend/gateway -q
echo "✓ Gateway built"
echo ""

# Build frontend
echo "→ Building deployer-frontend:latest"
docker build -t deployer-frontend:latest ./frontendv2 -q
echo "✓ Frontend built"
echo ""

echo "=========================================="
echo "✅ All images built successfully!"
echo "=========================================="
echo ""
echo "To deploy updates to Kubernetes:"
echo "  ./scripts/deploy.sh"
echo ""
