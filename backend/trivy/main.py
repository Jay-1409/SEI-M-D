"""
Trivy Service - Handles container image vulnerability scanning
Scan results are persisted in Redis and checked before deployment.
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
from typing import Optional, List
import redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trivy-service")

app = FastAPI(title="Trivy Scanner Service", version="1.0.0")

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


class VulnerabilityItem(BaseModel):
    id: str
    severity: str
    pkg_name: str
    installed_version: str
    fixed_version: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class TrivyScanRequest(BaseModel):
    image_name: str


class TrivyScanResult(BaseModel):
    scan_id: str
    image_name: str
    scan_status: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    vulnerabilities: List[VulnerabilityItem] = []
    total_findings: int = 0
    critical_findings: int = 0
    high_findings: int = 0
    scan_duration: float = 0
    error: Optional[str] = None


# ── Redis helpers ──────────────────────────────────────────────

def _save_scan(scan_result: TrivyScanResult):
    """Save scan result to Redis."""
    key = f"trivy_scan:{scan_result.scan_id}"
    image_key = f"image_scan:{scan_result.image_name}"
    data = scan_result.model_dump_json()
    redis_client.set(key, data)
    # Also store latest scan_id per image for quick lookup
    redis_client.set(image_key, scan_result.scan_id)
    logger.info(f"Saved Trivy scan {scan_result.scan_id} to Redis")


def _get_scan(scan_id: str) -> Optional[TrivyScanResult]:
    """Get scan result from Redis."""
    key = f"trivy_scan:{scan_id}"
    data = redis_client.get(key)
    if data:
        return TrivyScanResult.model_validate_json(data)
    return None


def _get_scan_by_image(image_name: str) -> Optional[TrivyScanResult]:
    """Get the latest scan result for an image."""
    image_key = f"image_scan:{image_name}"
    scan_id = redis_client.get(image_key)
    if scan_id:
        return _get_scan(scan_id)
    return None


@app.post("/scan", response_model=TrivyScanResult)
async def trigger_scan(request: TrivyScanRequest, background_tasks: BackgroundTasks):
    """Trigger a Trivy vulnerability scan."""
    scan_id = str(uuid.uuid4())
    logger.info(f"Queueing Trivy scan {scan_id} for image {request.image_name}")

    # Initialize scan result
    scan_result = TrivyScanResult(
        scan_id=scan_id,
        image_name=request.image_name,
        scan_status="running",
        started_at=datetime.utcnow().isoformat()
    )
    _save_scan(scan_result)

    # Run scan in background task - directly parsing output
    background_tasks.add_task(run_trivy_scan, scan_id, request.image_name)

    return scan_result


def run_trivy_scan(scan_id: str, image_name: str):
    """Background task to run Trivy scan."""
    scan_result = _get_scan(scan_id)
    if not scan_result:
        logger.error(f"Scan {scan_id} not found for background execution")
        return

    try:
        # Download vulnerability DB logic is internal to Trivy
        trivy_cmd = [
            'trivy',
            'image',
            '--format', 'json',
            '--no-progress',
            '--ignore-unfixed',
            image_name
        ]
        
        logger.info(f"Running Trivy command: {' '.join(trivy_cmd)}")
        result = subprocess.run(trivy_cmd, capture_output=True, text=True, timeout=300)
        
        # Trivy exit codes: 0 = success, other = error
        # If --exit-code is not set, it defaults to 0 even if vulnerabilities are found.
        # Exit code 1 indicates a fatal error (e.g., image not found).
        if result.returncode != 0:
            logger.error(f"Trivy scan failed: {result.stderr}")
            raise Exception(f"Trivy CLI error: {result.stderr or result.stdout}")

        if not result.stdout.strip():
            raise Exception("Trivy returned empty output instead of JSON.")

        # Parse JSON output
        try:
            scan_data = json.loads(result.stdout)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Trivy JSON: {e}\nSTDOUT: {result.stdout[:200]}")
            raise Exception("Trivy returned invalid JSON output.")
        
        vulnerabilities = []
        critical_count = 0
        high_count = 0
        results = scan_data.get('Results', [])
        
        for res in results:
            target_vulns = res.get('Vulnerabilities', [])
            for v in target_vulns:
                sev = v.get('Severity', 'UNKNOWN').upper()
                if sev == "CRITICAL":
                    critical_count += 1
                elif sev == "HIGH":
                    high_count += 1
                    
                vulnerabilities.append(VulnerabilityItem(
                    id=v.get('VulnerabilityID', 'UNKNOWN'),
                    severity=sev,
                    pkg_name=v.get('PkgName', 'UNKNOWN'),
                    installed_version=v.get('InstalledVersion', 'UNKNOWN'),
                    fixed_version=v.get('FixedVersion', ''),
                    title=v.get('Title', ''),
                    description=v.get('Description', '')[:500] if v.get('Description') else ''
                ))

        # Update scan result
        scan_result.scan_status = "completed"
        scan_result.completed_at = datetime.utcnow().isoformat()
        scan_result.vulnerabilities = vulnerabilities
        scan_result.total_findings = len(vulnerabilities)
        scan_result.critical_findings = critical_count
        scan_result.high_findings = high_count

        # Calculate duration
        if scan_result.started_at:
            started = datetime.fromisoformat(scan_result.started_at)
            completed = datetime.fromisoformat(scan_result.completed_at)
            scan_result.scan_duration = (completed - started).total_seconds()

        # Persist to Redis
        _save_scan(scan_result)

        logger.info(f"Trivy Scan {scan_id} completed: {len(vulnerabilities)} findings ({critical_count} CRITICAL)")

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


@app.get("/scan/{scan_id}", response_model=TrivyScanResult)
async def get_scan_result(scan_id: str):
    """Get scan results by scan ID."""
    result = _get_scan(scan_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Trivy scan '{scan_id}' not found")
    return result


@app.get("/scan/image/{image_name:path}", response_model=TrivyScanResult)
async def get_scan_by_image(image_name: str):
    """Get the latest scan result for an image by name."""
    result = _get_scan_by_image(image_name)
    if not result:
        raise HTTPException(status_code=404, detail=f"No scan found for image '{image_name}'")
    return result


@app.get("/health")
def health():
    try:
        redis_client.ping()
        redis_status = "connected"
    except Exception:
        redis_status = "disconnected"
    return {"status": "healthy", "service": "trivy-service", "redis": redis_status}
