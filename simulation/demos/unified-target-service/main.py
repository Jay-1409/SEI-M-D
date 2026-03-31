from copy import deepcopy
from datetime import datetime, timezone
import re
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# --- SQLi Constants ---
NORMAL_USERNAME = "admin"
NORMAL_PASSWORD = "admin123"
ATTACK_PATTERN = re.compile(r"^'\s*or\s*'1'\s*=\s*'1$", re.IGNORECASE)

# --- XSS Constants ---
SUSPICIOUS_PATTERNS = [
    re.compile(r"<script", re.IGNORECASE),
    re.compile(r"onerror\s*=", re.IGNORECASE),
    re.compile(r"onload\s*=", re.IGNORECASE),
    re.compile(r"javascript:", re.IGNORECASE),
]

SEEDED_COMMENTS = [
    {"id": "seed-1", "author": "Riya", "text": "Loved the robotics booth.", "time_label": "2 min ago", "kind": "safe"},
    {"id": "seed-2", "author": "Kabir", "text": "The security project explanation was very clear.", "time_label": "4 min ago", "kind": "safe"},
    {"id": "seed-3", "author": "Neha", "text": "Great event management and good demos.", "time_label": "7 min ago", "kind": "safe"},
]

app = FastAPI(
    title="Expo Unified Target Service",
    description="Intentionally vulnerable/mock target service for testing the platform's Live Gateway Mode.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class LoginRequest(BaseModel):
    username: str
    password: str

class CommentRequest(BaseModel):
    author: str = Field(min_length=1, max_length=40)
    comment: str = Field(min_length=1, max_length=5000)

comments_store = deepcopy(SEEDED_COMMENTS)


# --- Helpers ---
def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

def serialize_comments():
    return deepcopy(comments_store)

def is_suspicious_comment(comment: str) -> bool:
    return any(pattern.search(comment) for pattern in SUSPICIOUS_PATTERNS)


# --- Global Routes ---
@app.get("/")
async def root():
    return {
        "service": "expo-unified-target",
        "status": "ready",
        "message": "Unified target running. Exposes: /login (SQLi), /comments (XSS), /tickets (Rate Limit), /staff/open-maintenance-panel (API Key).",
        "timestamp": iso_now(),
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": iso_now()}


# ==========================================
# 1. SQL Injection Demo Routes
# ==========================================
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


# ==========================================
# 2. XSS Feedback Wall Demo Routes
# ==========================================
@app.get("/comments")
async def get_comments():
    return {
        "result": "ok",
        "service": "expo-unified-target",
        "comments": serialize_comments(),
        "timestamp": iso_now(),
    }

@app.post("/comments", status_code=201)
async def post_comment(payload: CommentRequest):
    comment = {
        "id": f"comment-{uuid4().hex}",
        "author": payload.author.strip(),
        "text": payload.comment.strip(),
        "time_label": "Just now",
        "kind": "malicious" if is_suspicious_comment(payload.comment) else "safe",
    }
    comments_store.insert(0, comment)
    return {
        "result": "accepted",
        "comment_kind": comment["kind"],
        "proof": "Gateway forwarded the request to the unified backend service.",
        "message": "Comment stored by the live expo target service.",
        "comment": comment,
        "comments": serialize_comments(),
        "timestamp": iso_now(),
    }

@app.post("/demo/reset")
async def reset_demo():
    global comments_store
    comments_store = deepcopy(SEEDED_COMMENTS)
    return {
        "result": "reset",
        "message": "Feedback wall returned to the seeded safe comments.",
        "comments": serialize_comments(),
        "timestamp": iso_now(),
    }


# ==========================================
# 3. Rate Limiting Demo Routes
# ==========================================
@app.get("/tickets")
async def tickets(request: Request):
    return {
        "service": "expo-unified-target",
        "result": "allowed",
        "message": "Ticket status checked successfully.",
        "actor": request.headers.get("x-expo-demo-actor", "unknown"),
        "request_id": request.headers.get("x-expo-request-id", ""),
        "timestamp": iso_now(),
    }


# ==========================================
# 4. API Key Protection Demo Routes
# ==========================================
@app.get("/public/help-hours")
async def public_help_hours():
    return {
        "route_type": "public",
        "headline": "Help Desk Hours",
        "hours": "9:00 AM - 5:00 PM",
        "location": "Visitor Support Counter - Ground Floor",
        "message": "This route is intended to stay public for expo proof.",
        "timestamp": iso_now(),
    }

@app.post("/staff/open-maintenance-panel")
async def open_maintenance_panel():
    return {
        "route_type": "protected",
        "panel_status": "open",
        "authorized_session": "granted",
        "message": "Gateway allowed the protected route, so the staff-only action completed.",
        "timestamp": iso_now(),
    }
