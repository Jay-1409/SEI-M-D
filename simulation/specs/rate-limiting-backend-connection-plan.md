# Rate Limiting Demo Backend Connection Plan

## Purpose

This file evaluates whether the existing rate limiting demo in `simulation/demos/rate-limiting` can be connected to the real project backend and gateway without changing the current main project code.

This is a planning and feasibility file only.

No code changes are made here.

---

## 1. Current Situation

The current rate limiting demo is entirely local.

Right now:
- request counts are simulated in the browser
- queue pressure is simulated in the browser
- blocked `429` outcomes are generated locally
- no real traffic hits the gateway or a real deployed service

This is a good educational demo, but not a real proof of the platform’s runtime rate limiting.

---

## 2. Is Real Backend Connection Possible?

## Short Answer

Yes, and this is the easiest of the four to connect to the real project.

It may not even need a dedicated custom backend service if you already have any deployable service that responds reliably through the gateway.

Your own example idea is correct:

- run a service through the software
- give the demo a URL field
- let the demo send repeated requests to that real URL
- if rate limiting is enabled for that service/route, the demo will observe real `429` behavior
- then the demo can show the result using the existing UI

This is very feasible without changing the main project code.

---

## 3. Why Rate Limiting Is Easier Than SQLi/XSS

SQLi and XSS need a route whose content meaningfully matches the story.

Rate limiting is simpler because it only needs:
- a reachable route through the gateway
- real repeated requests
- a configured rate limit

The route does not need to be a login route or a comment route.

Any stable endpoint can work, such as:
- root endpoint
- health/info endpoint
- a simple GET route

So the rate limiting demo is a strong candidate for real integration without much extra backend work.

---

## 4. Best Connection Model

## Recommended Architecture

- Keep the current demo UI
- Add a target URL field later
- Point it to a real service route behind the gateway
- Let the demo send:
  - normal low-frequency traffic
  - flood/high-frequency traffic
- Use the platform’s existing rate-limit config for that service
- Read real status codes and timing results

## Practical Flow

1. Deploy any stable service through the existing platform
2. Configure rate limiting for that service or route using the real platform controls
3. In the demo, enter the gateway URL of that route
4. Send a few normal requests
5. Send a flood burst
6. Watch:
   - success responses when within limit
   - `429` responses when the limit is exceeded
7. Reflect those real results inside the current rate-limiting demo UI

---

## 5. Can It Be Done Without Changing The Main Project?

## Yes, very likely

This is the recommended path.

What is needed:
- a real deployed service behind the gateway
- an endpoint that responds consistently
- real rate limiting configured on that route or service

No main project code changes are required if:
- the service already exists
- or you deploy a simple sample service using the existing platform

---

## 6. Detailed “Possible Without Main Changes” Plan

## Option A: Best Option

### Idea
Use an already deployed service behind the real gateway and let the demo hammer that route with controlled request patterns.

### Detailed Steps

1. Pick a stable target route
   - should respond quickly
   - should be safe to call repeatedly
   - should not have side effects

2. Deploy the service if needed using the current platform

3. Use the service details flow to configure rate limiting
   - global or route-specific
   - choose a low enough limit for an obvious demo

4. Later, update the rate limiting demo UI to add:
   - target URL field
   - maybe a request method selector if useful
   - maybe a “live platform mode” toggle

5. Normal mode in the demo:
   - send a few spaced requests
   - show that they succeed

6. Flood mode in the demo:
   - send many requests quickly
   - capture status codes
   - display real successes vs real `429` blocks

7. Optionally:
   - read or display the real rate-limit config to make the proof clearer

### Why This Is Best

- likely no custom backend service needed
- no main project changes needed
- produces very believable real proof

---

## 7. Alternative If Existing Service Is Not Suitable

If no existing deployed service behaves reliably enough for the demo, then:

- create a tiny stable test service inside `simulation`
- deploy it through the main platform
- use that as the target

Even this still does not require changing the main project.

---

## 8. What The Demo UI Would Eventually Need

Later, the current demo would need:

- target URL field
- mode toggle between local simulation and live mode
- real request dispatch instead of only local counters
- response handling for:
  - success
  - blocked `429`
  - network failure

The existing UI can remain mostly the same because it already has good proof panels and counters.

---

## 9. If Direct Real Connection Fails, What Backend Changes Would Be Needed?

Probably none, unless:
- the current rate limiting config is not exposed in a usable way
- or no safe repeatable route exists at all

Only if neither an existing route nor a deployable test service works would you consider main-project changes.

That would be a fallback, not the recommended plan.

---

## 10. Final Recommendation

## Verdict

Yes, the rate limiting demo can be connected to the real platform without changing the main project.

## Recommended Method

Use a real deployed service behind the gateway, add a target URL field to the current demo later, and send normal versus flood traffic to that route while reading real status codes.

## Best Part

This is the strongest candidate for real integration with minimal extra work.

## What Should Happen Later

When implementation starts:

1. choose a stable service route
2. configure real rate limiting on it
3. add target URL field to the demo
4. replace local-only request simulation with real request bursts in live mode
5. show success versus `429` results in the current UI

## Main Project Changes Needed?

No, very likely not.
