#!/usr/bin/env bash

set -e

echo "Building vulnerable-api Docker image..."
cd examples/vulnerable-api

docker build -t vulnerable-api:latest .

echo ""
echo "Saving image as tar file..."
docker save vulnerable-api:latest -o vulnerable-api.tar

echo ""
echo "=========================================="
echo "✅ vulnerable-api.tar created successfully!"
echo "=========================================="
echo ""
echo "File location: examples/vulnerable-api/vulnerable-api.tar"
echo "File size: $(du -h vulnerable-api.tar | cut -f1)"
echo ""
echo "To deploy:"
echo "  1. Upload vulnerable-api.tar via the frontend"
echo "  2. Service name: vulnerable-api"
echo "  3. Port: 8000"
echo "  4. Click 'Scan' to test Nikto vulnerability detection!"
echo ""
