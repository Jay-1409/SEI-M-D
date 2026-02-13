# Secure Payment Gateway Service

An example microservice demonstrating OpenAPI/Swagger integration with the Secure Microservice Deployer.

## Features
- **Auto-generated OpenAPI Spec**: Exposed at `/openapi.json`
- **Interactive Docs**: Swagger UI at `/docs`
- **Secure by Default**: Simulates authenticated endpoints

## Deployment

1. **Build Docker Image**:
   ```bash
   docker build -t secure-payment-service:latest .
   docker save -o secure-payment-service.tar secure-payment-service:latest
   ```

2. **Upload & Deploy**:
   - Go to the Dashboard
   - Drag & drop `secure-payment-service.tar`
   - Set Port to `8000`
   - Click "Deploy"

3. **Verify**:
   - Visit the new service page
   - Click the "API Docs" tab (Yellow)
   - You should see the interactive Swagger UI!
