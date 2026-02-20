"""
Secure Microservice Deployer — API Gateway

Reverse-proxy that routes /{service_name}/... to the internal
ClusterIP service at http://{service_name}-service:{port}/...

Only this gateway is exposed externally (NodePort 30080).

Includes WAF capabilities:
  - SQL Injection detection on query params, body, path, and headers
  - XSS (Cross-Site Scripting) detection and blocking
  - Header sanitization (strip dangerous headers, enforce Content-Type)
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import logging
from datetime import datetime, timezone
import redis
import json
import os
import re
import urllib.parse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("gateway")

app = FastAPI(title="Microservice Gateway", version="1.0.0")


# ═══════════════════════════════════════════════════════════════
#  WAF — SQL Injection Detection
# ═══════════════════════════════════════════════════════════════

# Common SQL injection patterns (case-insensitive)
# Each tuple: (compiled_regex, human-readable description)
SQLI_PATTERNS: list[tuple[re.Pattern, str]] = [
    # --- Classic tautologies & boolean logic ---
    (re.compile(r"(\b|\')OR\s+1\s*=\s*1", re.I),           "OR 1=1 tautology"),
    (re.compile(r"(\b|\')OR\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?", re.I), "OR equality tautology"),
    (re.compile(r"(\b|\')AND\s+1\s*=\s*1", re.I),          "AND 1=1 tautology"),
    (re.compile(r"(\b|\')OR\s+['\"]?[a-z]+['\"]?\s*=\s*['\"]?[a-z]+['\"]?", re.I), "OR string tautology"),

    # --- UNION-based injection ---
    (re.compile(r"\bUNION\s+(ALL\s+)?SELECT\b", re.I),     "UNION SELECT"),

    # --- Stacked queries ---
    (re.compile(r";\s*(DROP|ALTER|CREATE|INSERT|UPDATE|DELETE|TRUNCATE|EXEC)\b", re.I), "Stacked destructive query"),
    (re.compile(r";\s*SELECT\b", re.I),                     "Stacked SELECT"),

    # --- Comment-based evasion ---
    (re.compile(r"(--|#|/\*)\s*$", re.M),                   "SQL comment terminator"),
    (re.compile(r"/\*.*?\*/", re.S),                        "Inline SQL comment block"),

    # --- SQL keywords in suspicious context ---
    (re.compile(r"\bSELECT\s+.+\s+FROM\b", re.I),         "SELECT ... FROM"),
    (re.compile(r"\bINSERT\s+INTO\b", re.I),               "INSERT INTO"),
    (re.compile(r"\bUPDATE\s+\w+\s+SET\b", re.I),          "UPDATE ... SET"),
    (re.compile(r"\bDELETE\s+FROM\b", re.I),               "DELETE FROM"),
    (re.compile(r"\bDROP\s+(TABLE|DATABASE|SCHEMA)\b", re.I), "DROP TABLE/DATABASE"),
    (re.compile(r"\bALTER\s+TABLE\b", re.I),               "ALTER TABLE"),
    (re.compile(r"\bTRUNCATE\s+TABLE\b", re.I),            "TRUNCATE TABLE"),
    (re.compile(r"\bEXEC(\s+|\s*\()", re.I),               "EXEC call"),

    # --- Blind injection probes ---
    (re.compile(r"\bSLEEP\s*\(", re.I),                    "SLEEP() time-based injection"),
    (re.compile(r"\bBENCHMARK\s*\(", re.I),                "BENCHMARK() time-based injection"),
    (re.compile(r"\bWAITFOR\s+DELAY\b", re.I),             "WAITFOR DELAY injection"),
    (re.compile(r"\bIF\s*\(.+,.+,.+\)", re.I),             "IF() conditional injection"),

    # --- Information extraction ---
    (re.compile(r"\b(INFORMATION_SCHEMA|SYS\.TABLES|SYSOBJECTS)\b", re.I), "Schema enumeration"),
    (re.compile(r"\bLOAD_FILE\s*\(", re.I),                "LOAD_FILE() file read"),
    (re.compile(r"\bINTO\s+(OUT|DUMP)FILE\b", re.I),       "INTO OUTFILE/DUMPFILE write"),

    # --- String manipulation for evasion ---
    (re.compile(r"\bCONCAT\s*\(", re.I),                   "CONCAT() string building"),
    (re.compile(r"\bCHAR\s*\(\s*\d+", re.I),               "CHAR() encoding evasion"),
    (re.compile(r"0x[0-9a-fA-F]{4,}",),                    "Hex-encoded payload"),

    # --- Quote-based probing ---
    (re.compile(r"'\s*(OR|AND)\s+", re.I),                  "Quote + boolean operator"),
    (re.compile(r"'\s*;\s*", re.I),                         "Quote + semicolon"),

    # --- SQL Server specific ---
    (re.compile(r"\bxp_cmdshell\b", re.I),                  "xp_cmdshell RCE attempt"),
    (re.compile(r"\bsp_executesql\b", re.I),                "sp_executesql dynamic SQL"),

    # --- Having / Group By error-based ---
    (re.compile(r"\bHAVING\s+\d+\s*=\s*\d+", re.I),       "HAVING error-based injection"),
    (re.compile(r"\bGROUP\s+BY\s+.+\bHAVING\b", re.I),    "GROUP BY ... HAVING probe"),
]


def detect_sqli(value: str) -> tuple[bool, str]:
    """
    Scan a string for SQL injection patterns.
    Returns (is_malicious, matched_description).
    """
    if not value:
        return False, ""

    # URL-decode the value to catch encoded attacks
    try:
        decoded = urllib.parse.unquote_plus(value)
    except Exception:
        decoded = value

    for pattern, description in SQLI_PATTERNS:
        if pattern.search(decoded):
            return True, description
        # Also check original (non-decoded) value
        if decoded != value and pattern.search(value):
            return True, description

    return False, ""


def scan_dict_for_sqli(data: dict, prefix: str = "") -> tuple[bool, str, str]:
    """
    Recursively scan a dict (JSON body, query params) for SQLi.
    Returns (is_malicious, matched_field, description).
    """
    for key, val in data.items():
        field_name = f"{prefix}.{key}" if prefix else key

        # Check the key itself
        is_bad, desc = detect_sqli(str(key))
        if is_bad:
            return True, f"key:{field_name}", desc

        # Check the value
        if isinstance(val, str):
            is_bad, desc = detect_sqli(val)
            if is_bad:
                return True, field_name, desc
        elif isinstance(val, dict):
            is_bad, field, desc = scan_dict_for_sqli(val, field_name)
            if is_bad:
                return True, field, desc
        elif isinstance(val, list):
            for i, item in enumerate(val):
                if isinstance(item, str):
                    is_bad, desc = detect_sqli(item)
                    if is_bad:
                        return True, f"{field_name}[{i}]", desc
                elif isinstance(item, dict):
                    is_bad, field, desc = scan_dict_for_sqli(item, f"{field_name}[{i}]")
                    if is_bad:
                        return True, field, desc

    return False, "", ""


# ═══════════════════════════════════════════════════════════════
#  WAF — XSS (Cross-Site Scripting) Detection
# ═══════════════════════════════════════════════════════════════

XSS_PATTERNS: list[tuple[re.Pattern, str]] = [
    # --- Script tags ---
    (re.compile(r"<\s*script\b", re.I),                     "<script> tag"),
    (re.compile(r"<\s*/\s*script\s*>", re.I),               "</script> closing tag"),

    # --- Event handlers ---
    (re.compile(r"\bon\w+\s*=\s*[\"']", re.I),              "Event handler attribute (onX=)"),
    (re.compile(r"\bon(load|error|click|mouseover|focus|blur|submit|change|input|keyup|keydown|keypress|mouseout|mouseenter|mouseleave|dblclick|contextmenu|drag|drop|abort|beforeunload|hashchange|message|offline|online|pageshow|pagehide|popstate|resize|scroll|storage|unload|copy|cut|paste)\s*=", re.I),
                                                            "Specific event handler"),

    # --- Dangerous HTML tags ---
    (re.compile(r"<\s*iframe\b", re.I),                     "<iframe> tag"),
    (re.compile(r"<\s*embed\b", re.I),                      "<embed> tag"),
    (re.compile(r"<\s*object\b", re.I),                     "<object> tag"),
    (re.compile(r"<\s*applet\b", re.I),                     "<applet> tag"),
    (re.compile(r"<\s*form\b", re.I),                       "<form> tag injection"),
    (re.compile(r"<\s*meta\b[^>]*http-equiv", re.I),        "<meta> redirect"),
    (re.compile(r"<\s*svg\b[^>]*on\w+", re.I),              "<svg> with event handler"),
    (re.compile(r"<\s*img\b[^>]*on\w+", re.I),              "<img> with event handler"),
    (re.compile(r"<\s*body\b[^>]*on\w+", re.I),             "<body> with event handler"),
    (re.compile(r"<\s*input\b[^>]*on\w+", re.I),            "<input> with event handler"),
    (re.compile(r"<\s*details\b[^>]*on\w+", re.I),          "<details> with event handler"),
    (re.compile(r"<\s*marquee\b[^>]*on\w+", re.I),          "<marquee> with event handler"),
    (re.compile(r"<\s*video\b[^>]*on\w+", re.I),            "<video> with event handler"),
    (re.compile(r"<\s*audio\b[^>]*on\w+", re.I),            "<audio> with event handler"),

    # --- JavaScript protocol ---
    (re.compile(r"javascript\s*:", re.I),                   "javascript: URI"),
    (re.compile(r"vbscript\s*:", re.I),                     "vbscript: URI"),
    (re.compile(r"data\s*:\s*text/html", re.I),             "data:text/html URI"),

    # --- JS execution functions ---
    (re.compile(r"\beval\s*\(", re.I),                      "eval() call"),
    (re.compile(r"\bsetTimeout\s*\(", re.I),                "setTimeout() call"),
    (re.compile(r"\bsetInterval\s*\(", re.I),               "setInterval() call"),
    (re.compile(r"\bFunction\s*\(", re.I),                  "Function() constructor"),
    (re.compile(r"\bdocument\.write\b", re.I),              "document.write()"),
    (re.compile(r"\bdocument\.cookie\b", re.I),             "document.cookie access"),
    (re.compile(r"\bwindow\.location\b", re.I),             "window.location manipulation"),
    (re.compile(r"\binnerHTML\s*=", re.I),                   "innerHTML assignment"),
    (re.compile(r"\bouterHTML\s*=", re.I),                   "outerHTML assignment"),

    # --- DOM manipulation ---
    (re.compile(r"\bdocument\.createElement\b", re.I),      "document.createElement()"),
    (re.compile(r"\bdocument\.getElementById\b", re.I),     "DOM access"),
    (re.compile(r"\b\.insertAdjacentHTML\b", re.I),         "insertAdjacentHTML()"),
    (re.compile(r"\b\.appendChild\b", re.I),                "appendChild()"),

    # --- Encoding evasion ---
    (re.compile(r"&#x?[0-9a-fA-F]+;?", re.I),              "HTML entity encoding"),
    (re.compile(r"\\u[0-9a-fA-F]{4}", re.I),               "Unicode escape sequence"),
    (re.compile(r"%3[Cc]%2[Ff]?script", re.I),             "URL-encoded script tag"),

    # --- Expression/CSS injection ---
    (re.compile(r"expression\s*\(", re.I),                  "CSS expression()"),
    (re.compile(r"url\s*\(\s*['\"]?\s*javascript", re.I),  "CSS url(javascript:)"),
    (re.compile(r"-moz-binding\s*:", re.I),                 "CSS -moz-binding"),

    # --- Base tag hijacking ---
    (re.compile(r"<\s*base\b[^>]*href", re.I),              "<base href> hijack"),
    (re.compile(r"<\s*link\b[^>]*rel\s*=\s*['\"]?import", re.I), "<link rel=import>"),
]


def detect_xss(value: str) -> tuple[bool, str]:
    """
    Scan a string for XSS patterns.
    Returns (is_malicious, matched_description).
    """
    if not value:
        return False, ""

    # URL-decode to catch encoded attacks
    try:
        decoded = urllib.parse.unquote_plus(value)
    except Exception:
        decoded = value

    for pattern, description in XSS_PATTERNS:
        if pattern.search(decoded):
            return True, description
        if decoded != value and pattern.search(value):
            return True, description

    return False, ""


def scan_dict_for_xss(data: dict, prefix: str = "") -> tuple[bool, str, str]:
    """
    Recursively scan a dict for XSS patterns.
    Returns (is_malicious, matched_field, description).
    """
    for key, val in data.items():
        field_name = f"{prefix}.{key}" if prefix else key

        is_bad, desc = detect_xss(str(key))
        if is_bad:
            return True, f"key:{field_name}", desc

        if isinstance(val, str):
            is_bad, desc = detect_xss(val)
            if is_bad:
                return True, field_name, desc
        elif isinstance(val, dict):
            is_bad, field, desc = scan_dict_for_xss(val, field_name)
            if is_bad:
                return True, field, desc
        elif isinstance(val, list):
            for i, item in enumerate(val):
                if isinstance(item, str):
                    is_bad, desc = detect_xss(item)
                    if is_bad:
                        return True, f"{field_name}[{i}]", desc
                elif isinstance(item, dict):
                    is_bad, field, desc = scan_dict_for_xss(item, f"{field_name}[{i}]")
                    if is_bad:
                        return True, field, desc

    return False, "", ""


async def log_waf_block(redis_cl, request: Request, attack_type: str,
                         field: str, description: str, payload_snippet: str,
                         service_name: str = "unknown"):
    """Record a WAF block event in Redis for monitoring."""
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service_name": service_name,
        "attack_type": attack_type,
        "field": field,
        "description": description,
        "payload_snippet": payload_snippet[:200],  # truncate long payloads
        "method": request.method,
        "path": str(request.url.path),
        "query": str(request.url.query),
        "client_ip": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
    }
    logger.warning(
        f"🛡️  WAF BLOCKED | {attack_type} | {description} | "
        f"service={service_name} | field={field} | ip={event['client_ip']} | "
        f"path={event['path']}"
    )
    if redis_cl:
        try:
            event_json = json.dumps(event)
            # Store in global list (capped at 1000)
            redis_cl.lpush("waf:events", event_json)
            redis_cl.ltrim("waf:events", 0, 999)
            # Store in per-service list (capped at 500)
            redis_cl.lpush(f"waf:events:{service_name}", event_json)
            redis_cl.ltrim(f"waf:events:{service_name}", 0, 499)
            # Increment global counters
            redis_cl.incr("waf:blocks:total")
            redis_cl.incr(f"waf:blocks:{attack_type}")
            # Increment per-service counters
            redis_cl.incr(f"waf:blocks:{service_name}:total")
            redis_cl.incr(f"waf:blocks:{service_name}:{attack_type}")
        except Exception as e:
            logger.error(f"Failed to log WAF event to Redis: {e}")


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


def match_route(pattern: str, path: str) -> bool:
    """Match OpenAPI path pattern against actual request path."""
    # Convert {param} to [^/]+ regex
    regex_pattern = "^" + re.sub(r"\{[^}]+\}", "[^/]+", pattern) + "$"
    return bool(re.match(regex_pattern, path))


# ═══════════════════════════════════════════════════════════════
#  WAF — Header Sanitization
# ═══════════════════════════════════════════════════════════════

# Headers that should be stripped from inbound requests before proxying.
# These are either dangerous, used for internal routing only, or
# can be exploited for cache-poisoning / SSRF / host-header attacks.
DANGEROUS_HEADERS: set[str] = {
    # Hop-by-hop / proxy headers
    "x-forwarded-host",
    "x-forwarded-server",
    "x-original-url",
    "x-rewrite-url",
    "x-host",
    "x-forwarded-port",
    "x-forwarded-scheme",

    # Cache-poisoning vectors
    "x-original-host",
    "x-http-method-override",
    "x-http-method",
    "x-method-override",

    # Server-Side Request Forgery (SSRF) vectors
    "proxy",
    "x-proxy-url",
    "request-uri",
    "x-original-url",

    # Debug / internal headers
    "x-debug",
    "x-debug-token",
    "x-debug-token-link",
    "x-custom-ip-authorization",
    "x-cluster-client-ip",

    # Server identification (strip before forwarding)
    "server",
    "x-powered-by",
    "x-aspnet-version",
    "x-aspnetmvc-version",
    "x-runtime",
}

# Allowed Content-Type values for requests with a body.
# Anything else is rejected when header enforcement is on.
ALLOWED_CONTENT_TYPES: set[str] = {
    "application/json",
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain",
    "application/xml",
    "text/xml",
    "application/octet-stream",
}


def check_headers(headers, method: str) -> tuple[bool, str, str, list[str]]:
    """
    Inspect request headers.
    Returns (should_block, reason, description, list_of_stripped_headers).
    should_block is True only if Content-Type enforcement fails.
    """
    stripped: list[str] = []

    # Collect dangerous headers that are present
    for h in headers:
        if h.lower() in DANGEROUS_HEADERS:
            stripped.append(h)

    # Enforce Content-Type on body-carrying methods
    if method in ("POST", "PUT", "PATCH"):
        ct = headers.get("content-type", "")
        if ct:
            # Extract the media type (before ; params like charset)
            media_type = ct.split(";")[0].strip().lower()
            if media_type and media_type not in ALLOWED_CONTENT_TYPES:
                return True, f"Disallowed Content-Type: {media_type}", "Content-Type enforcement", stripped

    return False, "", "", stripped


async def log_header_event(redis_cl, request: Request, stripped_headers: list[str],
                           blocked: bool, reason: str, service_name: str):
    """Log header sanitization events to Redis."""
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "attack_type": "headers",
        "client_ip": request.client.host if request.client else "unknown",
        "method": request.method,
        "path": str(request.url.path),
        "service_name": service_name,
        "field": "headers",
        "description": reason if blocked else f"Stripped: {', '.join(stripped_headers)}",
        "payload_snippet": ", ".join(stripped_headers)[:200] if stripped_headers else reason[:200],
        "action": "blocked" if blocked else "sanitized",
    }
    event_json = json.dumps(event)

    if redis_cl:
        try:
            # Global
            redis_cl.lpush("waf:events", event_json)
            redis_cl.ltrim("waf:events", 0, 999)
            # Per-service
            redis_cl.lpush(f"waf:events:{service_name}", event_json)
            redis_cl.ltrim(f"waf:events:{service_name}", 0, 499)
            # Counters
            redis_cl.incr("waf:blocks:total")
            redis_cl.incr("waf:blocks:headers")
            redis_cl.incr(f"waf:blocks:{service_name}:total")
            redis_cl.incr(f"waf:blocks:{service_name}:headers")
        except Exception as e:
            logger.error(f"Failed to log header event to Redis: {e}")


# ═══════════════════════════════════════════════════════════════
#  WAF Middleware — SQLi + XSS + Header Sanitization
# ═══════════════════════════════════════════════════════════════

def _run_checks(value: str, sqli_on: bool, xss_on: bool) -> tuple[bool, str, str]:
    """Run enabled WAF checks on a single string. Returns (blocked, attack_type, description)."""
    if sqli_on:
        bad, desc = detect_sqli(value)
        if bad:
            return True, "sqli", desc
    if xss_on:
        bad, desc = detect_xss(value)
        if bad:
            return True, "xss", desc
    return False, "", ""


def _run_dict_checks(data: dict, sqli_on: bool, xss_on: bool, prefix: str = "") -> tuple[bool, str, str, str]:
    """Run enabled WAF checks on a dict recursively. Returns (blocked, attack_type, field, description)."""
    if sqli_on:
        bad, field, desc = scan_dict_for_sqli(data, prefix)
        if bad:
            return True, "sqli", field, desc
    if xss_on:
        bad, field, desc = scan_dict_for_xss(data, prefix)
        if bad:
            return True, "xss", field, desc
    return False, "", "", ""


@app.middleware("http")
async def waf_middleware(request: Request, call_next):
    """
    Unified WAF middleware — inspects every incoming request for:
      - SQL Injection patterns (if sqli enabled for the service)
      - XSS patterns (if xss enabled for the service)
    Per-service config in Redis: `config:waf:{service_name}`
    Blocks with 403 if an attack is detected.
    """
    path = request.url.path

    # Skip gateway's own management endpoints
    parts = path.strip("/").split("/")
    first_segment = parts[0] if parts else ""
    if first_segment in ("register", "routes", "health", "docs", "openapi.json", "waf", "apikey"):
        return await call_next(request)

    service_name = first_segment
    r = _get_redis()

    # Load per-service WAF config
    sqli_on = False
    xss_on = False
    headers_on = False
    if r and service_name:
        try:
            waf_config_raw = r.get(f"config:waf:{service_name}")
            if waf_config_raw:
                waf_config = json.loads(waf_config_raw)
                # Support legacy "enabled" field (turns on all) and granular fields
                if "sqli" in waf_config or "xss" in waf_config or "headers" in waf_config:
                    sqli_on = waf_config.get("sqli", False)
                    xss_on = waf_config.get("xss", False)
                    headers_on = waf_config.get("headers", False)
                else:
                    # Legacy: single "enabled" toggle turns on sqli+xss
                    both = waf_config.get("enabled", False)
                    sqli_on = both
                    xss_on = both
        except Exception as e:
            logger.error(f"WAF config check failed for {service_name}: {e}")

    # If nothing is enabled, skip
    if not sqli_on and not xss_on and not headers_on:
        return await call_next(request)

    # ── Header Sanitization ──
    if headers_on:
        should_block, reason, desc, stripped = check_headers(request.headers, request.method)
        if should_block:
            await log_header_event(r, request, stripped, True, reason, service_name)
            return JSONResponse(status_code=403, content={
                "detail": "Request blocked by WAF",
                "reason": reason,
                "attack_type": "headers",
                "pattern": desc,
            })
        if stripped:
            await log_header_event(r, request, stripped, False, "", service_name)
            # We can't mutate request.headers directly (immutable),
            # but the proxy handler already filters headers.
            # We store the stripped names so the proxy can skip them.
            request.state.waf_stripped_headers = {h.lower() for h in stripped}
        else:
            request.state.waf_stripped_headers = set()
    else:
        request.state.waf_stripped_headers = set()

    attack_labels = {"sqli": "SQL injection", "xss": "Cross-Site Scripting (XSS)"}

    # 1) Check URL path
    blocked, atype, desc = _run_checks(path, sqli_on, xss_on)
    if blocked:
        await log_waf_block(r, request, atype, "url_path", desc, path, service_name)
        return JSONResponse(status_code=403, content={
            "detail": "Request blocked by WAF",
            "reason": f"Potential {attack_labels[atype]} detected in URL path",
            "attack_type": atype, "pattern": desc,
        })

    # 2) Check query parameters
    for param_name, param_value in request.query_params.items():
        blocked, atype, desc = _run_checks(param_name, sqli_on, xss_on)
        if blocked:
            await log_waf_block(r, request, atype, f"query_key:{param_name}", desc, param_name, service_name)
            return JSONResponse(status_code=403, content={
                "detail": "Request blocked by WAF",
                "reason": f"Potential {attack_labels[atype]} detected in query parameter name",
                "attack_type": atype, "pattern": desc,
            })
        blocked, atype, desc = _run_checks(param_value, sqli_on, xss_on)
        if blocked:
            await log_waf_block(r, request, atype, f"query:{param_name}", desc, param_value, service_name)
            return JSONResponse(status_code=403, content={
                "detail": "Request blocked by WAF",
                "reason": f"Potential {attack_labels[atype]} detected in query parameter '{param_name}'",
                "attack_type": atype, "pattern": desc,
            })

    # 3) Check request body
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        try:
            body_bytes = await request.body()
            if body_bytes:
                body_text = body_bytes.decode("utf-8", errors="ignore")

                content_type = request.headers.get("content-type", "")
                if "application/json" in content_type:
                    try:
                        json_body = json.loads(body_text)
                        if isinstance(json_body, dict):
                            blocked, atype, field, desc = _run_dict_checks(json_body, sqli_on, xss_on)
                            if blocked:
                                await log_waf_block(r, request, atype, f"body:{field}", desc, body_text, service_name)
                                return JSONResponse(status_code=403, content={
                                    "detail": "Request blocked by WAF",
                                    "reason": f"Potential {attack_labels[atype]} detected in body field '{field}'",
                                    "attack_type": atype, "pattern": desc,
                                })
                    except json.JSONDecodeError:
                        pass

                blocked, atype, desc = _run_checks(body_text, sqli_on, xss_on)
                if blocked:
                    await log_waf_block(r, request, atype, "body_raw", desc, body_text, service_name)
                    return JSONResponse(status_code=403, content={
                        "detail": "Request blocked by WAF",
                        "reason": f"Potential {attack_labels[atype]} detected in request body",
                        "attack_type": atype, "pattern": desc,
                    })
        except Exception as e:
            logger.error(f"WAF body inspection error: {e}")

    # 4) Check cookies
    for cookie_name, cookie_value in request.cookies.items():
        blocked, atype, desc = _run_checks(cookie_value, sqli_on, xss_on)
        if blocked:
            await log_waf_block(r, request, atype, f"cookie:{cookie_name}", desc, cookie_value, service_name)
            return JSONResponse(status_code=403, content={
                "detail": "Request blocked by WAF",
                "reason": f"Potential {attack_labels[atype]} detected in cookie '{cookie_name}'",
                "attack_type": atype, "pattern": desc,
            })

    return await call_next(request)


# ═══════════════════════════════════════════════════════════════
#  Rate Limiting Middleware
# ═══════════════════════════════════════════════════════════════

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
    if service_name in ("register", "routes", "health", "docs", "openapi.json", "apikey"):
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
            matched_route = None
            for route in routes:
                # Check method
                if route.get("method", "ALL") != "ALL" and route.get("method") != request.method:
                    continue
                
                # Check path pattern
                if match_route(route.get("path"), relative_path):
                    matched_route = route
                    limit = int(route.get("limit"))
                    window = int(route.get("window"))
                    break
            
            client_ip = request.client.host
            
            if matched_route:
                # Use specific key for matched route
                key = f"ratelimit:{service_name}:{client_ip}:{matched_route['method']}:{matched_route['path']}"
            else:
                # Use global key
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

# ---- Service Registry: Dual-layer (in-memory + Redis) ----
# In-memory dict is the primary source of truth for routing.
# Redis is used for persistence across restarts.
route_table: dict[str, str] = {}


def _get_redis():
    """Lazy Redis connection with retry. Returns client or None."""
    global redis_client
    if redis_client:
        try:
            redis_client.ping()
            return redis_client
        except Exception:
            redis_client = None

    # Try to (re)connect
    try:
        redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        redis_client.ping()
        logger.info(f"(Re)connected to Redis at {REDIS_HOST}")
        return redis_client
    except Exception as e:
        logger.warning(f"Redis reconnect failed: {e}")
        redis_client = None
        return None


@app.on_event("startup")
async def startup_event():
    """Load persisted routes from Redis into memory on boot."""
    logger.info("Gateway service starting...")
    r = _get_redis()
    if r:
        try:
            keys = r.keys("routes:*")
            for key in keys:
                service = key.split(":", 1)[1]
                target = r.get(key)
                if target:
                    route_table[service] = target
            logger.info(f"Loaded {len(route_table)} routes from Redis into memory")
        except Exception as e:
            logger.error(f"Failed to load routes from Redis: {e}")
    else:
        logger.warning("Redis unavailable at startup — route table is empty")


@app.post("/register")
async def register_route(payload: dict):
    """Register a new service route."""
    service_name = payload["service_name"]
    target_url = payload["target_url"]

    # Always save to in-memory (instant effect)
    route_table[service_name] = target_url
    logger.info(f"Registered route: /{service_name} -> {target_url}")

    # Also persist to Redis (best-effort)
    r = _get_redis()
    if r:
        try:
            r.set(f"routes:{service_name}", target_url)
        except Exception as e:
            logger.warning(f"Redis persist failed for {service_name}: {e}")

    return {"status": "registered", "service_name": service_name}


@app.delete("/register/{service_name}")
async def deregister_route(service_name: str):
    """Remove a service route."""
    if service_name in route_table:
        del route_table[service_name]
        logger.info(f"Deregistered route: /{service_name}")

    r = _get_redis()
    if r:
        try:
            r.delete(f"routes:{service_name}")
        except Exception as e:
            logger.warning(f"Redis delete failed for {service_name}: {e}")

    return {"status": "deregistered", "service_name": service_name}


@app.get("/routes")
async def list_routes():
    """List all registered routes."""
    return route_table


# ---------- Health ----------

@app.get("/health")
async def health():
    return {"status": "healthy", "routes": len(route_table)}


# ═══════════════════════════════════════════════════════════════
#  WAF Configuration & Monitoring Endpoints
# ═══════════════════════════════════════════════════════════════

@app.get("/waf/config/{service_name}")
async def get_waf_config(service_name: str):
    """Get WAF configuration for a specific service."""
    r = _get_redis()
    if not r:
        return {"service_name": service_name, "enabled": False, "note": "Redis unavailable"}
    try:
        config_raw = r.get(f"config:waf:{service_name}")
        if config_raw:
            config = json.loads(config_raw)
            config["service_name"] = service_name
            return config
        return {"service_name": service_name, "enabled": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch WAF config: {e}")


@app.post("/waf/config/{service_name}")
async def set_waf_config(service_name: str, payload: dict):
    """Enable/disable WAF for a specific service."""
    r = _get_redis()
    if not r:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    try:
        config = {
            "enabled": payload.get("enabled", False),
            "sqli": payload.get("sqli", payload.get("enabled", False)),
            "xss": payload.get("xss", payload.get("enabled", False)),
            "headers": payload.get("headers", False),
        }
        r.set(f"config:waf:{service_name}", json.dumps(config))
        logger.info(f"WAF config updated for {service_name}: sqli={config['sqli']}, xss={config['xss']}, headers={config['headers']}")
        return {"status": "saved", "service_name": service_name, **config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save WAF config: {e}")


@app.get("/waf/events")
async def waf_events(limit: int = 50, service: str = None):
    """Get recent WAF block events, optionally filtered by service."""
    r = _get_redis()
    if not r:
        return {"events": [], "note": "Redis unavailable"}
    try:
        if service:
            # Per-service events
            raw_events = r.lrange(f"waf:events:{service}", 0, min(limit, 499) - 1)
        else:
            # Global events
            raw_events = r.lrange("waf:events", 0, min(limit, 999) - 1)
        events = [json.loads(e) for e in raw_events]
        return {"total_events": len(events), "events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch WAF events: {e}")


@app.get("/waf/stats")
async def waf_stats(service: str = None):
    """Get WAF block statistics, optionally per-service."""
    r = _get_redis()
    if not r:
        return {"total_blocks": 0, "by_type": {}, "note": "Redis unavailable"}
    try:
        if service:
            total = int(r.get(f"waf:blocks:{service}:total") or 0)
            sqli_count = int(r.get(f"waf:blocks:{service}:sqli") or 0)
            xss_count = int(r.get(f"waf:blocks:{service}:xss") or 0)
            headers_count = int(r.get(f"waf:blocks:{service}:headers") or 0)
        else:
            total = int(r.get("waf:blocks:total") or 0)
            sqli_count = int(r.get("waf:blocks:sqli") or 0)
            xss_count = int(r.get("waf:blocks:xss") or 0)
            headers_count = int(r.get("waf:blocks:headers") or 0)
        return {
            "total_blocks": total,
            "by_type": {
                "sqli": sqli_count,
                "xss": xss_count,
                "headers": headers_count,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch WAF stats: {e}")


@app.delete("/waf/events")
async def clear_waf_events(service: str = None):
    """Clear WAF event logs, optionally per-service."""
    r = _get_redis()
    if not r:
        return {"status": "skipped", "note": "Redis unavailable"}
    try:
        if service:
            r.delete(
                f"waf:events:{service}",
                f"waf:blocks:{service}:total",
                f"waf:blocks:{service}:sqli",
                f"waf:blocks:{service}:xss",
                f"waf:blocks:{service}:headers",
            )
        else:
            r.delete("waf:events", "waf:blocks:total", "waf:blocks:sqli", "waf:blocks:xss", "waf:blocks:headers")
        return {"status": "cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear WAF events: {e}")


# ═════════════════════════════════════════════════════════════
#  API Key Authentication — config endpoints
# ═════════════════════════════════════════════════════════════

@app.get("/apikey/config/{service_name}")
async def get_apikey_config(service_name: str):
    """Get API key auth configuration for a service."""
    r = _get_redis()
    if not r:
        return {"service_name": service_name, "enabled": False, "keys": [], "routes": []}
    try:
        raw = r.get(f"config:apikey:{service_name}")
        if raw:
            config = json.loads(raw)
            # Migrate old single-key format
            if "api_key" in config and "keys" not in config:
                old_key = config.pop("api_key", "")
                config["keys"] = [{"id": "migrated", "name": "Default", "key": old_key, "created": ""}] if old_key else []
            config["service_name"] = service_name
            return config
        return {"service_name": service_name, "enabled": False, "keys": [], "routes": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch API key config: {e}")


@app.post("/apikey/config/{service_name}")
async def set_apikey_config(service_name: str, payload: dict):
    """Set API key auth configuration for a service."""
    r = _get_redis()
    if not r:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    try:
        config = {
            "enabled": payload.get("enabled", False),
            "keys": payload.get("keys", []),       # [{id, name, key, created}]
            "routes": payload.get("routes", []),     # [{path, method}]
        }
        r.set(f"config:apikey:{service_name}", json.dumps(config))
        logger.info(f"API key config updated for {service_name}: enabled={config['enabled']}, keys={len(config['keys'])}, routes={len(config['routes'])}")
        return {"status": "saved", "service_name": service_name, **config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save API key config: {e}")


# ═════════════════════════════════════════════════════════════
#  API Key Authentication — checked inside the proxy handler
# ═════════════════════════════════════════════════════════════

def _check_api_key(service_name: str, method: str, relative_path: str,
                   request: Request, r) -> JSONResponse | None:
    """
    If API-key auth is enabled for this service and the current route
    matches a protected route, verify the X-API-Key header.
    Returns a 401 JSONResponse if invalid, or None if OK.
    """
    if not r:
        return None
    try:
        raw = r.get(f"config:apikey:{service_name}")
        if not raw:
            return None
        config = json.loads(raw)
        if not config.get("enabled", False):
            return None

        # Support multi-key format (list of key objects)
        keys_list = config.get("keys", [])
        if not keys_list:
            # Fallback: old format with single api_key
            old_key = config.get("api_key", "")
            if old_key:
                keys_list = [{"key": old_key}]
            else:
                return None

        valid_keys = {k.get("key") for k in keys_list if k.get("key")}
        if not valid_keys:
            return None

        protected_routes = config.get("routes", [])
        if not protected_routes:
            return None  # no routes protected

        # Check if current request matches any protected route
        matched = False
        for route in protected_routes:
            route_method = route.get("method", "ALL")
            route_path = route.get("path", "")
            if route_method != "ALL" and route_method.upper() != method.upper():
                continue
            if match_route(route_path, relative_path):
                matched = True
                break

        if not matched:
            return None  # this route is not protected

        # Route is protected — check the key against all valid keys
        provided_key = request.headers.get("x-api-key", "")
        if not provided_key or provided_key not in valid_keys:
            logger.warning(
                f"🔑 API key rejected for {service_name} "
                f"{method} {relative_path} from {request.client.host if request.client else 'unknown'}"
            )
            return JSONResponse(status_code=401, content={
                "detail": "Unauthorized — valid API key required",
                "error": "invalid_api_key",
            })
    except Exception as e:
        logger.error(f"API key check error: {e}")
    return None


# ---------- Reverse proxy ----------

@app.api_route("/{service_name}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(service_name: str, path: str, request: Request):
    """Forward request to the internal microservice."""
    if service_name in ("register", "routes", "health", "docs", "openapi.json", "apikey"):
        return  # avoid intercepting gateway's own routes

    target_base = route_table.get(service_name)
    
    if not target_base:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' is not registered")

    # --- API key auth check ---
    relative_path = "/" + path if path else "/"
    r = _get_redis()
    api_key_response = _check_api_key(service_name, request.method, relative_path, request, r)
    if api_key_response:
        return api_key_response

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
                         if k.lower() not in ("host", "content-length")
                         and k.lower() not in getattr(request.state, 'waf_stripped_headers', set())},
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
