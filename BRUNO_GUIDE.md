# Bruno API Testing Guide

Test the Secure Microservice Deployer API using Bruno, Postman, or curl.

## Base URL

```
http://localhost:30000/api
```

---

## 1. Upload Docker Image

**Endpoint:** `POST /upload-image`  
**Type:** `multipart/form-data`

### Bruno Configuration:

1. **Method:** POST
2. **URL:** `http://localhost:30000/api/upload-image`
3. **Body Type:** Multipart Form
4. **Form Fields:**
   - **Key:** `file` (type: File)
   - **Value:** Select `examples/simple-api/example-api.tar`

### Expected Response:

```json
{
  "status": "success",
  "image_name": "example-api:latest",
  "image_id": "47b2b835c3d4",
  "message": "Image loaded: example-api:latest"
}
```

### curl equivalent:

```bash
curl -X POST http://localhost:30000/api/upload-image \
  -F "file=@examples/simple-api/example-api.tar"
```

---

## 2. Deploy Service

**Endpoint:** `POST /deploy-service`  
**Type:** `application/json`

### Bruno Configuration:

1. **Method:** POST
2. **URL:** `http://localhost:30000/api/deploy-service`
3. **Body Type:** JSON
4. **Body:**

```json
{
  "service_name": "example-api",
  "docker_image": "example-api:latest",
  "container_port": 8000
}
```

### Expected Response:

```json
{
  "status": "success",
  "service_name": "example-api",
  "public_url": "http://localhost:30080/example-api",
  "message": "Service 'example-api' deployed successfully"
}
```

### curl equivalent:

```bash
curl -X POST http://localhost:30000/api/deploy-service \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "example-api",
    "docker_image": "example-api:latest",
    "container_port": 8000
  }'
```

---

## 3. List Services

**Endpoint:** `GET /services`

### Bruno Configuration:

1. **Method:** GET
2. **URL:** `http://localhost:30000/api/services`

### Expected Response:

```json
[
  {
    "service_name": "example-api",
    "docker_image": "example-api:latest",
    "container_port": 8000,
    "public_url": "http://localhost:30080/example-api",
    "status": "deployed"
  }
]
```

### curl equivalent:

```bash
curl http://localhost:30000/api/services
```

---

## 4. Access Service via Gateway

**Endpoint:** `GET /{service_name}`  
**Base URL:** `http://localhost:30080`

### Bruno Configuration:

1. **Method:** GET
2. **URL:** `http://localhost:30080/example-api`

### Expected Response:

```json
{
  "service": "example-microservice",
  "status": "running",
  "message": "Hello from the Secure Microservice Deployer!",
  "timestamp": "2026-02-13T02:28:45.123456"
}
```

### curl equivalent:

```bash
curl http://localhost:30080/example-api
curl http://localhost:30080/example-api/info
curl http://localhost:30080/example-api/health
```

---

## 5. Delete Service

**Endpoint:** `DELETE /services/{service_name}`

### Bruno Configuration:

1. **Method:** DELETE
2. **URL:** `http://localhost:30000/api/services/example-api`

### Expected Response:

```json
{
  "status": "deleted",
  "service_name": "example-api"
}
```

### curl equivalent:

```bash
curl -X DELETE http://localhost:30000/api/services/example-api
```

---

## Complete Workflow (Bruno Collection)

1. **Upload Image** → Get `image_name` from response
2. **Deploy Service** → Use the `image_name` from step 1
3. **List Services** → Verify deployment
4. **Access via Gateway** → Test the service
5. **Delete Service** → Clean up

---

## Troubleshooting

If upload fails, test backend directly:

```bash
# Port-forward to backend
kubectl port-forward -n deployer svc/backend-service 8001:8000

# Test upload endpoint
curl -X POST http://localhost:8001/upload-image \
  -F "file=@examples/simple-api/example-api.tar"
```
