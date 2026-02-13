"""
Nikto Service - Handles vulnerability scanning with Nikto
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import logging
import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

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


# In-memory storage of scan results
scan_results: dict[str, ScanResult] = {}


@app.post("/scan", response_model=ScanResult)
async def trigger_scan(request: ScanRequest):
    """Trigger a Nikto vulnerability scan."""
    scan_id = str(uuid.uuid4())
    
    logger.info(f"Starting scan {scan_id} for {request.service_name} at {request.target_url}")
    
    # Initialize scan result
    scan_result = ScanResult(
        scan_id=scan_id,
        service_name=request.service_name,
        scan_status="running",
        started_at=datetime.utcnow().isoformat()
    )
    scan_results[scan_id] = scan_result
    
    try:
        # Run Nikto scan
        result = subprocess.run([
            'nikto',
            '-h', request.target_url,
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
                        url=request.target_url,
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
        started = datetime.fromisoformat(scan_result.started_at)
        completed = datetime.fromisoformat(scan_result.completed_at)
        scan_result.scan_duration = (completed - started).total_seconds()
        
        logger.info(f"Scan {scan_id} completed: {len(vulnerabilities)} findings")
        
        return scan_result
    
    except subprocess.TimeoutExpired:
        scan_result.scan_status = "failed"
        scan_result.error = "Scan timeout"
        logger.error(f"Scan {scan_id} timed out")
        raise HTTPException(status_code=500, detail="Scan timed out")
    
    except Exception as e:
        scan_result.scan_status = "failed"
        scan_result.error = str(e)
        logger.error(f"Scan {scan_id} failed: {e}")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@app.get("/scan/{scan_id}", response_model=ScanResult)
async def get_scan_result(scan_id: str):
    """Get scan results by scan ID."""
    if scan_id not in scan_results:
        raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found")
    
    return scan_results[scan_id]


@app.get("/scans")
async def list_scans():
    """List all scans."""
    return list(scan_results.values())


@app.get("/health")
def health():
    return {"status": "healthy", "service": "nikto-service"}
