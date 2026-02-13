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
            resp = await client.post(
                f"{GATEWAY_REGISTER_URL}/register",
                json={
                    "service_name": req.service_name,
                    "target_url": f"http://{req.service_name}-service:{req.container_port}",
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
    """Return all deployed services."""
    return list(deployed_services.values())


@app.delete("/services/{service_name}")
async def remove_service(service_name: str):
    """Tear down a deployed microservice."""
    if service_name not in deployed_services:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")

    try:
        delete_deployment(service_name)
    except Exception as e:
        logger.error(f"Failed to delete deployment: {e}")

    try:
        delete_service(service_name)
    except Exception as e:
        logger.error(f"Failed to delete service: {e}")

    # Deregister from gateway
    try:
        async with httpx.AsyncClient() as client:
            await client.delete(f"{GATEWAY_REGISTER_URL}/register/{service_name}")
    except Exception as e:
        logger.warning(f"Gateway deregistration failed: {e}")

    del deployed_services[service_name]
    return {"status": "deleted", "service_name": service_name}


@app.post("/services/{service_name}/scan")
async def scan_service(service_name: str):
    """Trigger a Nikto vulnerability scan for a deployed service."""
    if service_name not in deployed_services:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")
    
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
    
    # Build internal service URL
    target_url = f"http://{service_name}-service:{service_info.container_port}"
    
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
    if service_name not in scan_results:
        raise HTTPException(status_code=404, detail=f"No scan results found for '{service_name}'")
    
    return scan_results[service_name]


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
