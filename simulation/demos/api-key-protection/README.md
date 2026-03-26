# API Key Protection Demo

This demo now supports two modes:

- `Local simulation`
- `Live platform mode`

The local mode keeps the original self-contained expo story intact.

The live mode sends real traffic through the main platform gateway so you can prove:

1. a public route works with no key
2. a protected route fails with no key
3. a protected route fails with an invalid key
4. a protected route works with a valid key

## Files

- `index.html` - the demo page
- `styles.css` - the visual design
- `script.js` - local plus live request logic
- `live-target-service/` - optional demo service to deploy behind the real gateway

## Open The Demo

### Simplest option

Open [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\api-key-protection\index.html) in a browser.

### Helper

Run [open-api-key-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-api-key-demo.ps1).

## Local Simulation Flow

1. Leave mode on `Local simulation`
2. Start with `GET /public/help-hours`
3. Click `Use No Key`
4. Click `Send Request`
5. Switch to `POST /staff/open-maintenance-panel`
6. Click `Use No Key`
7. Click `Send Request`
8. Click `Use Wrong Key`
9. Click `Send Request`
10. Click `Use Valid Staff Key`
11. Click `Send Request`

Demo-only keys:

- Valid: `STAFF-ACCESS-DEMO-2026`
- Wrong: `STAFF-KEY-DEMO-WRONG`

## Live Platform Flow

### Recommended target

Use the simulation-owned service at [live-target-service](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\api-key-protection\live-target-service\README.md).

Fastest packaging option:

- run [build-demo-target.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\api-key-protection\live-target-service\build-demo-target.ps1)

Suggested deployment values:

- `Service Name`: `expo-api-demo`
- `Container Port`: `8000`

Suggested live fields in the demo:

- `Gateway Base URL`: `http://localhost:30080`
- `Public Route`: `/expo-api-demo/public/help-hours`
- `Protected Route`: `/expo-api-demo/staff/open-maintenance-panel`

### Platform setup

1. Build `expo-api-key-demo.tar` from the live target service folder
2. Upload it in the main dashboard
3. Deploy it as `expo-api-demo`
4. Open the service details page
5. Go to `API Key Authentication`
6. Enable API key auth
7. Generate one key
8. Protect only `POST /staff/open-maintenance-panel`
9. Save the auth config
10. Copy the generated key for use in the demo

### Live proof flow

1. Switch the demo to `Live platform mode`
2. Click `Use Expo Service Defaults`
3. Select the public route
4. Click `Use No Key`
5. Click `Send Request`
6. Select the protected route
7. Click `Use No Key`
8. Click `Send Request`
9. Click `Use Wrong Key`
10. Click `Send Request`
11. Paste the real generated key into `Access Key`
12. Click `Send Request`

## What The Demo Does If Live Setup Is Wrong

The page does not replace the local demo.

If the live route is missing, unavailable, or not protected the way the expo story expects, the proof panel shows a clear `Check Setup` state and explains what to fix.

You can then switch back to local simulation immediately.
