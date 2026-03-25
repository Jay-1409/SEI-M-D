# Simulation Status

This file is a lightweight progress snapshot for future agents.

Last updated: 2026-03-23

## Foundation Status

Completed:
- workspace rules and continuation docs exist
- roadmap exists with priorities, dependencies, and a demo status table
- decisions log exists and matches the current simulation direction
- base folders exist: `specs/`, `demos/`, `assets/`, `scripts/`
- shared launcher exists at `simulation/index.html`
- presenter playbook exists
- expo setup and reset guide exists
- the SQL injection spec is written
- the SQL injection custom demo is built in `demos/sql-injection`
- the XSS spec is written
- the XSS custom demo is built in `demos/xss-feedback-wall`
- the rate limiting spec is written
- the rate limiting custom demo is built in `demos/rate-limiting`
- the API key protection spec is written
- the API key protection custom demo is built in `demos/api-key-protection`
- real-platform guides now exist for deployment/gateway, Trivy, Nikto, and WAF logs/stats

Not started yet:
- OpenAPI detection guide
- service lifecycle guide
- optional dangerous-headers decision/demo
- final expo-machine rehearsal across the real-platform route

## Current Working Truth

The simulation workspace is now in an integration-and-presentation stage.

Completed now:
- launcher page for opening demos and docs from one place
- helper scripts for launcher, SQL injection, XSS, rate limiting, and API key demos
- presenter playbook with intro, per-demo explanation, full route, fast route, and likely Q&A
- expo setup and reset runbook
- light shared navigation added to all built custom demos
- SQL injection spec and custom demo build
- XSS spec and custom demo build
- rate limiting spec and custom demo build
- API key protection spec and custom demo build
- real-platform spec guides for deployment/gateway, Trivy, Nikto, and WAF proof flow

The current plan direction remains:
- custom simulations for SQL injection, XSS, rate limiting, and API key protection
- real-platform demo guides for deployment/gateway, Trivy, Nikto, WAF logs, and related supporting flows

## Recommended Next Safe Actions

1. Rehearse the launcher-driven expo route on the exact presentation machine.
2. Manually sanity-check each built demo in the browser after any future polish changes.
3. Complete optional remaining docs only if they materially help the expo: OpenAPI detection, service lifecycle, or dangerous headers.
4. Keep `HANDOFF.md`, `STATUS.md`, `SIMULATION_TASK_LIST.md`, and `SIMULATION_ROADMAP.md` synchronized whenever more work is added.
5. Preserve the current low-risk approach: improve consistency and navigation without rewriting stable demo behavior.

## Coordination Notes

- Do not mark a spec task complete until its presenter script and implementation notes are written.
- Do not start demo builds until the matching spec task is complete.
- SQL injection, XSS, rate limiting, and API key specs/builds now satisfy those conditions.
- Several real-platform guides also already include presenter and setup guidance, so the docs should reflect that reality.
- If a future agent begins a task, update the status markers first so parallel work stays clear.
