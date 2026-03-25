# Run Demos

Last updated: 2026-03-24

This file is the single runbook for every completed demo under `simulation`.

It covers:
- how to open each completed demo
- how to reset it between visitors
- the recommended expo order
- the safest fallback order if the live platform is unavailable

## What Counts As Completed Right Now

Completed custom demos:
- SQL injection
- XSS feedback wall
- rate limiting
- API key protection

Completed real-platform demo guides:
- deployment and gateway access
- Trivy image scan
- Nikto live scan
- WAF logs and stats

Not included here because they are not complete:
- OpenAPI detection
- service lifecycle controls
- dangerous headers

## Fastest Starting Point

Open the launcher:
- Direct file: [simulation/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html)
- PowerShell helper: [simulation/scripts/open-simulation-launcher.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-simulation-launcher.ps1)

The launcher links to:
- all four custom demo pages
- the four completed real-platform guides
- presenter docs

## Recommended Expo Order

Use this full route when the main platform is available:

1. Deployment and gateway access
2. Trivy image scan or Nikto live scan
3. SQL injection
4. XSS feedback wall
5. Rate limiting
6. API key protection
7. WAF logs and stats

Why this order works:
- it starts with the real platform foundation
- then shows a real scan
- then moves into the clearest crowd-friendly attack stories
- then ends on proof from the firewall logs

If time is short, use this short route:

1. SQL injection
2. XSS feedback wall
3. Rate limiting
4. API key protection or WAF logs

If the live platform is down, use this simulation-only fallback:

1. SQL injection
2. XSS feedback wall
3. Rate limiting
4. API key protection

## Completed Custom Demos

### 1. SQL Injection

Open it:
- Direct file: [simulation/demos/sql-injection/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\sql-injection\index.html)
- PowerShell helper: [simulation/scripts/open-sql-injection-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-sql-injection-demo.ps1)

Exact presenter flow:
1. Leave `Protection OFF`.
2. Click `Fill Normal User`.
3. Click `Login`.
4. Click `Fill Attack Input`.
5. Click `Login`.
6. Point to `Unauthorized access allowed`.
7. Click `Turn Protection ON`.
8. Click `Fill Attack Input` again.
9. Click `Login`.
10. Point to `Attack blocked`.

Supported demo inputs:
- `admin` / `admin123`
- `admin` / `' OR '1'='1`

Exact reset behavior:
- `Reset Demo` only clears the username, password, and current result state.
- It does **not** clear `Blocked Attacks`.
- It does **not** clear `Activity Log`.
- It does **not** clear total request count.
- It keeps the current protection mode.

Best between-visitors reset:
1. Refresh the tab for a full clean state.
2. Then leave the page in the mode you want to start with, usually `Protection OFF`.

### 2. XSS Feedback Wall

Open it:
- Direct file: [simulation/demos/xss-feedback-wall/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\index.html)
- PowerShell helper: [simulation/scripts/open-xss-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-xss-demo.ps1)

Exact presenter flow:
1. Click `Use Normal Comment`.
2. Click `Post Comment`.
3. Click `Use Attack Payload`.
4. Leave `Protection OFF`.
5. Click `Post Comment`.
6. Point to the warning banner and `No gateway block occurred`.
7. Click `Reset Demo`.
8. Turn protection on with the toggle.
9. Click `Use Attack Payload`.
10. Click `Post Comment`.
11. Point to `Attack Blocked` and the unchanged wall.

Exact reset behavior:
- `Reset Demo` fully resets the page.
- It turns protection back to `OFF`.
- It restores the original seeded comments.
- It clears the block counter.
- It clears timeline and proof state.
- It removes the unsafe warning banner.

Best between-visitors reset:
1. Click `Reset Demo`.
2. Confirm the banner says the wall is normal and the block count is `0`.

### 3. Rate Limiting

Open it:
- Direct file: [simulation/demos/rate-limiting/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\rate-limiting\index.html)
- There is no dedicated helper script beyond the launcher.

Default state when opened:
- `Rate Limit ON`
- spam speed `Medium`
- burst size `25 requests`

Exact presenter flow:
1. With `Rate Limit ON`, click `Send Normal Booking Request`.
2. Click the mode button and switch to `OFF`.
3. Click `Start Spam Flood`.
4. Point to high pressure and zero blocked spam.
5. Click `Reset`.
6. Switch back to `ON`.
7. Click `Start Spam Flood` again.
8. Point to `Spam Blocked`, `Blocked 429`, and the summary card.

Useful built-in option:
- `Replay Guided Demo` automatically runs the ON normal request, OFF flood, then ON flood sequence.

Exact reset behavior:
- `Reset` clears counters, log, pressure, summary, and in-flight animations.
- It keeps the current protection mode.
- It keeps the current speed and burst selections.

Best between-visitors reset:
1. Click `Reset`.
2. Make sure the mode is the one you want to start with.
3. For the usual route, set it back to `Rate Limit ON`.

### 4. API Key Protection

Open it:
- Direct file: [simulation/demos/api-key-protection/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\api-key-protection\index.html)
- PowerShell helper: [simulation/scripts/open-api-key-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-api-key-demo.ps1)

Exact presenter flow:
1. Leave the route on `GET /public/help-hours`.
2. Click `Use No Key`.
3. Click `Send Request`.
4. Switch route to `POST /staff/open-maintenance-panel`.
5. Click `Use No Key`.
6. Click `Send Request`.
7. Click `Use Wrong Key`.
8. Click `Send Request`.
9. Click `Use Valid Staff Key`.
10. Click `Send Request`.

Demo key values:
- Valid: `STAFF-ACCESS-DEMO-2026`
- Wrong: `STAFF-KEY-DEMO-WRONG`

Exact reset behavior:
- `Reset Demo` returns the route to `GET /public/help-hours`.
- It clears the key field.
- It clears allowed and denied counters.
- It clears the session event log.

Best between-visitors reset:
1. Click `Reset Demo`.
2. Confirm the route is back on the public route and both counters are `0`.

## Completed Real-Platform Demo Guides

These are completed as presentation guides inside `simulation/specs`. They are not standalone static demo pages.

### 5. Deployment And Gateway Access

Guide:
- [simulation/specs/deployment-gateway-access-demo-spec.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\specs\deployment-gateway-access-demo-spec.md)

What you need ready:
- main dashboard at `http://localhost:30000`
- gateway at `http://localhost:30080`
- `example-api.tar` from `examples/simple-api`

Exact run flow:
1. Open the dashboard.
2. Go to `Deploy New Service`.
3. Upload `example-api.tar`.
4. Use service name `example-api`.
5. Use container port `8000`.
6. Deploy.
7. Open the generated gateway URL.
8. Point out that the public route is `http://localhost:30080/example-api`.

Reset:
- easiest reset is to reuse the already deployed service
- if you want the full deploy story again, delete and redeploy `example-api`

### 6. Trivy Image Scan

Guide:
- [simulation/specs/trivy-image-scan-demo-spec.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\specs\trivy-image-scan-demo-spec.md)

What you need ready:
- main dashboard at `http://localhost:30000`
- Trivy available in the main platform
- prepared images:
  - `example-api.tar`
  - `vulnerable-api.tar`

Exact run flow:
1. Upload one prepared image in `Deploy New Service`, or open a deployed service.
2. Click `Run Trivy`.
3. Wait for the scan state.
4. Point to `Total Findings`, `Critical`, and `High`.

Reset:
- simplest reset is to rerun `Run Trivy`
- if time is short, leave one good result already on screen for the next visitor

### 7. Nikto Live Scan

Guide:
- [simulation/specs/nikto-live-scan-demo-spec.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\specs\nikto-live-scan-demo-spec.md)

What you need ready:
- main dashboard at `http://localhost:30000`
- deployed service `vulnerable-api`
- gateway path reachable for that service

Exact run flow:
1. Open `vulnerable-api` in the service list.
2. Click `Manage`.
3. Open the `Security` tab.
4. In `Web Vulnerability Scanner`, click `Run Scan`.
5. Point to the total findings and visible issue list.

Reset:
- easiest reset is to keep `vulnerable-api` deployed
- rerun `Run Scan` when you want a fresh live scan
- reload the page if the UI looks busy

### 8. WAF Logs And Stats

Guide:
- [simulation/specs/waf-logs-stats-demo-spec.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\specs\waf-logs-stats-demo-spec.md)

What you need ready:
- a deployed demo service in the main platform
- its `Firewall` tab working
- Bruno attack requests ready:
  - `bruno/10-Test SQLi Attack.bru`
  - `bruno/11-Test XSS Attack GET.bru`

Exact run flow:
1. Open the service `Firewall` tab.
2. Turn `SQLi Protection` and `XSS Protection` on.
3. Click `Clear Logs`.
4. Send the SQLi Bruno request.
5. Return and point to `Total Blocked`, `SQLi Blocked`, and the new event.
6. Send the XSS Bruno request.
7. Return and point to `Total Blocked`, `XSS Blocked`, and the second event.

Reset:
1. Click `Clear Logs`.
2. Leave SQLi and XSS protection enabled.
3. Keep Bruno open and ready for the next run.

## Best Tab Layout For The Expo Laptop

If possible, preload tabs in this order:

1. [simulation/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html)
2. main dashboard at `http://localhost:30000`
3. SQL injection
4. XSS feedback wall
5. rate limiting
6. API key protection

If you are also doing live WAF proof:

7. service `Firewall` tab
8. Bruno with the SQLi and XSS requests ready

## Start-Of-Day Reset Checklist

1. Open the launcher once.
2. Open all four custom demos once.
3. Refresh the SQL injection tab so its counters and log start clean.
4. Click `Reset Demo` in XSS.
5. Click `Reset` in rate limiting.
6. Click `Reset Demo` in API key protection.
7. If using the live platform, open the dashboard and the firewall tab.
8. If using WAF proof, click `Clear Logs` before visitors arrive.

## Important Notes

- All four custom demos are fully self-contained inside `simulation`.
- The completed real-platform items in this workspace are guides, not cloned copies of the main platform.
- The SQL injection page is the only custom demo whose reset button does not fully clear the session proof. Use a browser refresh for a truly clean restart.
