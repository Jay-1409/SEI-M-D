# Rate Limiting Demo

This folder now supports the rate limiting expo story in two safe modes:

- `Local simulation mode`
- `Live gateway mode`

The original queue-and-fairness UI remains the main experience. Live mode only adds a small connection setup area so the same counters, pressure meter, and log can reflect real gateway responses.

## What It Shows

- normal fair-use booking requests
- bot/spam flood behavior
- rate limit OFF behavior in local mode
- rate limit ON behavior in local mode
- real gateway success and real `429 Too Many Requests` behavior in live mode
- visible proof with allowed vs blocked counts and a live event log

## Files

- `index.html` - main demo page
- `styles.css` - visual styling
- `script.js` - local simulation plus live gateway mode
- `live-target-service/` - deployable stable target service for the live rate limiting flow

## How To Open

Option 1:
- Open [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\rate-limiting\index.html) in any modern browser.

Option 2:
- Open it from the simulation launcher at [simulation/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html).

Option 3:
- Use the helper script [simulation/scripts/open-rate-limiting-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-rate-limiting-demo.ps1).

Because the demo is plain HTML, CSS, and JavaScript, no frontend install is required.

## Local Simulation Mode

This is the default fallback mode and does not require the main platform.

Recommended presenter flow:

1. Leave the page in `Local simulation mode`.
2. With `Rate Limit ON`, click `Send Normal Booking Request`.
3. Switch to `Rate Limit OFF`.
4. Click `Start Spam Flood`.
5. Point to high pressure and zero blocked spam.
6. Click `Reset`.
7. Switch back to `Rate Limit ON`.
8. Click `Start Spam Flood` again.
9. Point to `Spam Blocked`, the `Blocked 429` log rows, and the summary card.

The built-in `Replay Guided Demo` button still runs the original offline comparison flow automatically.

## Live Gateway Mode

Live mode sends real traffic through the main platform gateway and reflects the real results back into the same UI.

### What live mode sends

Normal action:

- sends a few safe `GET` requests to the configured route

Flood action:

- sends a burst of repeated `GET` requests to the same route at the chosen speed

Default expo target:

- gateway base URL: `http://localhost:30080`
- route: `/expo-rate-limit-demo/tickets`
- platform API URL: `http://localhost:30000/api`

Full target URL:

- `http://localhost:30080/expo-rate-limit-demo/tickets`

### How live outcomes are interpreted

- `2xx` -> allowed
- `429` -> blocked by the real platform rate limiter
- other statuses -> shown as an unexpected live result
- network failure / unreachable target -> shown as a graceful setup error

If `Platform API URL` is filled, the demo also tries to read:

- `/services/{service}/ratelimit`

That extra proof is optional. If it is missing or unreachable, the demo still works from gateway responses alone.

## How To Deploy The Live Rate Limit Target

Use the service inside [live-target-service](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\rate-limiting\live-target-service).

If you already have a safe deployed route behind the gateway, you can skip this target service and point live mode at that existing route instead. The simulation-owned target is only the deterministic fallback.

### Build the tar

PowerShell:

```powershell
cd "C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\rate-limiting\live-target-service"
.\build-demo-target.ps1
```

Manual Docker:

```bash
cd simulation/demos/rate-limiting/live-target-service
docker build -t expo-rate-limit-demo:latest .
docker save expo-rate-limit-demo:latest -o expo-rate-limit-demo.tar
```

### Deploy through the existing platform

1. Open the main dashboard at `http://localhost:30000`.
2. Upload `expo-rate-limit-demo.tar`.
3. Use service name `expo-rate-limit-demo`.
4. Use container port `8000`.
5. Deploy the service.

The expected live gateway route becomes:

- `http://localhost:30080/expo-rate-limit-demo/tickets`

## How To Configure Platform Rate Limiting

1. In the main platform, open service details for `expo-rate-limit-demo`.
2. Open `Firewall`.
3. Open the `Rate Limiting` subtab.
4. Keep rate limiting enabled.
5. Set a low obvious limit like `5` requests per `10` seconds.
6. Save the config.

You can use:

- the global limit only, or
- a route override for `GET /tickets`

For expo use, the route override is often the clearest because it proves exactly which endpoint is being protected.

## Exact Live Demo Flow

1. Switch the page to `Live gateway mode`.
2. Click `Use Expo Service Defaults`.
3. Confirm the `Live gateway proof` card shows the target route.
4. Click `Send Normal Booking Request`.
5. Point out that a few real requests succeeded through the gateway.
6. Click `Start Spam Flood`.
7. Point to the real `429` rows in the log and the rising `Spam Blocked` counter.
8. End on the summary card that says the real gateway started blocking the flood.

If you do not see `429`:

1. Lower the configured rate limit in the platform.
2. Increase burst size to `25` or `50`.
3. Use `Fast` speed.
4. Reset and rerun the flood.

## Graceful Fallback Rules

- If the gateway URL or route is missing, the page explains what setup is needed.
- If the live route is unreachable, the page shows the browser error in the status area.
- If the platform API URL is missing, the demo still works from gateway responses.
- The local simulation mode remains available at all times for offline use.

## Reset Behavior

- `Reset` clears counters, log, pressure, summary, and in-flight animations.
- It keeps the current local/live mode.
- It keeps the live connection fields.
- It keeps the current speed and burst selections.

For a fully clean restart between visitors:

1. Click `Reset`.
2. If needed, click `Use Expo Service Defaults` again in live mode.
3. Refresh the tab only if you want an absolute fresh page state.

## Safety Note

This workspace does not modify the main project.

The live rate limit target is a tiny service that lives entirely inside `simulation`. Real requests still go through the main platform gateway, but the target service remains simple, deterministic, and expo-safe.
