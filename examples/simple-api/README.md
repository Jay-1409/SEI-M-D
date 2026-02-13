# Example Microservice

A simple FastAPI service for testing the Secure Microservice Deployer.

## Endpoints

- `GET /` - Welcome message with timestamp
- `GET /info` - Service information (version, platform, hostname)
- `GET /health` - Health check

## Building the Image

```bash
cd examples/simple-api
docker build -t example-api:latest .
```

## Saving as a Tar File (for upload)

```bash
docker save example-api:latest -o example-api.tar
```

This creates `example-api.tar` which you can upload via the frontend.

## Testing Locally

```bash
docker run -p 8000:8000 example-api:latest
curl http://localhost:8000
curl http://localhost:8000/info
```

## Deploying via the Platform

1. Build and save the image as tar:
   ```bash
   docker build -t example-api:latest .
   docker save example-api:latest -o example-api.tar
   ```

2. Open the frontend at `http://localhost:30000`

3. Fill in the form:
   - **Service Name**: `example-api`
   - **Docker Image**: Drop the `example-api.tar` file
   - **Container Port**: `8000`

4. Access via gateway: `http://localhost:30080/example-api`
