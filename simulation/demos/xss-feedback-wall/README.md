# XSS Feedback Wall Demo

This folder contains the XSS feedback wall demo with two connection paths:

- `Local simulation mode`
- `Live gateway mode`

The current UI and story stay the same. Live mode only adds a small connection card so the demo can point at a real gateway-backed target service when the platform is available.

## What It Shows

- normal public comment posting
- a dangerous script-style comment in `Protection OFF` mode
- the same dangerous payload being blocked in `Protection ON` mode
- visible proof through status badges, a block counter, event details, recent timeline, and optional live WAF stats

## Files In This Folder

- [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\index.html)
- [script.js](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\script.js)
- [styles.css](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\styles.css)
- [live-target-service](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\live-target-service)

## How To Open It

Option 1:

- Open [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\index.html) directly in a browser.

Option 2:

- Run [open-xss-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-xss-demo.ps1) from PowerShell.

## Local Mode

Local mode is still the fallback and default.

It requires no platform access and keeps the original self-contained behavior:

- normal comments are accepted
- suspicious comments are accepted if protection is OFF
- suspicious comments are blocked if protection is ON

## Live Mode

Live mode sends requests through the real gateway to a simulation-owned feedback service deployed through the platform.

Required fields:

- `Gateway Base URL`
- `Comments Route`

Optional field:

- `Platform API URL`

The `Use Expo Service Defaults` button fills:

- gateway base URL `http://localhost:30080`
- comments route `/expo-xss-demo/comments`
- platform API URL `http://localhost:30000/api`

Live behavior:

- normal comments should return success and appear on the wall
- attack payloads should appear on the wall when XSS protection is OFF and the payload reaches the service
- attack payloads should return a gateway `403` when XSS protection is ON
- if the platform API URL works, the live proof card also shows XSS block stats and the latest WAF event summary

## Deploy The Live Target Service

The deployable service lives at:

- [live-target-service](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\live-target-service)

Full service instructions:

- [live-target-service/README.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\live-target-service\README.md)

Quick deployment summary:

1. Build `expo-xss-demo.tar` from [live-target-service](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\live-target-service).
2. Upload it through the main dashboard.
3. Deploy it with service name `expo-xss-demo`.
4. Use container port `8000`.
5. Open the service `Firewall` tab.
6. Turn `XSS Protection` OFF for the vulnerable live pass-through run.
7. Turn `XSS Protection` ON for the blocked run.

## Recommended Demo Flow

### Local fallback flow

1. Leave the page in `Local simulation mode`.
2. Click `Use Normal Comment`.
3. Click `Post Comment`.
4. Click `Use Attack Payload`.
5. Leave protection OFF.
6. Click `Post Comment`.
7. Point to the warning banner and `No gateway block occurred`.
8. Click `Reset Demo`.
9. Turn protection ON.
10. Click `Use Attack Payload`.
11. Click `Post Comment`.
12. Point to `Attack Blocked`.

### Live gateway flow

1. Switch to `Live gateway mode`.
2. Click `Use Expo Service Defaults`.
3. Click `Load Live Wall`.
4. In the platform, leave `XSS Protection` OFF.
5. Click `Use Normal Comment`, then `Post Comment`.
6. Click `Use Attack Payload`, then `Post Comment`.
7. Point to the dangerous comment being accepted and the warning proof.
8. In the platform, turn `XSS Protection` ON.
9. Click `Use Attack Payload` again, then `Post Comment`.
10. Point to `Attack Blocked` and the unchanged wall.
11. If the platform API URL is filled and reachable, point to the live WAF proof card.

## Reset Behavior

In local mode:

- `Reset Demo` fully restores the original local simulation state

In live mode:

- `Reset Demo` tries to call the deployed service reset route through the gateway
- if that fails, the page falls back to a safe local-looking state so the storyteller can keep going

## Important Safety Note

This demo never executes the XSS payload. Even in live mode, the target service only stores the text and returns a `kind` marker so the page can explain what happened safely.
