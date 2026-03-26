# XSS Demo Backend Connection Plan

## Purpose

This file evaluates whether the existing XSS demo in `simulation/demos/xss-feedback-wall` can be connected to the real project backend and gateway without changing the current main project code.

This is a planning and feasibility file only.

No code changes are made here.

---

## 1. Current Situation

The current XSS feedback-wall demo is fully self-contained.

Right now:
- comments are stored and rendered locally inside the demo
- the demo itself decides whether a payload is accepted or blocked
- no real request goes to the platform gateway or backend

So the current demo explains XSS well, but it does not yet prove the real platform is blocking the request.

---

## 2. Is Real Backend Connection Possible?

## Short Answer

Yes, it is possible.

And among the four demos, this is one of the easier ones to connect cleanly.

The best real connection path is:

1. keep the existing XSS UI
2. add a target service URL or route field later
3. send the comment submission to a real comment-like service behind the gateway
4. let the gateway inspect and block the payload
5. display the returned result in the current feedback-wall UI

This can be done without changing the main project code, as long as you deploy or already have a suitable comment-style service.

---

## 3. Why The Main Backend Alone Is Not Enough

The deployer backend is not a public comments backend.

It does not naturally offer:
- `POST /comments`
- comment rendering
- user-generated content flow

So the XSS demo should not try to use the deployer backend directly as the target for comment posts.

Instead, it should use a real service that sits behind the gateway.

---

## 4. Best Connection Model

## Recommended Architecture

- Demo UI remains in `simulation`
- A simple feedback/comment service is deployed through the real platform
- Demo UI sends comment requests through the real gateway
- XSS protection is controlled via the real WAF config
- Demo UI renders the outcome based on real responses

## Practical Flow

1. Deploy a small comment service through the main platform
2. Enable or disable XSS WAF protection for that service
3. Use the XSS demo UI to send normal comments and malicious payloads
4. If protection is off, the backend accepts the comment
5. If protection is on, the gateway blocks the request before it reaches the service
6. The demo UI shows the result and optionally shows WAF proof

---

## 5. Can It Be Done Without Changing The Main Project?

## Yes, if you use a deployed comment-style test service

This is the recommended approach.

What is needed:
- a small feedback-wall or comments service inside `simulation`
- deploy it using the current platform
- route requests through the gateway
- toggle XSS protection through the existing WAF config flow

Then the XSS demo can call the real route such as:

`http://localhost:30080/<service-name>/comments`

or another service path that represents comment submission.

## Important Requirement

The request must go through the gateway for the XSS protection proof to be real.

If the demo calls the service directly, the platform’s gateway protection will not be demonstrated.

---

## 6. Detailed “Possible Without Main Changes” Plan

## Option A: Best Option

### Idea
Create a small comment-wall microservice inside `simulation`, deploy it through the real platform, and use the current XSS demo UI as a friendly front-end to that service.

### Detailed Steps

1. Create a comment service inside `simulation`
   - should accept a comment submission
   - should return current comments
   - should be simple and predictable for expo use

2. Containerize the service

3. Deploy it through the main platform

4. Configure XSS WAF protection for the deployed service through the existing platform controls

5. Later, extend the XSS demo UI with:
   - target service URL field
   - maybe a “live mode” toggle

6. On normal comment submit:
   - send real request through gateway
   - if accepted, show the comment in the wall

7. On malicious payload submit:
   - if XSS protection is off, the service accepts the content
   - if XSS protection is on, the gateway blocks the request

8. Optionally:
   - query WAF events for proof
   - display last blocked event in the demo’s proof card

### Why This Is Best

- does not require main project changes
- uses the real gateway
- makes the “blocked before it reached the page” story actually true

---

## 7. What The Demo UI Would Eventually Need

Not now, but later the current demo would likely need:

- target URL/service field
- a mode switch between local simulation and live platform
- real submit handling
- real refresh/load comments handling
- mapping from actual gateway/backend responses to current visitor-friendly messages

This is still a `simulation` change, not a main-project change.

---

## 8. Can Existing Main Example Services Be Used Instead?

## Maybe, but not reliably

If one of the existing sample services already has:
- a user-content endpoint
- or a route that reflects user input in a useful way

then it may be possible to use it.

However, from the current project structure, there is no guaranteed prebuilt comment-wall style service intended for this XSS flow.

So relying on an existing sample service is riskier than deploying a purpose-built demo service inside `simulation`.

---

## 9. If A Separate Demo Service Is Not Allowed, What Backend Changes Would Be Needed?

If you refuse the demo-service approach, then the main project would need:

### Backend Change Option 1
Add a built-in feedback/comment endpoint to a main service

### Backend Change Option 2
Bundle a built-in XSS test service in the main repo

### Why This Is Less Preferred

- breaks the read-only separation
- adds expo-specific functionality into the main codebase
- makes cleanup and ownership worse

So this should be avoided if possible.

---

## 10. Final Recommendation

## Verdict

Yes, the XSS demo can be connected to the real platform behavior without changing the main project.

## Recommended Method

Use a simple feedback/comment microservice created inside `simulation`, deploy it through the real platform, and route demo comment submissions through the real gateway.

## What Should Happen Later

When implementation starts:

1. create deployable XSS target service inside `simulation`
2. deploy it with the current platform
3. add a target URL field to the XSS demo
4. send comment requests through the real gateway
5. render accepted comments from real responses
6. render blocked outcomes from real gateway responses
7. optionally show real WAF event proof

## Main Project Changes Needed?

No, not if you use the deployable demo service approach.
