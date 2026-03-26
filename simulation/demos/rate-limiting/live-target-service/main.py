from datetime import datetime, timezone

from fastapi import FastAPI, Request


app = FastAPI(
    title="Expo Rate Limiting Demo Service",
    description="Stable target service for the live rate limiting expo demo.",
    version="1.0.0",
)


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/")
async def root():
    return {
        "service": "expo-rate-limit-demo-service",
        "status": "ready",
        "message": "Use GET /tickets through the gateway to demonstrate real 429 rate limiting.",
        "timestamp": iso_now(),
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": iso_now()}


@app.get("/tickets")
async def tickets(request: Request):
    return {
        "service": "expo-rate-limit-demo-service",
        "result": "allowed",
        "message": "Ticket status checked successfully.",
        "actor": request.headers.get("x-expo-demo-actor", "unknown"),
        "request_id": request.headers.get("x-expo-request-id", ""),
        "timestamp": iso_now(),
    }
