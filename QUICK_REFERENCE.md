# Quick Reference - Deploying Services

## Important: Container Port Must Match!

⚠️ **The `container_port` you specify MUST match the port your application actually listens on inside the container.**

### Example API Service

The included `example-api` service listens on **port 8000**.

**Correct deployment:**
```json
{
  "service_name": "my-service",
  "docker_image": "example-api:latest",
  "container_port": 8000  ✅
}
```

**Wrong deployment (will fail):**
```json
{
  "service_name": "my-service",
  "docker_image": "example-api:latest",
  "container_port": 19990  ❌  Service won't work!
}
```

## How to Check Your Container's Port

1. **Check the Dockerfile:**
   ```dockerfile
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```
   The port is `8000`

2. **Check pod logs:**
   ```bash
   kubectl logs -n deployer -l app=your-service
   # Look for: "Uvicorn running on http://0.0.0.0:8000"
   ```

3. **Common application ports:**
   - FastAPI/Flask: Usually `8000` or `5000`
   - Node.js: Usually `3000`
   - Nginx: Usually `80`
   - Custom apps: Check your code!

## Troubleshooting "Cannot reach service"

If you see `{"detail":"Cannot reach service 'xxx'}`:

1. **Check the port mismatch** (most common issue)
2. Delete and redeploy with correct port:
   ```bash
   curl -X DELETE http://localhost:30000/api/services/your-service
   # Then redeploy with correct port
   ```

3. **Check pod status:**
   ```bash
   kubectl get pods -n deployer -l app=your-service
   kubectl logs -n deployer -l app=your-service
   ```

## Valid Example Commands

### Via Bruno/API:
```json
{
  "service_name": "example-api",
  "docker_image": "example-api:latest",
  "container_port": 8000
}
```

### Via curl:
```bash
curl -X POST http://localhost:30000/api/deploy-service \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "example-api",
    "docker_image": "example-api:latest",
    "container_port": 8000
  }'
```

### Access the service:
```bash
curl http://localhost:30080/example-api
```
