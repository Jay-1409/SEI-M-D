# Simulation Workspace

This folder contains all planning, specs, assets, and demo code for the expo simulations of the Secure Microservice Deployer project.

## Absolute Rules

- Do not modify the main project code or folders.
- Only add, edit, or delete files inside `simulation`.
- Treat the main project as read-only reference material.
- If a simulation needs data or behavior inspired by the main project, recreate or simulate it inside this folder.

## Purpose

The goal of this workspace is to provide a polished expo kit that explains:
- what the software does
- why it matters
- what risks it solves
- how the protections work
- how to keep the presentation smooth even if the live platform is unavailable

## Current Expo Demos

The four custom demos are now the main presentation set:

- SQL injection
- XSS feedback wall
- rate limiting
- API key protection

Each of these demos now supports the same two-mode presenter story:

- `Local mode`
  The demo runs fully inside the browser with no dependency on the main platform. This is the safe fallback for offline use, setup mistakes, or recovery during the expo.

- `Live mode`
  The same demo UI sends real requests through the platform gateway to a simulation-owned target service deployed from inside `simulation`. If optional platform proof is available, the demo can also show live WAF or rate-limit data.

## Shared Meaning Of Local And Live Mode

### Local mode

Use local mode when:
- the expo machine is offline
- the gateway is not running
- the service deployment is not ready
- the presenter needs the fastest and safest route

What local mode means:
- no main-platform dependency
- no real gateway request
- same story and same visual proof
- always available as fallback

### Live mode

Use live mode when:
- the dashboard and gateway are available
- the matching demo target service is deployed
- the platform protection for that demo has been configured

What live mode means:
- the visitor still sees the same polished demo page
- requests go through the real gateway
- the outcome comes from the real platform path
- if the live route or config fails, the demo should explain the issue clearly without breaking the page

## Recommended Expo Order

For the four custom demos, use this order:

1. SQL injection
2. XSS feedback wall
3. rate limiting
4. API key protection

Why this order works:
- it starts with the easiest attack story to understand
- then shows unsafe public input
- then broadens into platform resilience under traffic abuse
- then ends with route-level access control

## Platform Setup Needed Before The Expo

Live mode is optional. The expo can still run fully in local mode if needed.

If you want live mode ready, prepare these shared platform requirements before visitors arrive:

- main dashboard reachable at `http://localhost:30000`
- gateway reachable at `http://localhost:30080`
- Docker image tar files built from each demo's `live-target-service`
- each target service deployed through the existing platform
- each service reachable through its gateway path

Recommended live service names:

- SQL injection: `expo-sqli-demo`
- XSS: `expo-xss-demo`
- rate limiting: `expo-rate-limit-demo`
- API key protection: `expo-api-demo`

Per-demo platform configuration needed:

- SQL injection
  Toggle `SQLi Protection` OFF for the vulnerable proof run, then ON for the blocked proof run.

- XSS
  Toggle `XSS Protection` OFF for the vulnerable proof run, then ON for the blocked proof run.

- rate limiting
  Enable rate limiting on the target route and set a clearly visible threshold such as `5 requests / 10 seconds`.

- API key protection
  Enable API key auth, protect only `POST /staff/open-maintenance-panel`, and keep the generated real key ready for the final proof step.

## Key Files

- [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html)
  Shared launcher for all custom demos and presenter docs.

- [RUN_DEMOS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\RUN_DEMOS.md)
  Single runbook for demo order, per-demo setup, resets, local/live meaning, and expo presentation flow.

- [HANDOFF.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\HANDOFF.md)
  Current status, integration notes, and the next safest actions.

- [STATUS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\STATUS.md)
  Lightweight snapshot of what is complete and what still needs rehearsal.

- [PRESENTER_PLAYBOOK.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\PRESENTER_PLAYBOOK.md)
  Short intro, presenter script ideas, and likely visitor Q&A.

- [EXPO_SETUP_AND_RESET_GUIDE.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\EXPO_SETUP_AND_RESET_GUIDE.md)
  Extra pre-expo setup, reset, and troubleshooting guidance.

## Folder Structure

- `specs/`
  Detailed specs and backend connection plans for the demos and real-platform guide flows.

- `demos/`
  Built custom demo pages plus simulation-owned live target services.

- `assets/`
  Shared images, icons, screenshots, and text content.

- `scripts/`
  Helper scripts for opening the launcher and demos.

## How To Continue In A New Chat

1. Read [README.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\README.md)
2. Read [RUN_DEMOS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\RUN_DEMOS.md)
3. Read [HANDOFF.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\HANDOFF.md)
4. Read [STATUS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\STATUS.md)
5. Work only inside `simulation`

## Working Style

- Spec before build
- Simple language over technical jargon
- Clear before/after demonstrations
- Every simulation should end with visible proof
- Keep local fallback available even when live mode exists
- Prefer familiar stories like login pages, feedback forms, ticket booking, and staff-only access
