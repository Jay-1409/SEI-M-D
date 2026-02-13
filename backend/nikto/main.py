"""
Nikto Service - Handles vulnerability scanning with Nikto
Scan results are persisted in Redis.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import logging
import uuid
import json
import os
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nikto-service")

app = FastAPI(title="Nikto Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
REDIS_HOST = os.getenv("REDIS_HOST", "redis-service.deployer-system.svc.cluster.local")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    redis_client.ping()
    logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    logger.warning(f"Redis connection failed: {e}. Will retry on requests.")
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


class Vulnerability(BaseModel):
    id: str
    severity: str
    description: str
    url: Optional[str] = None
    method: Optional[str] = None


class ScanRequest(BaseModel):
    target_url: str
    service_name: str


class ScanResult(BaseModel):
    scan_id: str
    service_name: str
    scan_status: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    vulnerabilities: list[Vulnerability] = []
    total_findings: int = 0
    scan_duration: float = 0
    error: Optional[str] = None


# ── Redis helpers ──────────────────────────────────────────────

def _save_scan(scan_result: ScanResult):
    """Save scan result to Redis."""
    key = f"scan:{scan_result.scan_id}"
    service_key = f"service_scan:{scan_result.service_name}"
    data = scan_result.model_dump_json()
    redis_client.set(key, data)
    # Also store latest scan_id per service for quick lookup
    redis_client.set(service_key, scan_result.scan_id)
    logger.info(f"Saved scan {scan_result.scan_id} to Redis")


def _get_scan(scan_id: str) -> Optional[ScanResult]:
    """Get scan result from Redis."""
    key = f"scan:{scan_id}"
    data = redis_client.get(key)
    if data:
        return ScanResult.model_validate_json(data)
    return None


def _get_scan_by_service(service_name: str) -> Optional[ScanResult]:
    """Get the latest scan result for a service."""
    service_key = f"service_scan:{service_name}"
    scan_id = redis_client.get(service_key)
    if scan_id:
        return _get_scan(scan_id)
    return None


def _list_all_scans() -> list[ScanResult]:
    """List all scan results from Redis."""
    results = []
    keys = redis_client.keys("scan:*")
    for key in keys:
        data = redis_client.get(key)
        if data:
            results.append(ScanResult.model_validate_json(data))
    return results


import httpx

# ... (existing imports)

# ... (existing Redis helpers)

# ── Endpoints ──────────────────────────────────────────────────

@app.post("/discover")
async def discover_api(payload: dict):
    """Detect if the service exposes an OpenAPI/Swagger specification."""
    target_url = payload.get("target_url")
    if not target_url:
        raise HTTPException(status_code=400, detail="Missing target_url")

    # Common locations for OpenAPI specs
    paths = [
        "/openapi.json", 
        "/swagger.json", 
        "/api/openapi.json", 
        "/v1/openapi.json",
        "/docs/openapi.json"
    ]
    
    async with httpx.AsyncClient(timeout=3.0, verify=False) as client:
        for path in paths:
            try:
                url = f"{target_url.rstrip('/')}{path}"
                logger.info(f"Probing {url} for OpenAPI spec...")
                resp = await client.get(url)
                
                if resp.status_code == 200:
                    try:
                        # Validation: is it JSON and does it look like OpenAPI?
                            data = resp.json()
                            if "openapi" in data or "swagger" in data:
                                version = data.get("openapi") or data.get("swagger")
                                logger.info(f"Found OpenAPI {version} at {path}")
                                return {
                                    "spec_path": path, 
                                    "type": "openapi", 
                                    "version": version,
                                    "status": "found",
                                    "spec_content": data  # Return actual content
                                }
                    except json.JSONDecodeError:
                        continue
            except Exception as e:
                logger.warning(f"Probe failed for {url}: {e}")
                continue
    
    # Not found
    return {"status": "not_found", "spec_path": None}

def run_nikto_scan(scan_id: str, target_url: str):
    """Background task to run Nikto scan."""
    # Retrieve current state
    scan_result = _get_scan(scan_id)
    if not scan_result:
        logger.error(f"Scan {scan_id} not found for background execution")
        return

    try:
        # Run Nikto scan
        result = subprocess.run([
            'nikto',
            '-h', target_url,
            '-Tuning', '123456789abc',  # All scan types
            '-maxtime', '60',  # 1 minute max
            '-nointeractive'  # No prompts
        ], capture_output=True, text=True, timeout=90)
        
        logger.info(f"Nikto exit code: {result.returncode}")
        
        # Parse Nikto text output
        vulnerabilities = []
        output_text = result.stdout + "\n" + result.stderr
        
        for line in output_text.split('\n'):
            line = line.strip()
            # Look for vulnerability lines
            if line.startswith('+') and '[' in line and ']' in line:
                # Skip headers
                if any(skip in line for skip in ['Target IP', 'Target Hostname', 'Server:', 
                                                   'Start Time', 'End Time', 'host(s) tested', 
                                                   'Scan terminated']):
                    continue
                
                # Extract vulnerability
                try:
                    vuln_id_start = line.index('[') + 1
                    vuln_id_end = line.index(']')
                    vuln_id = line[vuln_id_start:vuln_id_end]
                    
                    desc_start = line.index(']') + 1
                    description = line[desc_start:].strip().lstrip(':').strip()
                    
                    # Classify severity
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
                except (ValueError, IndexError):
                    continue
        
        # Update scan result
        scan_result.scan_status = "completed"
        scan_result.completed_at = datetime.utcnow().isoformat()
        scan_result.vulnerabilities = vulnerabilities
        scan_result.total_findings = len(vulnerabilities)
        
        # Calculate duration
        if scan_result.started_at:
            started = datetime.fromisoformat(scan_result.started_at)
            completed = datetime.fromisoformat(scan_result.completed_at)
            scan_result.scan_duration = (completed - started).total_seconds()
        
        # Persist to Redis
        _save_scan(scan_result)
        
        logger.info(f"Scan {scan_id} completed: {len(vulnerabilities)} findings")
        
    except subprocess.TimeoutExpired:
        scan_result.scan_status = "failed"
        scan_result.error = "Scan timeout"
        _save_scan(scan_result)
        logger.error(f"Scan {scan_id} timed out")
    except Exception as e:
        scan_result.scan_status = "failed"
        scan_result.error = str(e)
        _save_scan(scan_result)
        logger.error(f"Scan {scan_id} failed: {e}")


@app.post("/scan", response_model=ScanResult)
async def trigger_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """Trigger a Nikto vulnerability scan."""
    scan_id = str(uuid.uuid4())
    
    logger.info(f"Queueing scan {scan_id} for {request.service_name} at {request.target_url}")
    
    # Initialize scan result
    scan_result = ScanResult(
        scan_id=scan_id,
        service_name=request.service_name,
        scan_status="running",
        started_at=datetime.utcnow().isoformat()
    )
    _save_scan(scan_result)
    
    # Run scan in background task
    background_tasks.add_task(run_nikto_scan, scan_id, request.target_url)
    
    return scan_result


@app.get("/scan/{scan_id}", response_model=ScanResult)
async def get_scan_result(scan_id: str):
    """Get scan results by scan ID."""
    result = _get_scan(scan_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found")
    return result


@app.get("/scan/service/{service_name}", response_model=ScanResult)
async def get_scan_by_service(service_name: str):
    """Get the latest scan result for a service by name."""
    result = _get_scan_by_service(service_name)
    if not result:
        raise HTTPException(status_code=404, detail=f"No scan found for service '{service_name}'")
    return result


@app.get("/scans")
async def list_scans():
    """List all scans."""
    return _list_all_scans()


@app.get("/health")
def health():
    try:
        redis_client.ping()
        redis_status = "connected"
    except Exception:
        redis_status = "disconnected"
    return {"status": "healthy", "service": "nikto-service", "redis": redis_status}
