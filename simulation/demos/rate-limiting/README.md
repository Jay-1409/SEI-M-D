# Rate Limiting Demo

This is the built rate limiting simulation for the `simulation` workspace.

## What It Shows

- normal fair-use booking requests
- bot/spam flood behavior
- rate limit OFF behavior
- rate limit ON behavior
- visible proof with allowed vs blocked counts and `429` events

## How To Open

Open [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\rate-limiting\index.html) in any modern browser.

Because the demo is plain HTML, CSS, and JavaScript, no backend or package install is required.

## Recommended Expo Flow

1. Click `Send Normal Booking Request`
2. Switch to `Rate Limit OFF`
3. Click `Start Spam Flood`
4. Click `Reset`
5. Switch to `Rate Limit ON`
6. Click `Start Spam Flood` again
7. Point to the `Spam Blocked` counter and the `Blocked 429` rows in the log

## Notes

- This is a simulation for explanation, not a live connection to the main project
- Everything is self-contained inside `simulation`
