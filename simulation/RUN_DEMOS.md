# Run Demos

Last updated: 2026-03-25

This is the single runbook for the four custom expo demos inside `simulation`.

It covers:
- what `local mode` means
- what `live mode` means
- the platform setup needed before the expo
- the recommended presenter order
- per-demo open, run, and reset guidance

## Demo Set Covered Here

- SQL injection
- XSS feedback wall
- rate limiting
- API key protection

## Shared Demo Language

Use the same meaning across all four demos:

- `Local mode`
  Browser-only fallback. No dashboard, no gateway, and no deployed demo service are required. Use this whenever the live platform is unavailable or you need the safest presenter flow.

- `Live mode`
  The same demo page sends real requests through the platform gateway to a simulation-owned target service deployed from `simulation`. Optional platform proof may also appear if the platform API is reachable.

Important presenter rule:
- if live mode fails, switch back to local mode immediately and keep the story moving

## Recommended Expo Order

Use this order for the four custom demos:

1. SQL injection
2. XSS feedback wall
3. rate limiting
4. API key protection

Why this order is recommended:
- SQL injection is the fastest attack story to understand
- XSS extends the idea into public content
- rate limiting shifts from input abuse to traffic abuse
- API key protection closes on route-level access control

## Fastest Starting Point

Open the launcher:

- Direct file: [simulation/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html)
- PowerShell helper: [simulation/scripts/open-simulation-launcher.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-simulation-launcher.ps1)

## Platform Setup Needed Before The Expo

Live mode is optional. The full demo route still works in local mode only.

If you want live mode ready, prepare these shared items first:

1. Confirm the main dashboard is reachable at `http://localhost:30000`.
2. Confirm the gateway is reachable at `http://localhost:30080`.
3. Build the four demo images from each demo's `live-target-service`.
4. Deploy each demo target service through the existing platform.
5. Verify each service works through its gateway route before visitors arrive.

Recommended deployed service names:

- SQL injection: `expo-sqli-demo`
- XSS: `expo-xss-demo`
- rate limiting: `expo-rate-limit-demo`
- API key protection: `expo-api-demo`

Per-demo platform configuration:

- SQL injection
  In `Firewall`, toggle `SQLi Protection` OFF for the vulnerable pass-through proof and ON for the blocked proof.

- XSS
  In `Firewall`, toggle `XSS Protection` OFF for the vulnerable pass-through proof and ON for the blocked proof.

- rate limiting
  In `Firewall > Rate Limiting`, keep rate limiting enabled and set an obvious threshold such as `5 requests / 10 seconds`.

- API key protection
  In `API Key Authentication`, enable auth, generate one real key, and protect only `POST /staff/open-maintenance-panel`.

Optional but recommended before live proof runs:

- clear WAF logs before SQL injection and XSS proof runs
- keep the real generated API key copied and ready for the API key demo

## Per-Demo Run Guide

### 1. SQL Injection

Open it:

- Direct file: [simulation/demos/sql-injection/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\sql-injection\index.html)
- PowerShell helper: [simulation/scripts/open-sql-injection-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-sql-injection-demo.ps1)
- Demo README: [simulation/demos/sql-injection/README.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\sql-injection\README.md)

UI and story check:

- polished three-panel layout is preserved
- local and live mode use the same proof language
- back-to-launcher navigation exists

Recommended local fallback flow:

1. Stay in `Local simulation mode`.
2. Leave `Protection OFF`.
3. Click `Fill Normal User`, then `Login`.
4. Click `Fill Attack Input`, then `Login`.
5. Point to `Unauthorized access allowed`.
6. Turn protection ON.
7. Click `Fill Attack Input`, then `Login`.
8. Point to `Attack blocked`.

Live mode defaults:

- gateway base URL `http://localhost:30080`
- login route `/expo-sqli-demo/login`
- platform API URL `http://localhost:30000/api`

Recommended live flow:

1. Switch to `Live gateway mode`.
2. Click `Use Expo Service Defaults`.
3. Keep platform `SQLi Protection` OFF.
4. Click `Fill Normal User`, then `Login`.
5. Click `Fill Attack Input`, then `Login`.
6. Point to `Unauthorized access allowed`.
7. Turn platform `SQLi Protection` ON.
8. Click `Fill Attack Input`, then `Login`.
9. Point to `Attack blocked`.

Fallback behavior if live mode fails:

- the page keeps working and shows what setup is missing or what request failed
- local mode remains available immediately

Reset:

- `Reset Demo` clears the form and current result but keeps mode, log, counters, and connection fields
- for a fully clean between-visitors state, refresh the tab

### 2. XSS Feedback Wall

Open it:

- Direct file: [simulation/demos/xss-feedback-wall/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\index.html)
- PowerShell helper: [simulation/scripts/open-xss-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-xss-demo.ps1)
- Demo README: [simulation/demos/xss-feedback-wall/README.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\README.md)

UI and story check:

- polished composer / wall / proof layout is preserved
- local and live mode use the same comment-wall story
- back-to-launcher navigation exists

Recommended local fallback flow:

1. Stay in `Local simulation mode`.
2. Click `Use Normal Comment`, then `Post Comment`.
3. Click `Use Attack Payload`.
4. Leave protection OFF.
5. Click `Post Comment`.
6. Point to the warning banner and accepted dangerous comment.
7. Click `Reset Demo`.
8. Turn protection ON.
9. Click `Use Attack Payload`, then `Post Comment`.
10. Point to `Attack Blocked` and the unchanged wall.

Live mode defaults:

- gateway base URL `http://localhost:30080`
- comments route `/expo-xss-demo/comments`
- platform API URL `http://localhost:30000/api`

Recommended live flow:

1. Switch to `Live gateway mode`.
2. Click `Use Expo Service Defaults`.
3. Click `Load Live Wall`.
4. Keep platform `XSS Protection` OFF.
5. Click `Use Normal Comment`, then `Post Comment`.
6. Click `Use Attack Payload`, then `Post Comment`.
7. Point to the dangerous comment being accepted.
8. Turn platform `XSS Protection` ON.
9. Click `Use Attack Payload`, then `Post Comment`.
10. Point to `Attack Blocked`.

Fallback behavior if live mode fails:

- failed load, post, or reset actions produce a setup message instead of breaking the demo
- local mode remains available immediately

Reset:

- in local mode, `Reset Demo` fully restores the seeded wall
- in live mode, `Reset Demo` tries the target reset route and falls back to a safe local-looking state if that fails

### 3. Rate Limiting

Open it:

- Direct file: [simulation/demos/rate-limiting/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\rate-limiting\index.html)
- PowerShell helper: [simulation/scripts/open-rate-limiting-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-rate-limiting-demo.ps1)
- Demo README: [simulation/demos/rate-limiting/README.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\rate-limiting\README.md)

UI and story check:

- polished queue-and-proof layout is preserved
- local and live mode use the same fairness story
- back-to-launcher navigation exists

Recommended local fallback flow:

1. Stay in `Local simulation mode`.
2. With `Rate Limit ON`, click `Send Normal Booking Request`.
3. Switch to `Rate Limit OFF`.
4. Click `Start Spam Flood`.
5. Point to high pressure and zero blocked spam.
6. Click `Reset`.
7. Switch back to `Rate Limit ON`.
8. Click `Start Spam Flood`.
9. Point to `Spam Blocked`, `Blocked 429`, and the summary.

Live mode defaults:

- gateway base URL `http://localhost:30080`
- target route `/expo-rate-limit-demo/tickets`
- platform API URL `http://localhost:30000/api`

Recommended live flow:

1. Switch to `Live gateway mode`.
2. Click `Use Expo Service Defaults`.
3. Click `Send Normal Booking Request`.
4. Point out that real traffic succeeds.
5. Click `Start Spam Flood`.
6. Point to real `429` log rows and the `Spam Blocked` counter.
7. End on the summary card.

Fallback behavior if live mode fails:

- missing route, unreachable gateway, or unexpected responses are shown in the narration/log state
- local mode remains available immediately

Reset:

- `Reset` clears counters, log, pressure, summary, and animations
- it keeps the current mode, connection fields, speed, and burst settings

### 4. API Key Protection

Open it:

- Direct file: [simulation/demos/api-key-protection/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\api-key-protection\index.html)
- PowerShell helper: [simulation/scripts/open-api-key-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-api-key-demo.ps1)
- Demo README: [simulation/demos/api-key-protection/README.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\api-key-protection\README.md)

UI and story check:

- polished request / logic / proof layout is preserved
- local and live mode use the same public-vs-protected route story
- back-to-launcher navigation exists

Recommended local fallback flow:

1. Stay in `Local simulation`.
2. Leave the route on `GET /public/help-hours`.
3. Click `Use No Key`, then `Send Request`.
4. Switch route to `POST /staff/open-maintenance-panel`.
5. Click `Use No Key`, then `Send Request`.
6. Click `Use Wrong Key`, then `Send Request`.
7. Click `Use Valid Staff Key`, then `Send Request`.

Live mode defaults:

- gateway base URL `http://localhost:30080`
- public route `/expo-api-demo/public/help-hours`
- protected route `/expo-api-demo/staff/open-maintenance-panel`

Recommended live flow:

1. Switch to `Live platform mode`.
2. Click `Use Expo Service Defaults`.
3. Keep the route on the public path.
4. Click `Use No Key`, then `Send Request`.
5. Switch to the protected route.
6. Click `Use No Key`, then `Send Request`.
7. Click `Use Wrong Key`, then `Send Request`.
8. Paste the real generated key into `Access Key`.
9. Click `Send Request`.

Fallback behavior if live mode fails:

- the page shows `Check Setup` guidance when the route is unprotected, wrongly protected, unreachable, or otherwise mismatched
- local mode remains available immediately

Reset:

- `Reset Demo` returns the route to the public route
- clears the key field, counters, event log, and latest result
- keeps the current mode and live connection fields

## Best Tab Layout For The Expo Laptop

Recommended tab order:

1. [simulation/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html)
2. SQL injection
3. XSS feedback wall
4. rate limiting
5. API key protection
6. main dashboard at `http://localhost:30000`

If you plan to show live proof:

7. the relevant service details page in the dashboard
8. firewall or API key configuration tab already open for quick switching

## Start-Of-Day Reset Checklist

1. Open the launcher.
2. Open all four custom demos once.
3. Put each demo in the starting mode you want for the first visitor, usually local mode.
4. SQL injection: refresh the tab for a full clean state.
5. XSS: click `Reset Demo`.
6. rate limiting: click `Reset`.
7. API key protection: click `Reset Simulation`.
8. If using live mode, confirm all four gateway routes respond before visitors arrive.
9. If using live WAF proof, clear logs before the first run.

## Expo-Ready Summary

What is ready now:

- all four custom demos are integrated under one launcher
- all four preserve their current UI and storytelling
- all four support local fallback
- all four have live-mode setup paths documented
- all four have a consistent recommended presenter order

What setup is still required for live mode:

- deploy the four simulation-owned target services
- configure the matching platform protections
- verify gateway reachability and, for API key protection, keep the real generated key ready

If any of that is not ready, the expo can still run cleanly in local mode only.
