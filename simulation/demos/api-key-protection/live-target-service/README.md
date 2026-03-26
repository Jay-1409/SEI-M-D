# Live Target Service For The API Key Demo

This small FastAPI service exists only to support the live gateway-connected API key expo demo.

It gives you a stable pair of routes:

- `GET /public/help-hours`
- `POST /staff/open-maintenance-panel`

These match the polished public-vs-protected story already used by the demo UI.

## Why this service exists

You may be able to reuse another deployed service behind the platform, but this service is the safest expo fallback because:

- the route names already match the visitor story
- the public route returns clear, friendly content
- the protected route returns a simple success payload when the gateway allows it
- FastAPI exposes OpenAPI automatically, so the platform route picker can discover the endpoints

## Run locally

```bash
cd simulation/demos/api-key-protection/live-target-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open:

- `http://localhost:8000/public/help-hours`
- `http://localhost:8000/docs`

## Build the image tar for platform deployment

From this folder:

```bash
docker build -t expo-api-key-demo:latest .
docker save expo-api-key-demo:latest -o expo-api-key-demo.tar
```

That creates `expo-api-key-demo.tar`, which can be uploaded through the main platform dashboard without changing the main project.

PowerShell helper:

- [build-demo-target.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\api-key-protection\live-target-service\build-demo-target.ps1)

## Suggested deployment values

- `Service Name`: `expo-api-demo`
- `Container Port`: `8000`

This gives gateway routes like:

- `http://localhost:30080/expo-api-demo/public/help-hours`
- `http://localhost:30080/expo-api-demo/staff/open-maintenance-panel`

## Suggested API key protection setup in the platform

After deployment, open the service details page in the main platform and:

1. go to the `API Key Authentication` tab
2. enable API key auth
3. generate one key
4. protect only:
   - `POST /staff/open-maintenance-panel`
5. save the auth config

Leave `GET /public/help-hours` unchecked so it stays public.
