# Nikto Live Scan Demo Spec

## 1. Purpose

This real-platform demo shows that the platform can run a real Nikto scan against a deployed service and display web vulnerability findings in the existing service-management UI.

The expo story is simple: after deployment, the operator can inspect the running web service for risky exposure instead of assuming it is safe.

---

## 2. Existing Platform Feature Being Shown

- Service details `Security` tab
- The `Web Vulnerability Scanner` panel
- The `Run Scan` action
- Live Nikto progress
- Result summary and vulnerability list for the running service

---

## 3. Sample Service Or Setup Needed

### Recommended service

Use `vulnerable-api.tar` from `examples/vulnerable-api`.

### Deployment values

- `Service Name`: `vulnerable-api`
- `Container Port`: `8000`

### Why this service is best

- it is intentionally built for Nikto testing
- its README already expects visible findings
- it creates a much better expo scan story than a clean service with no findings

---

## 4. Presenter Goal

In 45 to 75 seconds, show that:

1. the service is already deployed through the platform
2. the platform can trigger a live web scan
3. the scan returns concrete findings for the running service
4. the findings are readable enough to discuss with visitors

---

## 5. Exact Presenter Steps

1. Make sure `vulnerable-api` is already deployed.
2. Open the dashboard at `http://localhost:30000`.
3. In the service list, find `vulnerable-api`.
4. Click `Manage`.
5. Open the `Security` tab.
6. In the `Web Vulnerability Scanner` panel, point to the text `Nikto-powered security analysis of your running service`.
7. Click `Run Scan`.
8. Pause briefly so visitors can see the scan is running.
9. When results load, point to:
   - the total findings summary
   - the list of issues
   - any obviously understandable paths such as admin, backup, debug, headers, or exposed files
10. Explain that this scan is targeting the live web service, not just the image file.

### Fallback quick version

If a finished result is already on screen when visitors arrive:

1. Start from the `Security` tab.
2. Point to the scan result first.
3. Then rerun `Run Scan` only if there is enough time.

---

## 6. What The Visitor Should See

- a service named `vulnerable-api`
- a button labeled `Run Scan`
- a progress state
- a visible list of findings after completion
- a scan summary proving that the platform checked the running service

If the scan returns clean on a different fallback service, the demo still works, but `vulnerable-api` is the preferred expo choice because the findings are easier to discuss.

---

## 7. Message To Explain

Use this layman explanation:

`Trivy checks what is inside the container image. Nikto checks the running website behavior and what it exposes over HTTP. So this is the live service inspection step.`

Shorter version:

`This is a health inspection for the running web service, not just the package box it came in.`

---

## 8. Proof To Point Out On Screen

Point to these proof items:

- the `Run Scan` button
- the live scan state
- the final finding count
- the visible vulnerability list
- the path or endpoint names attached to findings

Best proof sentence:

`The proof is that the scanner names real exposed paths and issues on the running service, so this is not a generic warning banner.`

---

## 9. Setup Instructions

Before the expo:

1. Build and save `vulnerable-api.tar`.
2. Deploy it through the platform as `vulnerable-api`.
3. Open `http://localhost:30080/vulnerable-api` once and verify it is reachable through the gateway.
4. Test one Nikto scan before visitors arrive.
5. Leave the service deployed so the presenter can jump straight into `Manage` and `Security`.

---

## 10. Reset Instructions

Between visitors:

1. Reuse the same deployed `vulnerable-api` service.
2. Stay on the `Security` tab if scan results are already useful and time is short.
3. Rerun `Run Scan` when you want to show a fresh live action.
4. If the UI looks busy, reload the service page before the next presentation round.

---

## 11. Practical Expo Notes

- Frame this as a controlled educational service, not a production recommendation.
- Avoid deep vulnerability taxonomy unless faculty ask for it.
- Focus on the clear distinction between:
  - image scanning with Trivy
  - live service scanning with Nikto

