# API Key Protection Demo Backend Connection Plan

## Status

Implemented inside `simulation`.

The API key demo now supports:

- `Local simulation` fallback mode
- `Live platform mode` that sends real traffic through the main gateway

No main-project files were modified.

---

## 1. Goal

Keep the current polished public-vs-protected route story, but let the demo prove real gateway enforcement when the platform is available.

The live proof must show:

1. public route with no key
2. protected route with no key
3. protected route with invalid key
4. protected route with valid key

---

## 2. Chosen Architecture

- The demo UI stays in `simulation/demos/api-key-protection`
- The gateway remains the only public entry point
- API key configuration is still done through the real platform UI and backend
- The demo sends browser requests directly to the gateway in live mode
- The demo maps real gateway responses back into the same proof cards already used for the simulation

---

## 3. Why This Works With The Existing Platform

The main project already supports:

- `X-API-Key` header enforcement in the gateway
- per-service API key configuration
- per-route protection rules
- deployer endpoints that proxy API key config
- service details UI for selecting protected routes

So the only missing piece was a demo-friendly target service plus a UI path inside `simulation` for sending real requests.

---

## 4. Chosen Target Service Strategy

### Preferred option

Use the simulation-owned service in:

- [simulation/demos/api-key-protection/live-target-service](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\api-key-protection\live-target-service)

Why this service was added:

- it keeps the same layman story as the simulation
- it exposes one clearly public route
- it exposes one clearly protected-friendly route
- it stays fully inside `simulation`
- it can be deployed through the existing platform like any other service
- FastAPI provides OpenAPI automatically, which helps the platform route picker

### Provided routes

- `GET /public/help-hours`
- `POST /staff/open-maintenance-panel`

### Suggested deployed service name

- `expo-api-demo`

### Resulting gateway paths

- `http://localhost:30080/expo-api-demo/public/help-hours`
- `http://localhost:30080/expo-api-demo/staff/open-maintenance-panel`

---

## 5. Live Demo UI Changes That Were Added

The existing API key demo UI was preserved as much as possible.

Minimal connection-oriented additions were made:

- mode switch: local vs live
- gateway base URL field
- public route field
- protected route field
- live defaults button for the simulation-owned target service
- compact live status / setup message area
- HTTP status proof field

The original local simulation remains available at all times.

---

## 6. Live Request Behavior

### Public route

Selected route:

- `GET /public/help-hours`

Live request:

- sent to the configured gateway base URL plus configured public route
- no API key header required

Expected result:

- success through gateway
- proof panel shows `Allowed`

### Protected route with no key

Selected route:

- `POST /staff/open-maintenance-panel`

Live request:

- sent with no `X-API-Key`

Expected result:

- gateway returns `401`
- proof panel shows `Denied`
- key status shows `Missing`

### Protected route with invalid key

Live request:

- sent with wrong `X-API-Key`

Expected result:

- gateway returns `401`
- proof panel shows `Denied`
- key status shows `Invalid`

### Protected route with valid key

Live request:

- sent with the real generated `X-API-Key`

Expected result:

- gateway forwards the request
- proof panel shows `Allowed`
- key status shows `Valid`

---

## 7. Graceful Fallback Behavior

If live setup is incomplete, the demo does not break the expo flow.

Instead, it shows a clear `Check Setup` state for cases like:

- gateway unreachable
- route path missing
- public route accidentally protected
- protected route accidentally left open
- unexpected upstream response

The presenter can then:

1. correct the live setup
2. or switch back to local simulation instantly

---

## 8. Recommended Platform Setup

1. Build `expo-api-key-demo.tar` from the live target service folder
2. Upload it through the main dashboard
3. Deploy with:
   - service name `expo-api-demo`
   - container port `8000`
4. Open the service details page
5. Go to `API Key Authentication`
6. Enable API key auth
7. Generate one key
8. Protect only:
   - `POST /staff/open-maintenance-panel`
9. Save the config
10. Use that real generated key in the live demo

Important:

- leave `GET /public/help-hours` unchecked so it stays public

---

## 9. Existing Service Reuse

An existing deployed service may still be used if it already has:

- one clearly public route
- one clearly protectable route
- predictable responses for the expo

But the simulation-owned target service is the safer default because it matches the story exactly.

---

## 10. Final Verdict

The API key demo is now connected to real platform behavior without changing the main project.

The final approach uses:

- local simulation as fallback
- live gateway traffic when available
- real platform API key configuration
- a simulation-owned deployable target service when needed
