# Expo Setup And Reset Guide

Last updated: 2026-03-25

## Goal

Use this guide to start the `simulation` workspace cleanly, run the custom demos reliably, and reset quickly between visitors.

## Pre-Expo Setup

1. Open [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html) once to verify the launcher loads.
2. Open each built custom demo once from the launcher.
3. Confirm each page loads fully in the browser without a backend.
4. Keep [PRESENTER_PLAYBOOK.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\PRESENTER_PLAYBOOK.md) easy to reach for the presenter.
5. If you are also showing the live platform route, verify the dashboard at `http://localhost:30000` and gateway at `http://localhost:30080`.
6. If you want the API key demo in live mode, deploy the service from [simulation/demos/api-key-protection/live-target-service](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\api-key-protection\live-target-service\README.md) and configure API key protection before visitors arrive.

## Start-Of-Day Checklist

1. Launch the simulation hub from [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html) or the helper script.
2. Open the four custom demos in separate tabs.
3. Reset each custom demo before the first visitors arrive.
4. Open the dashboard and leave the real-platform tab ready at the page you plan to show first.
5. If using the API key live proof, keep these values ready:
   - gateway `http://localhost:30080`
   - public route `/expo-api-demo/public/help-hours`
   - protected route `/expo-api-demo/staff/open-maintenance-panel`
   - one real generated API key copied from the platform

## Between Visitors Reset

1. SQL injection: click `Reset Demo`.
2. XSS feedback wall: click `Reset Demo`.
3. Rate limiting: click `Reset`.
4. API key protection: click `Reset Demo`.
5. If showing WAF logs, clear them before the next round.
6. If showing API key live mode, leave the mode and route fields in place and just clear the pasted real key if needed.

## Troubleshooting

- Launcher or demo page does not open:
  Open [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html) directly in the browser.

- A custom demo looks stale:
  Refresh the tab, then use its reset button.

- Real-platform scan is too slow:
  Use a pre-deployed service and jump straight to the `Security` tab.

- API key live mode says `Check Setup`:
  Confirm the service is reachable through `http://localhost:30080`, the public route stays unprotected, and only the protected route is checked in the platform API key tab.

- API key live mode cannot reach the gateway:
  Switch the demo back to `Local simulation` and continue the story without losing the audience.

- Time is short:
  Use the short route from the playbook.

## Minimum Viable Fallback

If the real platform is unavailable or too slow:

1. Start from SQL injection.
2. Show XSS.
3. Show rate limiting.
4. End with API key protection.

This fallback still delivers a clean security story entirely from inside `simulation`.

## Helper Scripts

Available opener scripts inside [scripts](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts):

- `open-simulation-launcher.ps1`
- `open-sql-injection-demo.ps1`
- `open-xss-demo.ps1`
- `open-rate-limiting-demo.ps1`
- `open-api-key-demo.ps1`
