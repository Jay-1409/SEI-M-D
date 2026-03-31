# Unified Target Service for SEI-M-D Simulations

This is a single unified FastAPI service that handles all 4 scenario endpoints for the live gateway demonstrations. By deploying this single `.tar` image to your platform, you can point your 4 frontend demos toward various routes on this single container.

## How to Build the Image
To build the Docker image for platform deployment, simply run the PowerShell script:
```powershell
.\build-demo-target.ps1
```
This produces an `expo-unified-target.tar` file which you can upload using the platform dashboard.

## Unified Gateway Routes
Assuming you register the Service Name as `expo-unified-target` running on `Container Port: 8000`:

1. **SQL Injection Demo**
`Target Gateway URL`: `http://localhost:30080/expo-unified-target/login`

2. **XSS Feedback Wall Demo**
`Target Gateway URL`: `http://localhost:30080/expo-unified-target/comments`

3. **Rate Limiting Demo**
`Target Gateway URL`: `http://localhost:30080/expo-unified-target/tickets`

4. **API Key Protection Demo**
`Target Gateway URL`: `http://localhost:30080/expo-unified-target/staff/open-maintenance-panel`
