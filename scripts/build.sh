#!/usr/bin/env bash

set -e

echo "=========================================="
echo "Building Docker Images"
echo "=========================================="
echo ""

# Build backend
echo "→ Building backend image..."
docker build -t deployer-backend:latest ./backend
echo "✓ Backend built"
echo ""

# Build gateway
echo "→ Building gateway image..."
docker build -t deployer-gateway:latest ./gateway
echo "✓ Gateway built"
echo ""

# Build frontend
echo "→ Building frontend image..."
docker build -t deployer-frontend:latest ./frontend
echo "✓ Frontend built"
echo ""

echo "=========================================="
echo "✅ All images built successfully!"
echo "=========================================="
echo ""
echo "To deploy updates to Kubernetes:"
echo "  kubectl rollout restart deployment/backend deployment/gateway deployment/frontend -n deployer"
echo ""
