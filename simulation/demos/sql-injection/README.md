# SQL Injection Demo

This folder contains the SQL injection expo demo in two safe modes:

- `Local simulation mode`
- `Live gateway mode`

The polished login UI stays the same, but live mode can now send the request through the real platform gateway and interpret the real result back into the same visitor-friendly proof cards.

## What It Shows

- normal login success
- SQL injection success when protection is OFF
- SQL injection blocked when protection is ON
- visible proof for both the vulnerable and protected outcomes
- optional live WAF proof if the main platform API is reachable

## Files

- `index.html` - main demo page
- `styles.css` - visual styling
- `script.js` - local simulation logic plus live gateway mode
- `live-target-service/` - deployable login-like target service for the real platform flow

## How To Open The Demo

Option 1:
- Open [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\sql-injection\index.html) directly in a browser.

Option 2:
- Open it from the simulation launcher at [simulation/index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\index.html).

## Local Simulation Mode

This is the default fallback mode and does not require the main platform.

Supported manual inputs:

- `admin` / `admin123`
- `admin` / `' OR '1'='1`

Recommended presenter flow:

1. Leave the page in `Local simulation mode`.
2. Click `Fill Normal User`, then `Login`.
3. Click `Fill Attack Input`, then `Login`.
4. Point to `Unauthorized access allowed`.
5. Turn protection ON with the main toggle.
6. Click `Fill Attack Input` again, then `Login`.
7. Point to `Attack blocked`.

## Live Gateway Mode

Live mode uses the real gateway route but keeps the same UI and proof language.

### What live mode sends

It sends:

- `POST {gatewayBaseUrl}{loginRoute}`
- JSON body: `{ "username": "...", "password": "..." }`

Example default target:

- `http://localhost:30080/expo-sqli-demo/login`

### How live outcomes are interpreted

- `200` with `auth_mode: normal` -> normal login success
- `200` with `auth_mode: bypass` -> unauthorized access allowed
- `403` with `attack_type: sqli` -> attack blocked by the real gateway
- `401` or plain denial -> invalid login

If `Platform API URL` is filled, the demo also tries to read:

- `/services/{service}/waf/stats`
- `/services/{service}/waf/events`

That extra proof is optional. If it is missing or unreachable, the demo still works from the gateway response alone.

## How To Deploy The Live SQLi Target

Use the service inside [live-target-service](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\sql-injection\live-target-service).

### Build the tar

PowerShell:

```powershell
cd "C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\sql-injection\live-target-service"
.\build-demo-target.ps1
```

Manual Docker:

```bash
cd simulation/demos/sql-injection/live-target-service
docker build -t expo-sqli-demo:latest .
docker save expo-sqli-demo:latest -o expo-sqli-demo.tar
```

### Deploy through the existing platform

1. Open the main dashboard at `http://localhost:30000`.
2. Upload `expo-sqli-demo.tar`.
3. Use service name `expo-sqli-demo`.
4. Use container port `8000`.
5. Deploy the service.

The expected live login route becomes:

- `http://localhost:30080/expo-sqli-demo/login`

## How To Configure Gateway SQLi Protection

1. In the main platform, open service details for `expo-sqli-demo`.
2. Open the `Firewall` tab.
3. Turn `SQLi Protection` OFF to demonstrate the vulnerable live pass-through case.
4. Turn `SQLi Protection` ON to demonstrate the blocked live case.
5. Optionally click `Clear Logs` before each proof run.

## Exact Live Demo Flow

1. Switch the page to `Live gateway mode`.
2. Click `Use Expo Service Defaults`.
3. Leave the platform `SQLi Protection` OFF.
4. Click `Fill Normal User`, then `Login`.
5. Point out that the real gateway still allows normal traffic.
6. Click `Fill Attack Input`, then `Login`.
7. Point to `Unauthorized access allowed`.
8. In the main platform, turn `SQLi Protection` ON for `expo-sqli-demo`.
9. Click `Fill Attack Input` again, then `Login`.
10. Point to `Attack blocked` and the live gateway proof card.

## Graceful Fallback Rules

- If the gateway URL or route is missing, the demo explains what setup is needed.
- If the live route is unreachable, the demo shows the target URL and the browser error.
- If the optional platform API URL is missing, the demo still works from the gateway response.
- The local simulation mode remains available at all times for offline use.

## Reset Behavior

- `Reset Demo` clears the username, password, and current result.
- It keeps the current mode.
- It keeps live connection fields.
- It keeps `Blocked Attacks`, `Activity Log`, and total request count for the current session.

For a fully clean restart between visitors:

1. Refresh the tab.
2. If needed, click `Use Expo Service Defaults` again in live mode.

## Safety Note

This workspace does not modify the main project.

The live login target is a tiny demo service that lives entirely inside `simulation`. The request still goes through the real gateway, but the target service is intentionally simple and deterministic for expo use.
