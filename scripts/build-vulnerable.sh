#!/usr/bin/env bash

set -e

echo "=========================================="
echo "Building Vulnerable API Example"
echo "=========================================="
echo ""
echo "Building vulnerable-api Docker image..."

cd examples/vulnerable-api
docker build -t vulnerable-api:latest .

echo ""
echo "Saving image as tar file..."
docker save vulnerable-api:latest -o vulnerable-api.tar

echo ""
echo "✓ vulnerable-api.tar created ($(du -h vulnerable-api.tar | cut -f1))"
echo ""
echo "Upload via frontend at: http://localhost:30000"
echo "  Service Name: vulnerable-api"
echo "  Image File: examples/vulnerable-api/vulnerable-api.tar"
echo "  Container Port: 8000"
echo ""
echo "💡 After deployment, click 'Scan' to test Nikto vulnerability detection!"
echo ""
