# Live Target Service For The SQL Injection Demo

This small FastAPI service exists only to support the live gateway-connected SQL injection expo demo.

It gives you one stable login route:

- `POST /login`

The service is intentionally deterministic:

- `admin` / `admin123` returns a normal success
- `admin` / `' OR '1'='1` returns a bypass-style success if the request reaches the service
- all other inputs return `401`

That means:

- if gateway SQLi protection is OFF, the attack payload can reach this service and the demo shows unauthorized access
- if gateway SQLi protection is ON, the gateway should block the payload before this service ever returns the bypass response

## Why this service exists

The main project backend is not a login service, so the clean way to get real SQLi gateway behavior without modifying the main project is to deploy a small simulation-owned target service behind the gateway.

This service is safe for expo use because:

- it lives entirely inside `simulation`
- it exposes a simple login-like route that matches the demo story
- it gives clear JSON responses for normal, attack, and invalid cases
- FastAPI exposes OpenAPI automatically, which helps the main platform understand the route

## Run locally

```bash
cd simulation/demos/sql-injection/live-target-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/docs`

## Build the image tar for platform deployment

From this folder:

```bash
docker build -t expo-sqli-demo:latest .
docker save expo-sqli-demo:latest -o expo-sqli-demo.tar
```

That creates `expo-sqli-demo.tar`, which can be uploaded through the main platform dashboard without changing the main project.

PowerShell helper:

- [build-demo-target.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\sql-injection\live-target-service\build-demo-target.ps1)

## Suggested deployment values

- `Service Name`: `expo-sqli-demo`
- `Container Port`: `8000`

This gives the live gateway route:

- `http://localhost:30080/expo-sqli-demo/login`

## Suggested SQLi protection setup in the platform

After deployment:

1. Open the service details page for `expo-sqli-demo` in the main platform.
2. Open the `Firewall` tab.
3. Turn `SQLi Protection` ON when you want the attack blocked.
4. Turn `SQLi Protection` OFF when you want the vulnerable live pass-through behavior.
5. Leave `XSS Protection` and `Headers` however you prefer; they are not required for this demo.
6. Clear WAF logs before the live SQLi proof run if you want a clean counter.

## Quick test with curl

Normal request:

```bash
curl -X POST http://localhost:30080/expo-sqli-demo/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

Attack payload:

```bash
curl -X POST http://localhost:30080/expo-sqli-demo/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"' OR '1'='1\"}"
```

Expected result:

- with SQLi protection OFF, the second request should return a bypass-style `200`
- with SQLi protection ON, the second request should return a gateway WAF `403`
