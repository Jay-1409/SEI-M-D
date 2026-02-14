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



# Redis connection
REDIS_HOST = os.getenv("REDIS_HOST", "redis-service.deployer-system.svc.cluster.local")
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)
except Exception as e:
    logger.warning(f"Redis connection failed: {e}")
    redis_client = None


@app.on_event("startup")
async def startup_event():
    """Sync in-memory state with actual Kubernetes state on startup."""
    logger.info("Deployer service starting... syncing with Kubernetes.")
    try:
        config.load_incluster_config()
    except:
        try:
            config.load_kube_config()
        except:
            logger.warning("Could not load K8s config, skipping sync.")
            return

    apps_v1 = client.AppsV1Api()
    
    try:
        # List items in user-services namespace
        namespace = "user-services"
        deployments = apps_v1.list_namespaced_deployment(namespace=namespace)
        
        async with httpx.AsyncClient() as http_client:
            for dep in deployments.items:
                name = dep.metadata.name
                
                # Try to extract info
                try:
                    container = dep.spec.template.spec.containers[0]
                    image = container.image
                    # Best effort port extraction
                    port = 80
                    if container.ports:
                        port = container.ports[0].container_port
                    
                    status = "deployed"
                    if not dep.status.ready_replicas:
                        status = "stopped"
                        
                    public_url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/{name}"
                    
                    # Add to memory
                    deployed_services[name] = ServiceInfo(
                        service_name=name,
                        docker_image=image,
                        container_port=port,
                        public_url=public_url,
                        status=status,
                        scan_status="unscanned" # Reset scan status as we don't store it persistently yet
                    )
                    logger.info(f"Discovered existing service: {name}")

                    # Re-register with Gateway (fire and forget-ish)
                    try:
                        service_fqdn = f"http://{name}-service.user-services.svc.cluster.local:{port}"
                        await http_client.post(
                            f"{GATEWAY_REGISTER_URL}/register",
                            json={
                                "service_name": name,
                                "target_url": service_fqdn,
                            },
                        )
                    except Exception as gw_e:
                        logger.warning(f"Failed to re-register {name} with gateway: {gw_e}")

                except Exception as parse_e:
                    logger.warning(f"Failed to parse deployment {name}: {parse_e}")

    except Exception as e:
        logger.error(f"Failed to sync with Kubernetes: {e}")


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


@app.post("/services/{service_name}/redeploy")
async def redeploy_service_endpoint(service_name: str, req: DeployRequest):
    """Restart a service deployment and re-sync gateway route."""
    
    # Load K8s config
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()
    
    # 1. Update Deployment (or just restart if no changes)
    # We'll use the provided image and port to ensure it matches intent
    try:
        # Check if deployment exists
        apps_v1 = client.AppsV1Api()
        try:
            deployment = apps_v1.read_namespaced_deployment(name=service_name, namespace="user-services")
            
            # Update image if changed
            if deployment.spec.template.spec.containers[0].image != req.docker_image:
                deployment.spec.template.spec.containers[0].image = req.docker_image
                apps_v1.patch_namespaced_deployment(name=service_name, namespace="user-services", body=deployment)
                logger.info(f"Updated image for {service_name} to {req.docker_image}")

            # Trigger rollout restart with zero-downtime strategy
            # Ensure replicas >= 1 (service may have been stopped/scaled to 0)
            current_replicas = deployment.spec.replicas or 0
            patch = {
                "spec": {
                    "replicas": max(current_replicas, 1),
                    "strategy": {
                        "type": "RollingUpdate",
                        "rollingUpdate": {
                            "maxSurge": 1,
                            "maxUnavailable": 0
                        }
                    },
                    "template": {
                        "metadata": {
                            "annotations": {
                                "kubectl.kubernetes.io/restartedAt": datetime.utcnow().isoformat()
                            }
                        }
                    }
                }
            }
            apps_v1.patch_namespaced_deployment(name=service_name, namespace="user-services", body=patch)
            logger.info(f"Triggered rollout restart for {service_name}")

            # Ensure K8s Service still exists (it may have been deleted)
            try:
                core_v1 = client.CoreV1Api()
                core_v1.read_namespaced_service(name=f"{service_name}-service", namespace="user-services")
            except client.exceptions.ApiException as svc_e:
                if svc_e.status == 404:
                    logger.info(f"K8s Service missing for {service_name}, recreating...")
                    create_service(service_name, req.container_port)
                else:
                    logger.warning(f"Error checking K8s Service: {svc_e}")

        except client.exceptions.ApiException as e:
            if e.status == 404:
                # If not found, create it (fallback to deploy)
                logger.info(f"Service {service_name} not found, creating new deployment...")
                create_deployment(service_name, req.docker_image, req.container_port)
                create_service(service_name, req.container_port)
            else:
                raise e

    except Exception as e:
        logger.error(f"Failed to redeploy: {e}")
        raise HTTPException(status_code=500, detail=f"Redeploy failed: {str(e)}")

    # 2. Force Re-register route in gateway
    try:
        async with httpx.AsyncClient() as http_client:
            service_fqdn = f"http://{service_name}-service.user-services.svc.cluster.local:{req.container_port}"
            resp = await http_client.post(
                f"{GATEWAY_REGISTER_URL}/register",
                json={
                    "service_name": service_name,
                    "target_url": service_fqdn,
                },
            )
            resp.raise_for_status()
            logger.info(f"Re-registered route in gateway for {service_name}")
    except Exception as e:
        logger.warning(f"Gateway re-registration failed: {e}")

    # 3. Update Registry
    public_url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/{service_name}"
    
    info = ServiceInfo(
        service_name=service_name,
        docker_image=req.docker_image,
        container_port=req.container_port,
        public_url=public_url,
        status="deployed"
    )
    deployed_services[service_name] = info

    return {"status": "success", "message": f"Service '{service_name}' redeployed"}


@app.post("/services/{service_name}/stop")
async def stop_service(service_name: str):
    """Stop a service by scaling its deployment to 0 replicas."""
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()

    apps_v1 = client.AppsV1Api()

    try:
        # Scale to 0
        patch = {"spec": {"replicas": 0}}
        apps_v1.patch_namespaced_deployment(name=service_name, namespace="user-services", body=patch)
        logger.info(f"Stopped service (scaled to 0): {service_name}")
    except client.exceptions.ApiException as e:
        if e.status == 404:
            raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")
        raise HTTPException(status_code=500, detail=f"Failed to stop: {str(e)}")

    # Deregister from gateway
    try:
        async with httpx.AsyncClient() as http_client:
            await http_client.delete(f"{GATEWAY_REGISTER_URL}/register/{service_name}")
    except Exception as e:
        logger.warning(f"Gateway deregistration failed: {e}")

    # Update in-memory status
    if service_name in deployed_services:
        deployed_services[service_name].status = "stopped"

    return {"status": "success", "message": f"Service '{service_name}' stopped"}


@app.post("/services/{service_name}/start")
async def start_service(service_name: str):
    """Start a stopped service by scaling its deployment to 1 replica."""
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()

    apps_v1 = client.AppsV1Api()

    try:
        # Scale to 1
        patch = {"spec": {"replicas": 1}}
        apps_v1.patch_namespaced_deployment(name=service_name, namespace="user-services", body=patch)
        logger.info(f"Started service (scaled to 1): {service_name}")
    except client.exceptions.ApiException as e:
        if e.status == 404:
            raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")
        raise HTTPException(status_code=500, detail=f"Failed to start: {str(e)}")

    # Re-register with gateway
    try:
        # Get deployment info for port
        dep = apps_v1.read_namespaced_deployment(name=service_name, namespace="user-services")
        port = 80
        if dep.spec.template.spec.containers[0].ports:
            port = dep.spec.template.spec.containers[0].ports[0].container_port

        service_fqdn = f"http://{service_name}-service.user-services.svc.cluster.local:{port}"
        async with httpx.AsyncClient() as http_client:
            await http_client.post(
                f"{GATEWAY_REGISTER_URL}/register",
                json={"service_name": service_name, "target_url": service_fqdn},
            )
    except Exception as e:
        logger.warning(f"Gateway registration failed: {e}")

    # Update in-memory status
    if service_name in deployed_services:
        deployed_services[service_name].status = "deployed"

    return {"status": "success", "message": f"Service '{service_name}' started"}


@app.post("/services/{service_name}/rename")
async def rename_service(service_name: str, payload: dict):
    """
    Rename a deployed service:
      1. Create new K8s deployment + service with the new name
      2. Register new name in gateway
      3. Deregister old name from gateway
      4. Delete old K8s deployment + service
      5. Migrate Redis data (WAF config, rate limit, scan results)
      6. Update in-memory registry
    """
    new_name = payload.get("new_name", "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="new_name is required")

    import re as _re
    if not _re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$', new_name):
        raise HTTPException(status_code=400, detail="Name must be lowercase alphanumeric with hyphens only")

    if new_name == service_name:
        raise HTTPException(status_code=400, detail="New name is same as current name")

    # Load K8s config
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()

    apps_v1 = client.AppsV1Api()
    core_v1 = client.CoreV1Api()

    # Check old service exists
    try:
        old_dep = apps_v1.read_namespaced_deployment(name=service_name, namespace="user-services")
    except client.exceptions.ApiException as e:
        if e.status == 404:
            raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")
        raise

    # Check new name doesn't already exist
    try:
        apps_v1.read_namespaced_deployment(name=new_name, namespace="user-services")
        raise HTTPException(status_code=409, detail=f"Service '{new_name}' already exists")
    except client.exceptions.ApiException as e:
        if e.status != 404:
            raise

    # Get the container info from old deployment
    container = old_dep.spec.template.spec.containers[0]
    docker_image = container.image
    container_port = container.ports[0].container_port if container.ports else 8000

    # 1. Create new K8s deployment + service
    try:
        create_deployment(new_name, docker_image, container_port)
        logger.info(f"Created new deployment: {new_name}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create new deployment: {e}")

    try:
        create_service(new_name, container_port)
        logger.info(f"Created new service: {new_name}")
    except Exception as e:
        # Rollback: delete the new deployment
        try:
            delete_deployment(new_name)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to create new service: {e}")

    # 2. Register new name in gateway
    try:
        target_url = f"http://{new_name}-service.user-services.svc.cluster.local:{container_port}"
        async with httpx.AsyncClient() as http_client:
            await http_client.post(
                f"{GATEWAY_REGISTER_URL}/register",
                json={"service_name": new_name, "target_url": target_url},
            )
        logger.info(f"Registered new gateway route: {new_name}")
    except Exception as e:
        logger.warning(f"Gateway registration for new name failed: {e}")

    # 3. Deregister old name from gateway
    try:
        async with httpx.AsyncClient() as http_client:
            await http_client.delete(f"{GATEWAY_REGISTER_URL}/register/{service_name}")
        logger.info(f"Deregistered old gateway route: {service_name}")
    except Exception as e:
        logger.warning(f"Gateway deregistration for old name failed: {e}")

    # 4. Delete old K8s resources
    try:
        delete_deployment(service_name)
        delete_service(service_name)
        logger.info(f"Deleted old K8s resources: {service_name}")
    except Exception as e:
        logger.warning(f"Failed to delete old K8s resources: {e}")

    # 5. Migrate Redis data
    if redis_client:
        try:
            keys_to_migrate = [
                f"config:waf:{service_name}",
                f"config:ratelimit:{service_name}",
                f"waf:events:{service_name}",
                f"waf:blocks:{service_name}:total",
                f"waf:blocks:{service_name}:sqli",
                f"waf:blocks:{service_name}:xss",
                f"waf:blocks:{service_name}:headers",
                f"routes:{service_name}",
                f"service_scan:{service_name}",
            ]
            for old_key in keys_to_migrate:
                if redis_client.exists(old_key):
                    new_key = old_key.replace(service_name, new_name, 1)
                    redis_client.rename(old_key, new_key)

            logger.info(f"Migrated Redis data from {service_name} to {new_name}")
        except Exception as e:
            logger.warning(f"Redis migration partial failure: {e}")

    # 6. Update in-memory registry
    if service_name in deployed_services:
        del deployed_services[service_name]

    public_url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/{new_name}"
    deployed_services[new_name] = ServiceInfo(
        service_name=new_name,
        docker_image=docker_image,
        container_port=container_port,
        public_url=public_url,
        status="deployed",
    )

    logger.info(f"Service renamed: {service_name} -> {new_name}")
    return {
        "status": "success",
        "old_name": service_name,
        "new_name": new_name,
        "public_url": public_url,
        "message": f"Service renamed from '{service_name}' to '{new_name}'"
    }


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

        public_url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/{name}"
        
        # Determine real status from K8s state
        desired_replicas = dep.spec.replicas if dep.spec.replicas is not None else 1
        ready_replicas = dep.status.ready_replicas or 0

        if desired_replicas == 0:
            status = "stopped"
        elif ready_replicas >= desired_replicas:
            status = "deployed"
        elif ready_replicas > 0:
            status = "deploying"
        else:
            status = "deploying"

        # Default info
        info = ServiceInfo(
            service_name=name,
            docker_image=image,
            container_port=port,
            public_url=public_url,
            status=status,
            scan_status="unknown",
            last_scan=None,
            vulnerability_count=0
        )

        # Enhance with Scan Data from Redis (Source of Truth)
        if redis_client:
            try:
                # 1. Get latest scan ID
                scan_id = redis_client.get(f"service_scan:{name}")
                if scan_id:
                    # 2. Get scan details
                    scan_data = redis_client.get(f"scan:{scan_id}")
                    if scan_data:
                        scan_result = json.loads(scan_data)
                        info.scan_status = scan_result.get("scan_status", "unknown")
                        info.last_scan = scan_result.get("started_at")
                        info.vulnerability_count = scan_result.get("total_findings", 0)
            except Exception as e:
                logger.warning(f"Failed to fetch scan info for {name} from Redis: {e}")

        result.append(info)
    return result


@app.delete("/services/{service_name}")
async def delete_service_endpoint(service_name: str):
    """Delete a deployed service from user-services namespace."""
    # Check both in-memory registry and Kubernetes
    service_exists_in_k8s = False
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()
    try:
        apps_v1 = client.AppsV1Api()
        apps_v1.read_namespaced_deployment(name=service_name, namespace="user-services")
        service_exists_in_k8s = True
    except client.exceptions.ApiException as e:
        if e.status == 404:
            service_exists_in_k8s = False
        else:
            logger.warning(f"Error checking K8s for {service_name}: {e}")
    except Exception:
        pass

    if service_name not in deployed_services and not service_exists_in_k8s:
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
    if service_name in deployed_services:
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
async def set_rate_limit(service_name: str, rl_config: RateLimitConfig):
    """Set rate limit configuration."""
    if not redis_client:
        raise HTTPException(503, "Redis unavailable")
        
    key = f"config:ratelimit:{service_name}"
    try:
        redis_client.set(key, rl_config.model_dump_json())
        logger.info(f"Updated rate limit for {service_name}: {rl_config}")
        return {"status": "updated", "config": rl_config}
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

    # API Discovery Logic (Decoupled from Nikto)
    paths = [
        "/openapi.json", 
        "/swagger.json", 
        "/api/openapi.json", 
        "/v1/openapi.json",
        "/docs/openapi.json"
    ]

    found_data = {"status": "not_found", "spec_path": None}

    try:
        async with httpx.AsyncClient(timeout=3.0, verify=False) as http_client:
            for path in paths:
                try:
                    url = f"{target_url.rstrip('/')}{path}"
                    logger.info(f"Probing {url} for OpenAPI spec...")
                    resp = await http_client.get(url)
                    
                    if resp.status_code == 200:
                        try:
                            data = resp.json()
                            if "openapi" in data or "swagger" in data:
                                version = data.get("openapi") or data.get("swagger")
                                logger.info(f"Found OpenAPI {version} at {path}")
                                found_data = {
                                    "spec_path": path, 
                                    "type": "openapi", 
                                    "version": version,
                                    "status": "found",
                                    "spec_content": data,
                                    "public_url": f"/{service_name}{path}"
                                }
                                break 
                        except json.JSONDecodeError:
                            continue
                except Exception as e:
                    logger.warning(f"Probe failed for {url}: {e}")
                    continue
    except Exception as e:
        logger.error(f"Discovery failed: {e}")
        return {"status": "error", "spec_path": None}

    return found_data


# ═══════════════════════════════════════════════════════════════
#  WAF Proxy Endpoints (forward to gateway's WAF endpoints)
# ═══════════════════════════════════════════════════════════════

@app.get("/services/{service_name}/waf/config")
async def get_service_waf_config(service_name: str):
    """Get WAF config for a specific service."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.get(f"{GATEWAY_REGISTER_URL}/waf/config/{service_name}")
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch WAF config: {e}")
        raise HTTPException(status_code=502, detail=f"Gateway unreachable: {e}")


@app.post("/services/{service_name}/waf/config")
async def set_service_waf_config(service_name: str, payload: dict):
    """Set WAF config for a specific service."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.post(
                f"{GATEWAY_REGISTER_URL}/waf/config/{service_name}",
                json=payload
            )
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to set WAF config: {e}")
        raise HTTPException(status_code=502, detail=f"Gateway unreachable: {e}")


@app.get("/services/{service_name}/waf/events")
async def get_service_waf_events(service_name: str, limit: int = 50):
    """Get WAF events for a specific service."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.get(
                f"{GATEWAY_REGISTER_URL}/waf/events",
                params={"limit": limit, "service": service_name}
            )
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch WAF events: {e}")
        raise HTTPException(status_code=502, detail=f"Gateway unreachable: {e}")


@app.get("/services/{service_name}/waf/stats")
async def get_service_waf_stats(service_name: str):
    """Get WAF stats for a specific service."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.get(
                f"{GATEWAY_REGISTER_URL}/waf/stats",
                params={"service": service_name}
            )
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch WAF stats: {e}")
        raise HTTPException(status_code=502, detail=f"Gateway unreachable: {e}")


@app.delete("/services/{service_name}/waf/events")
async def clear_service_waf_events(service_name: str):
    """Clear WAF events for a specific service."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.delete(
                f"{GATEWAY_REGISTER_URL}/waf/events",
                params={"service": service_name}
            )
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to clear WAF events: {e}")
        raise HTTPException(status_code=502, detail=f"Gateway unreachable: {e}")


@app.get("/waf/events")
async def get_waf_events(limit: int = 50):
    """Proxy global WAF events from the gateway."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.get(f"{GATEWAY_REGISTER_URL}/waf/events", params={"limit": limit})
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch WAF events: {e}")
        raise HTTPException(status_code=502, detail=f"Gateway unreachable: {e}")


@app.get("/waf/stats")
async def get_waf_stats():
    """Proxy global WAF stats from the gateway."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.get(f"{GATEWAY_REGISTER_URL}/waf/stats")
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch WAF stats: {e}")
        raise HTTPException(status_code=502, detail=f"Gateway unreachable: {e}")


@app.delete("/waf/events")
async def clear_waf_events():
    """Proxy global WAF clear from the gateway."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.delete(f"{GATEWAY_REGISTER_URL}/waf/events")
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to clear WAF events: {e}")
        raise HTTPException(status_code=502, detail=f"Gateway unreachable: {e}")


@app.get("/health")
async def health():
    return {"status": "healthy"}
