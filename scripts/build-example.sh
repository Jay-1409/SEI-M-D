#!/usr/bin/env bash

set -e

echo "=========================================="
echo "Building Simple API Example"
echo "=========================================="
echo ""
echo "Building example-api Docker image..."

cd examples/simple-api
docker build -t example-api:latest .

echo ""
echo "Saving image as tar file..."
docker save example-api:latest -o example-api.tar

echo ""
echo "✓ example-api.tar created ($(du -h example-api.tar | cut -f1))"
echo ""
echo "Upload via frontend at: http://localhost:30000"
echo "  Service Name: example-api"
echo "  Image File: examples/simple-api/example-api.tar"
echo "  Container Port: 8000"
echo ""
echo "After deployment, access at: http://localhost:30080/example-api"
echo ""
