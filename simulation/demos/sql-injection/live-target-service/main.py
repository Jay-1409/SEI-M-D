import re
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


NORMAL_USERNAME = "admin"
NORMAL_PASSWORD = "admin123"
ATTACK_PATTERN = re.compile(r"^'\s*or\s*'1'\s*=\s*'1$", re.IGNORECASE)


app = FastAPI(
    title="Expo SQL Injection Demo Service",
    description="Intentionally simple login-like target for the live SQL injection expo demo.",
    version="1.0.0",
)


class LoginRequest(BaseModel):
    username: str
    password: str


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/")
async def root():
    return {
        "service": "expo-sqli-demo-service",
        "status": "ready",
        "message": "Use POST /login with admin/admin123 or the SQLi demo payload.",
        "timestamp": iso_now(),
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": iso_now()}


@app.post("/login")
async def login(payload: LoginRequest):
    username = payload.username.strip()
    password = payload.password.strip()

    if username == NORMAL_USERNAME and password == NORMAL_PASSWORD:
        return {
            "result": "allowed",
            "auth_mode": "normal",
            "access_granted_to": "Admin Dashboard",
            "message": "Correct password accepted by the demo login service.",
            "query_preview": "SELECT * FROM users WHERE username = 'admin' AND password = 'admin123'",
            "timestamp": iso_now(),
        }

    if username == NORMAL_USERNAME and ATTACK_PATTERN.match(password):
        return {
            "result": "allowed",
            "auth_mode": "bypass",
            "access_granted_to": "Admin Dashboard (unauthorized)",
            "message": "Weak login logic treated the SQL injection style payload like a valid match.",
            "proof": "No real password was used",
            "query_preview": "SELECT * FROM users WHERE username = 'admin' AND password = '' OR '1'='1'",
            "timestamp": iso_now(),
        }

    raise HTTPException(
        status_code=401,
        detail={
            "result": "denied",
            "auth_mode": "invalid",
            "message": "Invalid username or password for the expo demo target.",
            "timestamp": iso_now(),
        },
    )
