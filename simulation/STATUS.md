# Simulation Status

This file is a lightweight progress snapshot for future agents.

Last updated: 2026-03-25

## Current State

The `simulation` workspace is in expo-integration and rehearsal mode, not core build mode.

Completed now:

- shared launcher exists at `simulation/index.html`
- SQL injection demo is built and supports local fallback plus live gateway mode
- XSS feedback wall demo is built and supports local fallback plus live gateway mode
- rate limiting demo is built and supports local fallback plus live gateway mode
- API key protection demo is built and supports local fallback plus live platform mode
- per-demo live target services exist inside `simulation`
- run documentation has been aligned across the four demos
- handoff/status docs now reflect the shared local-vs-live model
- a simple recommended expo order is documented

## Verified In Source

This status has been checked against the demo files, READMEs, specs, and shared run docs inside `simulation`.

Verified:

- all four demos preserve their current UI quality and storytelling structure
- all four provide a local mode that remains usable if live mode is unavailable
- all four surface live setup problems in-page instead of failing silently
- all four include launcher navigation

Not yet completed in this pass:

- full browser rehearsal on the actual expo machine
- live deployment verification for all four services in one session

## Recommended Expo Order

1. SQL injection
2. XSS feedback wall
3. rate limiting
4. API key protection

## Live Mode Prerequisites

Needed only if the team wants live proof during the expo:

- dashboard reachable at `http://localhost:30000`
- gateway reachable at `http://localhost:30080`
- deployed services:
  - `expo-sqli-demo`
  - `expo-xss-demo`
  - `expo-rate-limit-demo`
  - `expo-api-demo`
- matching platform setup:
  - SQLi protection configured
  - XSS protection configured
  - rate limiting configured
  - API key auth configured and real generated key ready

## Next Safe Actions

1. Rehearse the launcher-driven route on the expo laptop.
2. Manually open each demo and confirm the documented starting state.
3. If live mode matters for the event, verify all four gateway routes and configs before visitors arrive.
4. If live mode is unstable, present the four demos in local mode only and treat live proof as optional.
