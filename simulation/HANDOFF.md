# Handoff

## Current Status

The `simulation` workspace is now in an integrated expo-ready documentation state for the four custom demos.

Current reality:

- SQL injection is built, documented, and supports both local fallback and live gateway mode
- XSS feedback wall is built, documented, and supports both local fallback and live gateway mode
- rate limiting is built, documented, and supports both local fallback and live gateway mode
- API key protection is built, documented, and supports both local fallback and live platform mode
- the launcher ties the four demos together from one entry point
- the shared docs now use consistent language for `local mode`, `live mode`, fallback behavior, and platform setup

## What Was Verified In This Pass

By source review inside `simulation`:

- all four demos preserve their existing UI/story structure
- all four expose a clear connection-mode switch without replacing the original local story
- all four keep local mode available even if live mode setup is incomplete
- all four surface setup problems or request failures in-page instead of crashing the presenter flow
- each demo includes cross-demo navigation back to the launcher

Important nuance:

- this pass verified behavior and consistency from the demo HTML, JavaScript, READMEs, and specs
- no browser rehearsal was run in this pass, so final machine rehearsal is still recommended before the expo

## Docs Updated In This Pass

- [README.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\README.md)
- [RUN_DEMOS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\RUN_DEMOS.md)
- [HANDOFF.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\HANDOFF.md)
- [STATUS.md](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\STATUS.md)

Main alignment changes:

- unified explanation of `local mode` versus `live mode`
- one simple recommended expo order across the four demos
- one shared platform setup checklist for live mode
- consistent per-demo guidance on live fallback and resets

## Recommended Demo Order

Use this sequence for the four custom demos:

1. SQL injection
2. XSS feedback wall
3. rate limiting
4. API key protection

## Platform Setup Still Required For Live Mode

The expo can still run fully in local mode without these items.

If live mode is desired, prepare:

- dashboard at `http://localhost:30000`
- gateway at `http://localhost:30080`
- deployed simulation-owned target services:
  - `expo-sqli-demo`
  - `expo-xss-demo`
  - `expo-rate-limit-demo`
  - `expo-api-demo`
- per-demo protection setup:
  - SQLi protection toggle for SQL injection
  - XSS protection toggle for XSS
  - visible rate-limit threshold for rate limiting
  - generated real API key for API key protection

## Recommended Next Safe Actions

1. Rehearse the exact launcher-driven route on the actual expo laptop.
2. Open each demo once in a real browser and confirm the first screen state matches `RUN_DEMOS.md`.
3. If live mode will be used, verify all four gateway routes before visitors arrive.
4. If any live setup is unstable, default the presentation to local mode and use live mode only as an optional bonus proof step.

## Rules To Preserve

- Do not change anything outside `simulation`
- Do not redesign stable demos just for cosmetic consistency
- Keep language understandable for layman expo visitors
- Preserve local fallback even when live mode support expands
