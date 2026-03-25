# Trivy Image Scan Demo Spec

## 1. Purpose

This real-platform demo shows that the platform can run a real Trivy container image scan and present the result in the existing UI before or after deployment.

The expo story is simple: not all container images carry the same risk, so the platform helps the operator inspect the image instead of deploying blindly.

---

## 2. Existing Platform Feature Being Shown

- Dashboard upload flow with the built-in Trivy prompt after image upload
- Service details `Security` tab with the `Run Trivy` action
- Existing Trivy result cards showing:
  - `Total Findings`
  - `Critical`
  - `High`
  - the vulnerability list or the clean result state

---

## 3. Sample Service Or Setup Needed

### Recommended pair

Use two prepared images so the presenter can choose the best available comparison on expo day:

1. `example-api.tar`
   - built from `examples/simple-api`
   - use service name `example-api`
   - port `8000`
   - role in demo: the cleaner baseline image

2. `vulnerable-api.tar`
   - built from `examples/vulnerable-api`
   - use service name `vulnerable-api`
   - port `8000`
   - role in demo: the riskier comparison candidate

### Important note

Trivy scans container image packages and dependencies, not the web app logic itself. That means the stronger expo claim is:

- `This image has more package-level findings`

and not:

- `This app is vulnerable because Trivy said so`

If the two prepared images do not produce a clear difference on the expo machine, still run the demo with one image and explain that the platform exposes the scan summary before trusting the image.

---

## 4. Presenter Goal

In 30 to 45 seconds, show that:

1. an uploaded image can be scanned in-platform
2. the scan is real and takes time to run
3. the result is summarized clearly
4. the operator can point to concrete counts instead of guessing image safety

---

## 5. Exact Presenter Steps

### Fastest recommended flow

1. Open the main dashboard at `http://localhost:30000`.
2. In `Deploy New Service`, upload the prepared `.tar` file for the service you want to scan.
3. Fill:
   - `Service Name`: `example-api` or `vulnerable-api`
   - `Container Port`: `8000`
4. After the upload completes, point to the inline prompt that says `Security Scan Recommended`.
5. Click `Run Trivy`.
6. Let the audience watch the scan state briefly so they understand this is not a fake static screenshot.
7. When the result appears, point to `Total Findings`, `Critical`, and `High`.
8. If the service is already deployed instead, open `service-details.html?name=<service>` from the service list.
9. Go to the `Security` tab.
10. Click `Run Trivy`.
11. Point to the same summary and the visible list of findings or the clean result card.

### Comparison version if time allows

1. First run Trivy on `example-api`.
2. Say the baseline result out loud.
3. Then run Trivy on `vulnerable-api`.
4. Compare the summary counts using plain language:
   - `This image has more findings`
   - `This one is cleaner`

---

## 6. What The Visitor Should See

- A real upload or service-management screen from the existing platform
- A visible security action labeled `Run Trivy`
- A progress state while scanning
- A result summary with count-based proof
- Either:
  - a clean state like `Image is Secure`
  - or a vulnerability list with severity badges and package names

---

## 7. Message To Explain

Use this layman explanation:

`Before trusting a container, we inspect what is inside it. Trivy checks the image contents and reports known risky packages and dependencies. So instead of guessing, the operator gets a visible risk summary.`

Shorter version:

`This is like a baggage scan for a container image before we rely on it.`

---

## 8. Proof To Point Out On Screen

Point to these exact proof elements:

- the `Run Trivy` button
- the scan progress state
- `Total Findings`
- `Critical`
- `High`
- the vulnerability list or the clean result card

Preferred proof sentence:

`These counts are the proof that the platform inspected the image and categorized what it found.`

---

## 9. Setup Instructions

Before the expo:

1. Build and save `example-api.tar` from `examples/simple-api`.
2. Build and save `vulnerable-api.tar` from `examples/vulnerable-api`.
3. Make sure the platform and Trivy service are up.
4. Test one scan per image once before visitors arrive because first-run vulnerability DB fetches can be slower.
5. Keep both tar files easy to access from the presentation machine.
6. Prefer whichever image pair gives the clearest count difference on that machine.

---

## 10. Reset Instructions

Between visitors:

1. Stay on the same service if the scan result is already visible and good for explanation.
2. If you want to repeat the live action, rerun `Run Trivy`.
3. If the service list is getting crowded, delete unused demo services before the next round.
4. Keep one fallback service pre-deployed so the presenter can jump straight to the `Security` tab if upload time is not worth spending.

---

## 11. Practical Expo Notes

- Do not promise exact vulnerability counts in the script because Trivy databases change over time.
- Promise the type of output, not a fixed number.
- If the scan comes back clean, the demo still works because the platform clearly proves that the image was checked.

