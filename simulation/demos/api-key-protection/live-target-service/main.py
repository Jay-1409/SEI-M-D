from datetime import datetime, timezone

from fastapi import FastAPI


app = FastAPI(
    title="Expo API Key Demo Service",
    description="Small demo service for showing public versus API-key-protected gateway routes.",
    version="1.0.0",
)


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/")
async def root():
    return {
        "service": "expo-api-key-demo-service",
        "status": "ready",
        "message": "Use /public/help-hours and /staff/open-maintenance-panel for the API key expo demo.",
        "timestamp": iso_now(),
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": iso_now()}


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
