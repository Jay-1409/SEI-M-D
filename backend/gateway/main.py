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
import redis
import json
import os

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("gateway")

app = FastAPI(title="Microservice Gateway", version="1.0.0")


# Redis configuration for rate limiting
REDIS_HOST = os.getenv("REDIS_HOST", "redis-service.deployer-system.svc.cluster.local")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    redis_client.ping()
    logger.info(f"Connected to Redis for Rate Limiting at {REDIS_HOST}")
except Exception as e:
    logger.warning(f"Redis connection failed: {e}. Rate limiting disabled.")
    redis_client = None


import re

def match_route(pattern: str, path: str) -> bool:
    """Match OpenAPI path pattern against actual request path."""
    # Convert {param} to [^/]+ regex
    regex_pattern = "^" + re.sub(r"\{[^}]+\}", "[^/]+", pattern) + "$"
    return bool(re.match(regex_pattern, path))

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Only apply to valid requests that have Redis available
    if not redis_client:
        return await call_next(request)
        
    path = request.url.path
    # Extract service name from path (e.g. /service-name/api/...)
    parts = path.strip('/').split('/')
    if not parts:
        return await call_next(request)
        
    service_name = parts[0]
    
    # Skip gateway's own routes
    if service_name in ("register", "routes", "health", "docs", "openapi.json"):
        return await call_next(request)

    # Calculate relative path for matching (e.g., /api/v1/users)
    # The gateway path is /{service_name}/{rest_of_path}
    # But route patterns in config likely assume root relative to service?
    # Actually, config is based on OpenAPI which is relative to service root.
    # So we need to strip /{service_name} from the request path.
    relative_path = "/" + "/".join(parts[1:]) if len(parts) > 1 else "/"

    try:
        # Check if rate limiting is enabled for this service
        # Config key: config:ratelimit:{service_name}
        config_key = f"config:ratelimit:{service_name}"
        config_data = redis_client.get(config_key)
        
        if config_data:
            config = json.loads(config_data)
            
            if not config.get("enabled", True):
                 return await call_next(request)

            # Default to global settings
            limit = int(config.get("limit", 100))
            window = int(config.get("window", 60))
            
            # Check for route-specific overrides
            routes = config.get("routes", [])
            for route in routes:
                # Check method
                if route.get("method", "ALL") != "ALL" and route.get("method") != request.method:
                    continue
                
                # Check path pattern
                if match_route(route.get("path"), relative_path):
                    limit = int(route.get("limit"))
                    window = int(route.get("window"))
                    break
            
            client_ip = request.client.host
            # Rate limit key: ratelimit:{service_name}:{client_ip}:{route_hash_or_global}
            # Simplification: use a single counter per service:ip for now? 
            # No, if we have per-route limits, we need per-route counters.
            # Use path pattern as part of key if matched?
            # Or just use the limit key?
            # Let's use: ratelimit:{service_name}:{client_ip} (Global)
            # AND ratelimit:{service_name}:{client_ip}:{path_pattern} (Route specific)
            
            # Wait, if a route is matched, we should ONLY apply that rule?
            # Yes, usually specific overrides general.
            
            if routes:
                 # If we matched a route, make the key specific to that route pattern
                 # We need to know WHICH route matched to use its pattern in the key
                 matched_route = None
                 for route in routes:
                    if route.get("method", "ALL") != "ALL" and route.get("method") != request.method:
                        continue
                    if match_route(route.get("path"), relative_path):
                        matched_route = route
                        limit = int(route.get("limit"))
                        window = int(route.get("window"))
                        break
                 
                 if matched_route:
                     # Use specific key
                     key = f"ratelimit:{service_name}:{client_ip}:{matched_route['method']}:{matched_route['path']}"
                 else:
                     # Use global key
                     key = f"ratelimit:{service_name}:{client_ip}:global"
            else:
                 key = f"ratelimit:{service_name}:{client_ip}:global"

            # Check Limit
            pipeline = redis_client.pipeline()
            pipeline.incr(key)
            pipeline.ttl(key)
            result = pipeline.execute()
            
            current = result[0]
            ttl = result[1]
            
            # Set expiry if key is new (ttl == -1)
            if ttl == -1:
                redis_client.expire(key, window)
            
            if current > limit:
                logger.warning(f"Rate limit exceeded for {service_name} at {relative_path} from {client_ip} ({current}/{limit})")
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Rate limit exceeded",
                        "limit": limit,
                        "window_seconds": window,
                        "retry_after": ttl if ttl > 0 else window
                    }
                )
    except Exception as e:
        logger.error(f"Rate limit middleware error: {e}")
        # Fail open
        pass

    return await call_next(request)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo/testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
