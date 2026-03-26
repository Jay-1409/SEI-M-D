from copy import deepcopy
from datetime import datetime, timezone
import re
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


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
    title="Expo XSS Feedback Service",
    description="Intentionally simple comment service used by the live XSS expo demo.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CommentRequest(BaseModel):
    author: str = Field(min_length=1, max_length=40)
    comment: str = Field(min_length=1, max_length=5000)


comments_store = deepcopy(SEEDED_COMMENTS)


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def serialize_comments():
    return deepcopy(comments_store)


def is_suspicious_comment(comment: str) -> bool:
    return any(pattern.search(comment) for pattern in SUSPICIOUS_PATTERNS)


@app.get("/")
async def root():
    return {
        "service": "expo-xss-demo-service",
        "status": "ready",
        "message": "Use GET /comments and POST /comments for the live XSS expo demo.",
        "timestamp": iso_now(),
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": iso_now()}


@app.get("/comments")
async def get_comments():
    return {
        "result": "ok",
        "service": "expo-xss-demo-service",
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
        "proof": "Gateway forwarded the request to the feedback service.",
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
