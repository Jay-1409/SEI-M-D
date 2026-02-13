"""
Secure Microservice Deployer — Backend API

Endpoints:
  POST /deploy-service   Deploy a container into Kubernetes
  POST /upload-image     Upload a Docker image tar file
  GET  /services          List all deployed services
  DELETE /services/{name} Tear down a deployed service
  POST /services/{name}/scan  Scan service for vulnerabilities
  GET /services/{name}/scan   Get scan results
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import logging
import docker
import tempfile
import subprocess
import json
import redis
from datetime import datetime
from kubernetes import client, config

from models import DeployRequest, DeployResponse, ServiceInfo, ScanResult, Vulnerability, RateLimitConfig
from k8s_client import create_deployment, create_service, delete_deployment, delete_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("deployer-backend")

app = FastAPI(title="Secure Microservice Deployer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory registry of deployed services
deployed_services: dict[str, ServiceInfo] = {}

# Nikto service URL for scan proxying
NIKTO_SERVICE_URL = "http://nikto-service.deployer-system.svc.cluster.local:8002"

GATEWAY_HOST = os.getenv("GATEWAY_HOST", "localhost")
GATEWAY_PORT = os.getenv("GATEWAY_PORT", "30080")
GATEWAY_REGISTER_URL = os.getenv("GATEWAY_REGISTER_URL", "http://gateway-service:8080")

# Initialize Docker client
try:
    docker_client = docker.from_env()
except Exception as e:
    logger.warning(f"Docker client initialization failed: {e}")
    docker_client = None
    docker_client = None


# Redis connection
REDIS_HOST = os.getenv("REDIS_HOST", "redis-service.deployer-system.svc.cluster.local")
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)
except Exception as e:
    logger.warning(f"Redis connection failed: {e}")
    redis_client = None

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload a Docker image tar file - proxied to image-service."""
    if not file.filename.endswith('.tar'):
        raise HTTPException(status_code=400, detail="File must be a .tar Docker image")
    
    logger.info(f"Proxying image upload to image-service: {file.filename}")
    
    # Forward to image-service
    try:
        files = {'file': (file.filename, await file.read(), file.content_type)}
        
        async with httpx.AsyncClient(timeout=120.0) as http_client:
            response = await http_client.post(
                "http://image-service.deployer-system.svc.cluster.local:8001/upload",
                files=files
            )
            response.raise_for_status()
            result = response.json()
        
        logger.info(f"Image uploaded successfully: {result.get('image_name')}")
        
        # Transform response to match frontend expectations
        return {
            "status": "success",
            "image_name": result.get('image_name'),
            "image_id": result.get('image_id', '')[:12],
            "detected_ports": result.get('ports', []),
            "suggested_port": result['ports'][0] if result.get('ports') else None,
            "message": f"Image loaded: {result.get('image_name')}"
        }
    
    except httpx.HTTPStatusError as e:
        logger.error(f"Image service error: {e}")
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to upload image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")



@app.post("/deploy-service", response_model=DeployResponse)
async def deploy_service(req: DeployRequest):
    """Deploy a Docker image into Kubernetes and register it with the gateway."""

    if req.service_name in deployed_services:
        raise HTTPException(status_code=409, detail=f"Service '{req.service_name}' already exists")

    logger.info(f"Deploying service: {req.service_name} image={req.docker_image} port={req.container_port}")

    # 1. Create Kubernetes Deployment
    try:
        dep_result = create_deployment(req.service_name, req.docker_image, req.container_port)
        logger.info(f"Deployment created: {dep_result}")
    except Exception as e:
        logger.error(f"Failed to create deployment: {e}")
        raise HTTPException(status_code=500, detail=f"Deployment creation failed: {str(e)}")

    # 2. Create ClusterIP Service (internal only)
    try:
        svc_result = create_service(req.service_name, req.container_port)
        logger.info(f"Service created: {svc_result}")
    except Exception as e:
        logger.error(f"Failed to create service, rolling back deployment: {e}")
        try:
            delete_deployment(req.service_name)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Service creation failed: {str(e)}")

    # 3. Register route in gateway
    try:
        async with httpx.AsyncClient() as http_client:
            # Use FQDN for cross-namespace service communication
            service_fqdn = f"http://{req.service_name}-service.user-services.svc.cluster.local:{req.container_port}"
            resp = await http_client.post(
                f"{GATEWAY_REGISTER_URL}/register",
                json={
                    "service_name": req.service_name,
                    "target_url": service_fqdn,
                },
            )
            resp.raise_for_status()
            logger.info(f"Registered route in gateway for {req.service_name}")
    except Exception as e:
        logger.warning(f"Gateway registration failed (gateway may not be up yet): {e}")

    # 4. Build public URL
    public_url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/{req.service_name}"

    # 5. Store in registry
    info = ServiceInfo(
        service_name=req.service_name,
        docker_image=req.docker_image,
        container_port=req.container_port,
        public_url=public_url,
        status="deployed",
    )
    deployed_services[req.service_name] = info

    return DeployResponse(
        status="success",
        service_name=req.service_name,
        public_url=public_url,
        message=f"Service '{req.service_name}' deployed successfully",
    )


@app.get("/services", response_model=list[ServiceInfo])
async def list_services():
    """List all deployed user services from user-services namespace."""
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()

    apps_v1 = client.AppsV1Api()
    core_v1 = client.CoreV1Api()

    # Query user-services namespace
    deployments = apps_v1.list_namespaced_deployment(namespace="user-services")
    services_list = core_v1.list_namespaced_service(namespace="user-services")

    result = []
    for dep in deployments.items:
        name = dep.metadata.name
        container = dep.spec.template.spec.containers[0]
        image = container.image
        port = container.ports[0].container_port if container.ports else 0

        # Get service info
        svc_name = f"{name}-service"
        service_info_k8s = next((s for s in services_list.items if s.metadata.name == svc_name), None)
        
        public_url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/{name}"
        
        # Check if service is in our in-memory registry to get scan status and other details
        # If not, default to deployed status
        if name in deployed_services:
            info = deployed_services[name]
            info.status = "deployed" # Assume deployed if found in k8s
            info.public_url = public_url # Ensure public_url is up-to-date
        else:
            info = ServiceInfo(
                service_name=name,
                docker_image=image,
                container_port=port,
                public_url=public_url,
                status="deployed",
                scan_status="unknown",
                last_scan=None,
                vulnerability_count=0
            )
        result.append(info)
    return result


@app.delete("/services/{service_name}")
async def delete_service_endpoint(service_name: str):
    """Delete a deployed service from user-services namespace."""
    if service_name not in deployed_services:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")

    # 1. Deregister from gateway
    try:
        async with httpx.AsyncClient() as http_client:
            await http_client.delete(f"{GATEWAY_REGISTER_URL}/register/{service_name}")
            logger.info(f"Deregistered route from gateway for {service_name}")
    except Exception as e:
        logger.warning(f"Gateway deregistration failed: {e}")
    
    # 2. Delete Kubernetes deployment
    try:
        delete_deployment(service_name)
        logger.info(f"Deleted deployment for {service_name}")
    except Exception as e:
        logger.error(f"Failed to delete deployment: {e}")

    # 3. Delete Kubernetes service
    try:
        delete_service(service_name)
        logger.info(f"Deleted service for {service_name}")
    except Exception as e:
        logger.error(f"Failed to delete service: {e}")

    # 4. Remove from in-memory registry
    del deployed_services[service_name]
    
    logger.info(f"Service '{service_name}' deleted successfully")
    return {"message": f"Service '{service_name}' deleted successfully"}


@app.post("/services/{service_name}/scan")
async def scan_service(service_name: str):
    """Trigger a Nikto vulnerability scan for a deployed service - proxied to nikto-service."""
    # Query Kubernetes to get service info
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()
    
    apps_v1 = client.AppsV1Api()
    
    # Check if deployment exists in user-services namespace
    try:
        deployment = apps_v1.read_namespaced_deployment(name=service_name, namespace="user-services")
        container = deployment.spec.template.spec.containers[0]
        container_port = container.ports[0].container_port if container.ports else 8000
    except client.exceptions.ApiException as e:
        if e.status == 404:
            raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")
        raise HTTPException(status_code=500, detail=f"Error querying service: {str(e)}")
    
    # Build FQDN target URL for cross-namespace scanning
    target_url = f"http://{service_name}-service.user-services.svc.cluster.local:{container_port}"
    
    logger.info(f"Proxying scan request to nikto-service for {service_name} at {target_url}")
    
    # Forward to nikto-service
    try:
        async with httpx.AsyncClient(timeout=180.0) as http_client:
            response = await http_client.post(
                "http://nikto-service.deployer-system.svc.cluster.local:8002/scan",
                json={
                    "target_url": target_url,
                    "service_name": service_name
                }
            )
            response.raise_for_status()
            result = response.json()
        
        # Update deployed_services if exists
        if service_name in deployed_services:
            deployed_services[service_name].scan_status = result.get('scan_status', 'completed')
            deployed_services[service_name].last_scan = result.get('started_at')
            deployed_services[service_name].vulnerability_count = result.get('total_findings', 0)
        
        logger.info(f"Scan completed for {service_name}: {result.get('total_findings', 0)} findings")
        
        return result
    
    except httpx.HTTPStatusError as e:
        logger.error(f"Nikto service error: {e}")
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to trigger scan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger scan: {str(e)}")


@app.get("/services/{service_name}/scan", response_model=ScanResult)
async def get_scan_results(service_name: str):
    """Get scan results for a service — proxied from nikto-service (Redis-backed)."""
    # Check if service exists in Kubernetes first
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()
    
    # Call nikto-service to get scan results
    try:
        async with httpx.AsyncClient(timeout=5.0) as http_client:
            resp = await http_client.get(f"http://nikto-service.deployer-system.svc.cluster.local:8002/scan/service/{service_name}")
            
            if resp.status_code == 404:
                return ScanResult(
                    service_name=service_name,
                    scan_status="not_scanned",
                    started_at=None,
                    completed_at=None,
                    vulnerabilities=[],
                    total_findings=0,
                    scan_duration=0.0,
                    error=None
                )
            
            resp.raise_for_status()
            return resp.json()
            
    except Exception as e:
        logger.error(f"Failed to fetch scan results: {e}")
        # Return error state or not_scanned
        return ScanResult(
            service_name=service_name,
            scan_status="failed",
            started_at=None,
            completed_at=None,
            vulnerabilities=[],
            total_findings=0,
            scan_duration=0.0,
            error=str(e)
        )


@app.post("/services/{service_name}/ratelimit")
async def set_rate_limit(service_name: str, config: RateLimitConfig):
    """Set rate limit configuration."""
    if not redis_client:
        raise HTTPException(503, "Redis unavailable")
        
    key = f"config:ratelimit:{service_name}"
    try:
        redis_client.set(key, config.model_dump_json())
        logger.info(f"Updated rate limit for {service_name}: {config}")
        return {"status": "updated", "config": config}
    except Exception as e:
        logger.error(f"Failed to set rate limit: {e}")
        raise HTTPException(500, detail=str(e))


@app.get("/services/{service_name}/ratelimit", response_model=RateLimitConfig)
async def get_rate_limit(service_name: str):
    """Get rate limit configuration."""
    if not redis_client:
        return RateLimitConfig()
        
    key = f"config:ratelimit:{service_name}"
    try:
        data = redis_client.get(key)
        if data:
            return RateLimitConfig.model_validate_json(data)
        return RateLimitConfig()
    except Exception as e:
        logger.error(f"Failed to get rate limit: {e}")
        return RateLimitConfig()


@app.get("/services/{service_name}/apis")
async def get_service_apis(service_name: str):
    """Detect and return API documentation info for a service."""
    # Check if deployment exists
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()
    
    # Get service port
    try:
        core_v1 = client.CoreV1Api()
        svc = core_v1.read_namespaced_service(name=f"{service_name}-service", namespace="user-services")
        port = svc.spec.ports[0].port
        target_url = f"http://{service_name}-service.user-services.svc.cluster.local:{port}"
    except Exception as e:
        logger.warning(f"Failed to resolve service port for {service_name}: {e}")
        target_url = f"http://{service_name}-service.user-services.svc.cluster.local:8000"

    # Call nikto-service to discover
    try:
        async with httpx.AsyncClient(timeout=5.0) as http_client:
            resp = await http_client.post(
                "http://nikto-service.deployer-system.svc.cluster.local:8002/discover",
                json={"target_url": target_url}
            )
            data = resp.json()
            # Enrich with public gateway URL
            if data.get("status") == "found" and data.get("spec_path"):
                # The browser can access via Gateway
                # http://localhost:30080/{service_name}{spec_path}
                # But we should return the relative path from gateway root or full URL?
                # Let's return the full gateway URL relative to current host
                # The frontend knows the Gateway URL usually, but let's be helpful.
                # Actually, just return path relevant to gateway.
                # Gateway maps /{service_name} -> {target_url}
                # So if spec is at /openapi.json, public is /{service_name}/openapi.json
                data["public_url"] = f"/{service_name}{data['spec_path']}"
            
            return data
    except Exception as e:
        logger.error(f"Discovery failed: {e}")
        return {"status": "error", "spec_path": None}


@app.get("/health")
async def health():
    return {"status": "healthy"}
