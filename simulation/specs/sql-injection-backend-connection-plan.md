# SQL Injection Demo Backend Connection Plan

## Purpose

This file evaluates whether the existing SQL injection demo in `simulation/demos/sql-injection` can be connected to the real project backend and gateway without changing the current main project code.

This is a planning and feasibility file only.

No code changes are made here.

---

## 1. Current Situation

The current SQL injection demo is a self-contained frontend simulation.

Right now:
- the username and password are processed entirely inside the demo JavaScript
- the demo decides locally whether the login is normal, malicious, blocked, or invalid
- no real request is sent to the main backend, gateway, or any deployed service

So the current SQLi demo is good for explanation, but not yet a real proof of the platform’s runtime protection.

---

## 2. Is Real Backend Connection Possible?

## Short Answer

Yes, it is possible.

But not by sending the login directly to the main backend alone.

The best real connection path is:

1. keep the SQLi demo UI
2. add a field for the target service URL or service route
3. send the login request from the demo to a real service running behind the gateway
4. let the gateway/WAF inspect that request
5. show the real result returned by the gateway or backend

This can be done without changing the main project code, as long as a suitable target service exists.

---

## 3. Why The Main Backend Alone Is Not Enough

The main deployer backend is not a login service.

It provides:
- deployment
- scanning
- WAF config proxying
- API key config proxying
- service lifecycle management

It does not provide a built-in login endpoint specifically designed for SQL injection demo traffic.

So if the SQL injection demo sends username and password to the deployer backend, there is no natural “fake login” business flow there.

That means the demo should not call the deployer backend directly for login logic.

Instead, it should call a service that is deployed behind the gateway.

---

## 4. Best Connection Model

## Recommended Architecture

- Demo UI stays in `simulation`
- A demo login service runs as a normal microservice through the real platform
- The visitor-facing request goes through the real gateway
- SQL injection protection is controlled through the real WAF config
- The demo UI reads the real response and translates it into the same nice visual proof it already has

## Practical Flow

1. Deploy a small login-like demo service through the existing platform
2. Access it only through the real gateway
3. Configure WAF SQLi protection for that service
4. From the SQL injection demo UI, send:
   - normal login requests
   - malicious SQLi payload requests
5. Show:
   - success in the vulnerable case if WAF is off and the demo service is intentionally permissive
   - blocked result when WAF is on

---

## 5. Can It Be Done Without Changing The Main Project?

## Yes, if you use a deployed test service

This is the cleanest approach.

What is needed:
- no main project code changes
- a test service that accepts login requests
- that test service can live fully inside `simulation`
- it can be containerized and deployed using the existing platform

Then the SQL injection demo can simply send requests to:

`http://localhost:30080/<service-name>/...`

or any gateway route equivalent in your setup.

## Important Note

The WAF SQL injection detection appears to be implemented in the gateway, so the request must pass through the gateway to prove the real protection.

If the demo talks directly to the service and bypasses the gateway, the SQLi protection proof becomes invalid.

---

## 6. Detailed “Possible Without Main Changes” Plan

## Option A: Best Option

### Idea
Create a small fake login microservice inside `simulation`, deploy it through the real platform, and point the SQLi demo to its gateway URL.

### Detailed Steps

1. Create a demo login service inside `simulation`
   - should expose a POST login-like endpoint
   - should accept `username` and `password`
   - should return clear JSON responses

2. Make the service intentionally useful for demoing SQLi
   - normal credentials return success
   - attack payload can produce a vulnerable-looking outcome if protection is off
   - or the service can simply echo input in a way that the gateway still inspects before forwarding

3. Containerize the demo service

4. Deploy it through the existing platform UI/backend

5. Enable or disable WAF SQLi config for that deployed service using the real platform

6. In the SQL injection demo UI, later add:
   - a target URL field
   - or a service route field
   - or a preconfigured endpoint option

7. On submit, the demo UI sends the real request through the gateway

8. The demo UI interprets real responses such as:
   - 200 success
   - 4xx blocked
   - gateway WAF rejection

9. The demo UI also optionally reads the real WAF event proof from the platform and shows it

### Why This Is Best

- uses the real gateway
- uses the real WAF
- preserves your rule of not changing main project code
- keeps the current demo UI mostly intact

---

## 7. What The Demo UI Would Eventually Need

Not for now, but later, the current SQLi demo would need small frontend changes such as:

- add target service URL field
- add “connect to live platform” mode
- keep “pure simulation” mode as fallback
- map real HTTP outcomes into the existing banners and proof cards

This is a demo-side change only, not a main-project change.

---

## 8. If You Want The Demo To Use Only Existing Main Services

## Is That Possible?

Not reliably for SQL injection.

Reason:
- there is no known built-in login endpoint in the current main project for this use case
- the deployer backend is management-oriented, not a user-auth service
- existing sample services may not provide a suitable login flow

So SQL injection is not a good candidate for “just use an already existing backend endpoint” unless one of your example services already includes a login-style route that meaningfully accepts injectable text.

From the current project structure, that does not look guaranteed.

---

## 9. If It Is Not Done Through A Deployed Demo Service, What Backend Changes Would Be Needed?

If you do not want a separate demo service, then the main project would need one of these changes:

### Backend Change Option 1
Add a dedicated login-demo endpoint somewhere in the main system.

### Backend Change Option 2
Add a built-in intentionally testable sample service to the main project.

### Why This Is Less Preferred

- violates your “do not touch the main project” rule
- mixes expo demo logic into the real product
- increases cleanup burden

So this should be avoided if possible.

---

## 10. Final Recommendation

## Verdict

Yes, the SQL injection demo can be connected to the real backend behavior without changing the main project.

## Recommended Method

Use a small login-like test microservice created inside `simulation`, deploy it through the existing platform, and have the demo UI send requests to that service through the real gateway.

## What Should Happen Later

When implementation starts, the work should be split into:

1. create a deployable SQLi target service inside `simulation`
2. deploy it through the main platform
3. add a URL/service field to the SQLi demo UI
4. connect submit behavior to the real gateway route
5. map real responses into the existing SQLi demo result panels
6. optionally fetch WAF proof from the platform for stronger evidence

## Main Project Changes Needed?

No, not if you use the deployable demo service approach.
