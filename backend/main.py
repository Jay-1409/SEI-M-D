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
from datetime import datetime
from kubernetes import client, config

from models import DeployRequest, DeployResponse, ServiceInfo, ScanResult, Vulnerability
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

# In-memory storage of scan results
scan_results: dict[str, ScanResult] = {}

GATEWAY_HOST = os.getenv("GATEWAY_HOST", "localhost")
GATEWAY_PORT = os.getenv("GATEWAY_PORT", "30080")
GATEWAY_REGISTER_URL = os.getenv("GATEWAY_REGISTER_URL", "http://gateway-service:8080")

# Initialize Docker client
try:
    docker_client = docker.from_env()
except Exception as e:
    logger.warning(f"Docker client initialization failed: {e}")
    docker_client = None


@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload a Docker image tar file and load it into Docker."""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    if not file.filename.endswith('.tar'):
        raise HTTPException(status_code=400, detail="File must be a .tar Docker image")
    
    logger.info(f"Uploading image: {file.filename}")
    
    # Save uploaded file to temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.tar') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Load image into Docker
        with open(tmp_path, 'rb') as f:
            images = docker_client.images.load(f)
        
        # Get the loaded image name
        if images:
            image = images[0]
            image_name = image.tags[0] if image.tags else image.id
            
            # Inspect image to detect exposed ports
            try:
                image_details = docker_client.images.get(image_name)
                exposed_ports = image_details.attrs.get('Config', {}).get('ExposedPorts', {})
                
                # Extract port numbers from ExposedPorts dict
                # Format: {'8000/tcp': {}, '80/tcp': {}} -> [8000, 80]
                detected_ports = []
                if exposed_ports:
                    for port_spec in exposed_ports.keys():
                        try:
                            port_num = int(port_spec.split('/')[0])
                            detected_ports.append(port_num)
                        except (ValueError, IndexError):
                            continue
                
                suggested_port = detected_ports[0] if detected_ports else None
                
                logger.info(f"Image loaded successfully: {image_name}, detected ports: {detected_ports}")
                
                return {
                    "status": "success",
                    "image_name": image_name,
                    "image_id": image.id[:12],
                    "detected_ports": detected_ports,
                    "suggested_port": suggested_port,
                    "message": f"Image loaded: {image_name}" + (f" (detected port: {suggested_port})" if suggested_port else "")
                }
            except Exception as inspect_error:
                logger.warning(f"Could not inspect image for ports: {inspect_error}")
                # Still return success, just without port detection
                return {
                    "status": "success",
                    "image_name": image_name,
                    "image_id": image.id[:12],
                    "detected_ports": [],
                    "suggested_port": None,
                    "message": f"Image loaded: {image_name}"
                }
        else:
            raise HTTPException(status_code=500, detail="No image loaded from tar file")
    
    except Exception as e:
        logger.error(f"Failed to load image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load image: {str(e)}")
    
    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass



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
        async with httpx.AsyncClient() as client:
            # Use FQDN for cross-namespace service communication
            service_fqdn = f"http://{req.service_name}-service.user-services.svc.cluster.local:{req.container_port}"
            resp = await client.post(
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
        async with httpx.AsyncClient() as client:
            await client.delete(f"{GATEWAY_REGISTER_URL}/register/{service_name}")
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
    
    # 5. Remove scan results if any
    if service_name in scan_results:
        del scan_results[service_name]
    
    logger.info(f"Service '{service_name}' deleted successfully")
    return {"message": f"Service '{service_name}' deleted successfully"}


@app.post("/services/{service_name}/scan")
async def scan_service(service_name: str):
    """Trigger a Nikto vulnerability scan for a deployed service."""
    # Query Kubernetes to get service info
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()
    
    apps_v1 = client.AppsV1Api()
    core_v1 = client.CoreV1Api()
    
    # Check if deployment exists in user-services namespace
    try:
        deployment = apps_v1.read_namespaced_deployment(name=service_name, namespace="user-services")
        container = deployment.spec.template.spec.containers[0]
        container_port = container.ports[0].container_port if container.ports else 8000
    except client.exceptions.ApiException as e:
        if e.status == 404:
            raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")
        raise HTTPException(status_code=500, detail=f"Error querying service: {str(e)}")
    
    # Get or create service info in deployed_services
    if service_name not in deployed_services:
        deployed_services[service_name] = ServiceInfo(
            service_name=service_name,
            docker_image=container.image,
            container_port=container_port,
            public_url=f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/{service_name}",
            status="deployed",
            scan_status="not_scanned",
            last_scan=None,
            vulnerability_count=0
        )
    
    service_info = deployed_services[service_name]
    
    # Check if a scan is already running
    if service_name in scan_results and scan_results[service_name].scan_status == "running":
        raise HTTPException(status_code=409, detail="Scan already in progress")
    
    logger.info(f"Starting Nikto scan for service: {service_name}")
    
    # Initialize scan result
    scan_result = ScanResult(
        service_name=service_name,
        scan_status="running",
        started_at=datetime.utcnow().isoformat()
    )
    scan_results[service_name] = scan_result
    
    # Update service info
    service_info.scan_status = "running"
    service_info.last_scan = scan_result.started_at
    
    # Build FQDN target URL for cross-namespace scanning
    target_url = f"http://{service_name}-service.user-services.svc.cluster.local:{service_info.container_port}"
    
    try:
        # Run Nikto scan
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp_file:
            output_file = tmp_file.name
        
        logger.info(f"Running Nikto against {target_url}")
        
        # Run Nikto without output file - parse from stdout/stderr
        result = subprocess.run([
            'nikto',
            '-h', target_url,
            '-Tuning', '123456789abc',  # All scan types
            '-maxtime', '60',  # 1 minute max for faster testing
            '-nointeractive'  # No prompts
        ], capture_output=True, text=True, timeout=90)
        
        logger.info(f"Nikto exit code: {result.returncode}")
        logger.info(f"Nikto stdout length: {len(result.stdout)}")
        logger.info(f"Nikto stderr length: {len(result.stderr)}")
        
        # Parse Nikto text output (findings are in stdout/stderr)
        vulnerabilities = []
        output_text = result.stdout + "\n" + result.stderr
        
        for line in output_text.split('\n'):
            line = line.strip()
            # Look for vulnerability lines that start with + and contain an ID in brackets
            if line.startswith('+') and '[' in line and ']' in line:
                # Skip headers and non-finding lines
                if 'Target IP' in line or 'Target Hostname' in line or 'Server:' in line:
                    continue
                if 'Start Time' in line or 'End Time' in line:
                    continue
                if 'host(s) tested' in line or 'Scan terminated' in line:
                    continue
                    
                # Extract vulnerability ID from [XXXXXX] format
                try:
                    vuln_id_start = line.index('[') + 1
                    vuln_id_end = line.index(']')
                    vuln_id = line[vuln_id_start:vuln_id_end]
                    
                    # Get description (everything after ]: )
                    desc_start = line.index(']') + 1
                    description = line[desc_start:].strip().lstrip(':').strip()
                    
                    # Classify severity based on keywords
                    severity = "info"
                    desc_lower = description.lower()
                    if any(word in desc_lower for word in ['critical', 'exploit', 'injection', 'xss', 'sql']):
                        severity = "critical"
                    elif any(word in desc_lower for word in ['outdated', 'version', 'disclosure']):
                        severity = "medium"
                    elif any(word in desc_lower for word in ['missing', 'header', 'interesting']):
                        severity = "low"
                    
                    vulnerabilities.append(Vulnerability(
                        id=f"NIKTO-{vuln_id}",
                        severity=severity,
                        description=description,
                        url=target_url,
                        method=None
                    ))
                except (ValueError, IndexError) as e:
                    logger.debug(f"Could not parse line: {line}, error: {e}")
                    continue
        
        # Update scan result
        scan_result.scan_status = "completed"
        scan_result.completed_at = datetime.utcnow().isoformat()
        scan_result.vulnerabilities = vulnerabilities
        scan_result.total_findings = len(vulnerabilities)
        
        # Calculate duration
        started = datetime.fromisoformat(scan_result.started_at)
        completed = datetime.fromisoformat(scan_result.completed_at)
        scan_result.scan_duration = (completed - started).total_seconds()
        
        # Update service info
        service_info.scan_status = "completed"
        service_info.vulnerability_count = len(vulnerabilities)
        
        logger.info(f"Scan completed for {service_name}: {len(vulnerabilities)} findings")
        
        # Cleanup
        try:
            os.unlink(output_file)
        except Exception:
            pass
        
        return scan_result
        
    except subprocess.TimeoutExpired:
        scan_result.scan_status = "failed"
        scan_result.error = "Scan timed out after 5 minutes"
        service_info.scan_status = "failed"
        raise HTTPException(status_code=408, detail="Scan timed out")
    
    except Exception as e:
        logger.error(f"Scan failed for {service_name}: {e}")
        scan_result.scan_status = "failed"
        scan_result.error = str(e)
        service_info.scan_status = "failed"
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@app.get("/services/{service_name}/scan", response_model=ScanResult)
async def get_scan_results(service_name: str):
    """Get scan results for a service."""
    # Check if service exists in Kubernetes first
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()
    
    apps_v1 = client.AppsV1Api()
    
    try:
        apps_v1.read_namespaced_deployment(name=service_name, namespace="user-services")
    except client.exceptions.ApiException as e:
        if e.status == 404:
            raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")
    
    # Return scan results if available
    if service_name in scan_results:
        return scan_results[service_name]
    
    # Return default not scanned result
    return ScanResult(
        service_name=service_name,
        scan_status="not_scanned",
        started_at=None,
        completed_at=None,
        vulnerabilities=[],
        total_findings=0,
        scan_duration=0,
        error=None
    )


def _map_nikto_severity(osvdb: str) -> str:
    """Map OSVDB or other identifiers to severity levels."""
    # Simplified severity mapping
    if not osvdb:
        return "info"
    return "medium"  # Default to medium for now


def _parse_nikto_text(output: str) -> list[Vulnerability]:
    """Fallback parser for Nikto text output."""
    vulnerabilities = []
    lines = output.split('\n')
    
    for line in lines:
        if '+' in line and ('OSVDB' in line or 'vulnerability' in line.lower()):
            vulnerabilities.append(Vulnerability(
                id="NIKTO-TEXT",
                severity="medium",
                description=line.strip(),
                url=None,
                method=None
            ))
    
    return vulnerabilities


@app.get("/health")
async def health():
    return {"status": "healthy"}
