# API Key Protection Demo

This is a self-contained expo demo for explaining the difference between:

- a public route that anyone can access
- a protected route that needs a valid API key

The story uses a simple campus service desk mental model:

- public route = lobby notice board
- protected route = staff-only room
- API key = digital access card

## Files

- `index.html` - the demo page
- `styles.css` - the visual design
- `script.js` - the simulated request logic

## How To Open

### Simplest option

Open [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\api-key-protection\index.html) in a browser.

### Demo flow

1. Start with `GET /public/help-hours`
2. Click `Use No Key`
3. Click `Send Request`
4. Switch to `POST /staff/open-maintenance-panel`
5. Click `Use No Key`
6. Click `Send Request`
7. Click `Use Wrong Key`
8. Click `Send Request`
9. Click `Use Valid Staff Key`
10. Click `Send Request`

## What The Demo Shows

- public information works without any key
- protected action is denied without a key
- protected action is denied with an invalid key
- protected action is allowed with the valid demo key
- the proof panel shows why the request was allowed or denied

## Safety Note

This demo is fully simulated.

It does not call the main project, use a real gateway, or expose any real secret.
