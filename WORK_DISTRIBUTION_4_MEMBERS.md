# Work Distribution Across 4 Team Members

## Team Allocation

- **Member 1:** Platform Backend & Kubernetes Orchestration
- **Member 2:** API Gateway & Security Controls
- **Member 3:** Scanning Services & Vulnerability Workflow
- **Member 4:** Frontend, UX, and Integration Validation

> Replace `Member 1..4` with actual names before final submission.

## 1. Work Done So Far (Distributed)

### Member 1: Platform Backend & Kubernetes Orchestration

- Implemented core deployer backend APIs for:
  - image upload proxying
  - service deployment and deletion
  - service lifecycle controls (start/stop/redeploy/rename)
- Implemented Kubernetes integration logic for creating/deleting Deployments and Services in `user-services` namespace.
- Set up namespace and RBAC-aware backend behavior.
- Contributed to startup sync logic (restore deployed services and re-register routes).

### Member 2: API Gateway & Security Controls

- Implemented dynamic route registration/deregistration and reverse proxy flow.
- Built WAF middleware with SQL Injection and XSS detection.
- Added header sanitization and content-type enforcement checks.
- Implemented per-service/per-route rate limiting via Redis.
- Added API key authentication config + runtime enforcement at gateway layer.
- Implemented WAF events/stats endpoints.

### Member 3: Scanning Services & Vulnerability Workflow

- Implemented Nikto scanning service:
  - scan trigger endpoints
  - result persistence in Redis
  - scan retrieval APIs
- Implemented OpenAPI discovery probing support in scanner service.
- Implemented Trivy image scanner service integration.
- Stabilized Trivy scanning flow with lock/concurrency control fix.

### Member 4: Frontend, UX, and Integration Validation

- Built dashboard UI for:
  - image upload
  - service deployment
  - live service listing
- Built service details UI for:
  - scan actions/results
  - WAF settings/events
  - API-key and rate limit settings
  - service start/stop/redeploy/rename/delete
- Integrated frontend with backend API surface through Nginx `/api` proxy path.
- Added visual workflows for security monitoring and service management.

## 2. Milestone Ownership (with Dates)

- **2026-02-14 (WAF SQLi/XSS):** Member 2
- **2026-02-17 (Nikto fixes + scan UI improvements):** Members 3 & 4
- **2026-02-20 (API-key feature):** Member 2 (backend), Member 4 (UI integration)
- **2026-03-01 (`run.sh` one-command launch):** Member 1
- **2026-03-10 (Trivy stable integration):** Member 3
- **2026-03-16 (Trivy lock issue fix):** Member 3

## 3. Current Work in Progress (Distributed)

### Member 1
- Align backend API contract with active frontend calls.
- Improve recovery/restart route-sync consistency.

### Member 2
- Harden gateway behavior and validate combined WAF + API-key + rate-limit flows.
- Review security middleware for false positives and compatibility.

### Member 3
- Finalize Trivy end-to-end wiring from UI/backend to scanner.
- Improve scanner error handling and result reliability.

### Member 4
- Resolve frontend API mismatches (`scan-image`, graceful-stop flow).
- Polish UX/error states for deploy and scan failure cases.

## 4. Next Two Weeks Plan (Owner-wise)

### Week 1 (2026-03-23 to 2026-03-29)

- **Member 1:** Backend endpoint alignment and deployment flow validation.
- **Member 2:** Security path testing (WAF/API-key/rate-limit) and bug fixes.
- **Member 3:** Complete Trivy integration verification and scan regression checks.
- **Member 4:** Frontend API contract cleanup and integration test pass on UI journeys.

### Week 2 (2026-03-30 to 2026-04-05)

- **Member 1:** Stabilization of orchestration and startup synchronization.
- **Member 2:** Security hardening + documentation for gateway controls.
- **Member 3:** Scanner reliability improvements and operational runbook notes.
- **Member 4:** UI refinement, demo preparation, and final report support.

## 5. Risks / Coordination Notes

- API contract drift between frontend and backend should be addressed via weekly interface freeze.
- Security and proxy features should be merged only with integration test sign-off.
- Scanner changes should include concurrency/regression checks before release.

---

**Prepared On:** 2026-03-23
