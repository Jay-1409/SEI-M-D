"""
Secure Microservice Deployer — API Gateway

Reverse-proxy that routes /{service_name}/... to the internal
ClusterIP service at http://{service_name}-service:{port}/...

Only this gateway is exposed externally (NodePort 30080).
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import logging
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("gateway")

app = FastAPI(title="Microservice Gateway", version="1.0.0")

# Service registry: service_name -> target base URL
route_table: dict[str, str] = {}


# ---------- Registration endpoints (called by backend) ----------

@app.post("/register")
async def register_route(payload: dict):
    """Register a new service route."""
    service_name = payload["service_name"]
    target_url = payload["target_url"]
    route_table[service_name] = target_url
    logger.info(f"Registered route: /{service_name} -> {target_url}")
    return {"status": "registered", "service_name": service_name}


@app.delete("/register/{service_name}")
async def deregister_route(service_name: str):
    """Remove a service route."""
    if service_name in route_table:
        del route_table[service_name]
        logger.info(f"Deregistered route: /{service_name}")
    return {"status": "deregistered", "service_name": service_name}


@app.get("/routes")
async def list_routes():
    """List all registered routes."""
    return route_table


# ---------- Health ----------

@app.get("/health")
async def health():
    return {"status": "healthy", "routes": len(route_table)}


# ---------- Reverse proxy ----------

@app.api_route("/{service_name}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(service_name: str, path: str, request: Request):
    """Forward request to the internal microservice."""
    if service_name in ("register", "routes", "health", "docs", "openapi.json"):
        return  # avoid intercepting gateway's own routes

    if service_name not in route_table:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' is not registered")

    target_base = route_table[service_name]
    target_url = f"{target_base}/{path}" if path else target_base

    logger.info(
        f"[{datetime.now(timezone.utc).isoformat()}] "
        f"{request.method} /{service_name}/{path} -> {target_url}"
    )

    try:
        body = await request.body()
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(
                method=request.method,
                url=target_url,
                headers={k: v for k, v in request.headers.items()
                         if k.lower() not in ("host", "content-length")},
                content=body,
                params=dict(request.query_params),
            )

        return StreamingResponse(
            content=iter([resp.content]),
            status_code=resp.status_code,
            headers=dict(resp.headers),
        )
    except httpx.ConnectError:
        logger.error(f"Connection failed to {target_url}")
        raise HTTPException(status_code=502, detail=f"Cannot reach service '{service_name}'")
    except Exception as e:
        logger.error(f"Proxy error: {e}")
        raise HTTPException(status_code=502, detail=str(e))


# Root-level service route (no trailing path)
@app.api_route("/{service_name}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_root(service_name: str, request: Request):
    """Forward request to the internal microservice (root path)."""
    return await proxy(service_name, "", request)
