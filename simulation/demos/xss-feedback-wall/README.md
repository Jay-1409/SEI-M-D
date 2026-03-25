# XSS Feedback Wall Demo

This folder contains the built XSS simulation described in the approved spec.

## What It Shows

- normal public comment posting
- a dangerous script-style comment in `Protection OFF` mode
- the same dangerous payload being blocked in `Protection ON` mode
- visible proof through status badges, a block counter, event details, and a recent timeline

## How To Open It

Option 1:
- Open [index.html](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\index.html) directly in a browser.

Option 2:
- Run the helper script [open-xss-demo.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\scripts\open-xss-demo.ps1) from PowerShell.

## Recommended Live Demo Flow

1. Click `Use Normal Comment`.
2. Click `Post Comment` and show that the wall accepts normal feedback.
3. Click `Use Attack Payload`.
4. Leave protection OFF and click `Post Comment`.
5. Point to the warning banner and security panel.
6. Click `Reset Demo`.
7. Turn protection ON.
8. Click `Use Attack Payload` again.
9. Click `Post Comment`.
10. Point out that the wall stayed normal and the attack was blocked.

## Important Safety Note

This is a self-contained simulation. It does not execute a real XSS payload against the main project or any real platform screen.
