#!/bin/bash
set -e

echo "=========================================="
echo "Building Backend Microservices"
echo "=========================================="

# Build deployer service
echo ""
echo "→ Building deployer service..."
docker build -t deployer-backend:latest ./backend/deployer

# Build image service  
echo "→ Building image service..."
docker build -t image-service:latest ./backend/image

# Build nikto service
echo "→ Building nikto service..."
docker build -t nikto-service:latest ./backend/nikto

# Build gateway service
echo "→ Building gateway service..."
docker build -t deployer-gateway:latest ./backend/gateway

# Build frontend
echo "→ Building frontend..."
docker build -t deployer-frontend:latest ./frontend

echo ""
echo "✓ All images built successfully"
echo ""
echo "=========================================="
echo ""
