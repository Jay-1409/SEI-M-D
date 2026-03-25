# API Key Protection Demo Backend Connection Plan

## Purpose

This file evaluates whether the existing API key protection demo in `simulation/demos/api-key-protection` can be connected to the real project backend and gateway without changing the current main project code.

This is a planning and feasibility file only.

No code changes are made here.

---

## 1. Current Situation

The current API key demo is standalone.

Right now:
- route behavior is simulated locally in JavaScript
- public route success is simulated locally
- protected-route denial and allow states are simulated locally
- no real API key config is created in the gateway
- no real request goes through the real platform

So the current demo explains the idea clearly, but it does not yet prove the real gateway is checking real keys.

---

## 2. Is Real Backend Connection Possible?

## Short Answer

Yes, it is possible.

And it is also a good candidate for real integration without changing the main project code.

The best path is:

1. deploy a simple service through the real platform
2. choose one public route and one protected route
3. configure real API key protection in the existing platform
4. let the demo send requests through the real gateway
5. show real success or denial results in the current UI

---

## 3. Why This Can Work With Existing Platform Features

The current platform already includes:
- API key configuration endpoints proxied through the deployer
- gateway-side API key enforcement
- per-service route selection

So unlike SQLi/XSS, API key protection already has a very clear management path in the existing project.

What is still needed is only a suitable target service and route pair.

---

## 4. Best Connection Model

## Recommended Architecture

- Demo UI stays in `simulation`
- a real service is deployed through the platform
- that service has:
  - at least one public route
  - at least one route chosen for protection
- API key config is applied using the real platform
- the demo sends requests through the real gateway
- the demo reads the real responses

## Practical Flow

1. Deploy a simple service through the platform
2. Identify:
   - one route to leave public
   - one route to protect

3. Use the real service settings to configure API key protection

4. Generate or assign a real API key in the platform

5. Later, update the demo UI with:
   - target service URL/route inputs
   - optional real key field

6. The demo then sends:
   - public route request with no key
   - protected route request with no key
   - protected route request with invalid key
   - protected route request with valid key

7. The demo UI maps actual gateway responses into the existing proof cards

---

## 5. Can It Be Done Without Changing The Main Project?

## Yes

This is very feasible without touching the main project.

What is needed:
- a real deployed service behind the gateway
- route definitions suitable for public/protected demonstration
- real API key config set through the current platform endpoints/UI

No main-project code changes are inherently required.

---

## 6. Detailed “Possible Without Main Changes” Plan

## Option A: Best Option

### Idea
Use a simple service behind the real gateway and configure one of its routes as protected with the platform’s existing API key controls.

### Detailed Steps

1. Choose or deploy a target service
   - should have at least one safe GET route for public proof
   - should have one additional route suitable for protection proof

2. Verify the service is reachable through the gateway

3. Configure API key protection through the real platform
   - create key
   - enable key enforcement
   - assign protected route(s)

4. Later, extend the API key demo UI with:
   - target URL field
   - public route field
   - protected route field
   - API key input field
   - maybe a “load from live platform” mode

5. Send the four demonstration requests:
   - public route, no key
   - protected route, no key
   - protected route, invalid key
   - protected route, valid key

6. Display:
   - allowed public access
   - denied protected access without key
   - denied protected access with wrong key
   - allowed protected access with valid key

### Why This Is Best

- uses real platform API key enforcement
- keeps the current polished UI
- requires no main-project changes

---

## 7. What The Demo UI Would Eventually Need

Later, the API key demo would likely need:

- service URL/route fields
- optional “fetch current config” or “live mode” behavior
- real request sending
- real response interpretation

The current UI already matches this story very well, so only connection-oriented changes should be needed.

---

## 8. Can An Existing Sample Service Be Used?

## Likely yes, if it has the right routes

If one of the example services already has:
- one safe public route
- one route that looks more administrative or sensitive

then you may be able to use it directly.

If not, you can still deploy a very small demo service inside `simulation` and use that as the target, again without changing the main project.

So API key protection is flexible:
- existing service may be enough
- demo service is easy fallback

---

## 9. If Real Connection Cannot Be Done Using Existing Services, What Backend Changes Would Be Needed?

Only if no suitable route structure exists anywhere.

In that case, fallback options are:

### Backend Change Option 1
Add a better demo-friendly route pair to an existing service

### Backend Change Option 2
Add a built-in demo service to the main repo

### Why This Is Less Preferred

- breaks the read-only separation
- mixes expo demo concerns into the main product

So this should be avoided unless absolutely necessary.

---

## 10. Final Recommendation

## Verdict

Yes, the API key protection demo can be connected to the real platform without changing the main project.

## Recommended Method

Use a real deployed service behind the gateway, configure one route as public and one as protected using the existing API key controls, and let the current demo UI send real requests to those routes.

## What Should Happen Later

When implementation starts:

1. choose target service and routes
2. configure real API key protection in the platform
3. add service URL/route fields to the demo
4. send real requests
5. map real responses into the existing demo cards

## Main Project Changes Needed?

No, as long as a suitable target service exists or a simulation-owned test service is deployed through the current platform.
