# SQL Injection Demo

This folder contains a self-contained SQL injection simulation for expo visitors.

## What It Shows

- normal login success
- SQL injection success when protection is OFF
- SQL injection blocked when protection is ON
- visible proof for both the vulnerable and protected outcomes

## Files

- `index.html` - main demo page
- `styles.css` - visual styling
- `script.js` - local simulation logic

## How To Open

Option 1:
- Open `simulation/demos/sql-injection/index.html` directly in a browser.

Option 2:
- Serve the folder with any simple static server if you prefer a local URL.

## Recommended Demo Steps

1. Click `Fill Normal User`, then `Login`.
2. Click `Reset Demo`.
3. Keep protection OFF, click `Fill Attack Input`, then `Login`.
4. Point to the unauthorized access proof.
5. Turn protection ON.
6. Click `Reset Demo`.
7. Click `Fill Attack Input`, then `Login`.
8. Point to the blocked event proof.

## Supported Manual Inputs

- `admin` / `admin123`
- `admin` / `' OR '1'='1`

All other inputs intentionally fall back to an invalid-login result so the demo stays reliable and easy to present.

## Safety Note

This is a fake, local simulation only.
It does not connect to the real project login, backend, database, or deployment environment.
