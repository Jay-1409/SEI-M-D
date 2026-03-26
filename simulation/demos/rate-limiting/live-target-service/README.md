# Live Target Service For The Rate Limiting Demo

This small FastAPI service exists only to support the live gateway-connected rate limiting expo demo.

It gives you one stable, repeatable route:

- `GET /tickets`

The route always returns a clean `200` if the request reaches the service, which makes it ideal for showing the gateway's real rate limiting behavior:

- normal traffic should keep succeeding
- flood traffic should start receiving real `429 Too Many Requests` once the platform limit is exceeded

## Why this service exists

Any safe route behind the gateway can work for rate limiting, but expo demos are easier when the target is:

- quick to respond
- free of side effects
- easy to rate limit
- fully owned by the `simulation` workspace

This service gives the demo a deterministic fallback target without modifying the main project.

## Run locally

```bash
cd simulation/demos/rate-limiting/live-target-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/health`
- `http://localhost:8000/tickets`

## Build the image tar for platform deployment

From this folder:

```bash
docker build -t expo-rate-limit-demo:latest .
docker save expo-rate-limit-demo:latest -o expo-rate-limit-demo.tar
```

That creates `expo-rate-limit-demo.tar`, which can be uploaded through the main platform dashboard without changing the main project.

PowerShell helper:

- [build-demo-target.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\rate-limiting\live-target-service\build-demo-target.ps1)

## Suggested deployment values

- `Service Name`: `expo-rate-limit-demo`
- `Container Port`: `8000`

This gives the live gateway route:

- `http://localhost:30080/expo-rate-limit-demo/tickets`

## Suggested rate limit setup in the platform

After deployment:

1. Open the service details page for `expo-rate-limit-demo` in the main platform.
2. Open `Firewall`.
3. Open the `Rate Limiting` subtab.
4. Leave rate limiting `ON`.
5. Set a low obvious limit like `5` requests per `10` seconds for a strong expo proof run.
6. Save the config.

You can use the global settings, or set a route override for:

- `GET /tickets`

## Quick test with curl

Normal request:

```bash
curl http://localhost:30080/expo-rate-limit-demo/tickets
```

Fast burst:

```bash
for i in 1 2 3 4 5 6 7 8; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:30080/expo-rate-limit-demo/tickets; done
```

Expected result:

- early requests should return `200`
- once the limit is crossed, later requests should return `429`
