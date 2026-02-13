from pydantic import BaseModel, Field
from typing import Optional
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DeployRequest(BaseModel):
    service_name: str
    docker_image: str
    container_port: int


class DeployResponse(BaseModel):
    status: str
    service_name: str
    public_url: str
    message: str


class Vulnerability(BaseModel):
    id: str
    severity: str  # "critical", "high", "medium", "low", "info"
    description: str
    url: Optional[str] = None
    method: Optional[str] = None


class ScanResult(BaseModel):
    service_name: str
    scan_status: str  # "running", "completed", "failed"
    started_at: str
    completed_at: Optional[str] = None
    vulnerabilities: List[Vulnerability] = []
    total_findings: int = 0
    scan_duration: Optional[float] = None  # seconds
    error: Optional[str] = None


class ServiceInfo(BaseModel):
    service_name: str
    docker_image: str
    container_port: int
    public_url: str
    status: str
    last_scan: Optional[str] = None  # ISO timestamp
    scan_status: Optional[str] = None  # "running", "completed", "failed", None
    vulnerability_count: int = 0
