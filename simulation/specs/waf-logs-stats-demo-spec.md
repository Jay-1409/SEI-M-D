# WAF Logs And Stats Demo Spec

## 1. Purpose

This real-platform demo shows the existing Web Application Firewall monitoring view: toggles, blocked-attack counters, and recent event logs.

This guide is meant to support the SQLi and XSS storytelling, even if those attacks are triggered from Bruno or a browser request rather than from a custom demo UI.

---

## 2. Existing Platform Feature Being Shown

- Global WAF monitoring area on the dashboard
- Per-service `Firewall` tab on the service details page
- Existing toggles for:
  - `SQLi Protection`
  - `XSS Protection`
  - `Header Sanitization`
- Existing metrics cards for:
  - `Total Blocked`
  - `SQLi Blocked`
  - `XSS Blocked`
  - `Headers Sanitized`
- Existing `Recent Blocked Attacks` event list
- Existing `Clear Logs` action

---

## 3. Sample Service Or Setup Needed

### Recommended service

Use a deployed service that has a predictable request path and is safe to target through the gateway.

Best options:

1. `example-api`
2. `secure-payment-service`

### Trigger source

Use the existing Bruno attack requests in the repo to generate live WAF events:

- `bruno/10-Test SQLi Attack.bru`
- `bruno/11-Test XSS Attack GET.bru`

This keeps the platform UI real while avoiding any need to build a new demo interface.

---

## 4. Presenter Goal

In 45 to 60 seconds, show that:

1. protections can be enabled on a service
2. suspicious requests are blocked by the gateway
3. the block is logged with type, path, field, pattern, and payload snippet
4. the counters increase in the UI, giving visible proof

---

## 5. Exact Presenter Steps

### Recommended per-service flow

1. Open the dashboard at `http://localhost:30000`.
2. Find the chosen service in the services table.
3. Click `Manage`.
4. Open the `Firewall` tab.
5. Turn `SQLi Protection` and `XSS Protection` to `ON`.
6. Optionally keep `Header Sanitization` on if you want to mention it, but do not let it distract from the main story.
7. Click `Clear Logs` so the counters and event list start from a clean state.
8. Switch to Bruno and send the SQLi test request.
9. Return to the `Firewall` tab.
10. Point to:
    - `Total Blocked`
    - `SQLi Blocked`
    - the new attack event in `Recent Blocked Attacks`
11. Send the XSS Bruno request.
12. Return to the `Firewall` tab again.
13. Point to:
    - the increased `Total Blocked`
    - `XSS Blocked`
    - the second event card
14. Read out the human-friendly fields in the event log:
    - threat type
    - method and path
    - pattern
    - field
    - payload snippet

### Global dashboard support flow

If you want a wider system-level view:

1. After generating the attacks, return to the main dashboard.
2. Point to the global WAF counters there as the summary screen.

---

## 6. What The Visitor Should See

- firewall toggles switching on
- zeroed counters after `Clear Logs`
- a blocked SQLi event appearing
- a blocked XSS event appearing
- counters increasing in real time
- a log entry that includes readable evidence, not just a red error badge

---

## 7. Message To Explain

Use this layman explanation:

`The gateway is not only forwarding traffic. It is inspecting requests, blocking suspicious ones, and then recording what happened so the operator has proof.`

Shorter version:

`This is the guard desk logbook for attacks stopped at the main gate.`

---

## 8. Proof To Point Out On Screen

Point to these exact proof items:

- the protection toggles set to `ON`
- `Total Blocked`
- `SQLi Blocked`
- `XSS Blocked`
- the `Recent Blocked Attacks` list
- the event details:
  - method
  - path
  - pattern
  - field
  - payload snippet

Best proof sentence:

`The proof is not only that the request failed. The gateway also recorded exactly what kind of attack it was and where it was found.`

---

## 9. Setup Instructions

Before the expo:

1. Make sure at least one demo service is deployed and reachable through the gateway.
2. Open its `Firewall` tab once and confirm the WAF controls load correctly.
3. Open the Bruno collection and verify the SQLi and XSS test requests are ready to send.
4. Confirm those requests target the correct gateway route for the chosen service.
5. Test one SQLi block and one XSS block before visitors arrive.
6. Clear logs after the rehearsal so the first live run starts clean.

---

## 10. Reset Instructions

Between visitors:

1. Click `Clear Logs` on the `Firewall` tab.
2. Confirm all counters go back to zero or the event list clears.
3. Leave `SQLi Protection` and `XSS Protection` enabled for the next run.
4. Keep Bruno open with the two attack requests ready.

---

## 11. Practical Expo Notes

- This demo works best immediately after explaining SQLi or XSS, because it gives visual proof.
- Do not spend time on every field in the log card unless asked.
- The strongest path is:
  - show toggle on
  - trigger attack
  - show counter increase
  - show detailed log entry
