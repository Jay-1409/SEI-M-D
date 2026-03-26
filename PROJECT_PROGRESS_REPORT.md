# Project Progress Report

## 1. Project Overview

- **Project Title:** Secure Microservice Deployer
- **Team Members:**
  - Jay (from repository ownership/commit history)
  - _Add remaining team member names here_
- **Objectives:**
  - Provide a secure platform to upload Docker images and deploy them as internal Kubernetes microservices.
  - Expose user services only through a centralized API Gateway.
  - Enforce security controls including WAF (SQLi/XSS/Header checks), API-key protection, and per-route rate limiting.
  - Support vulnerability scanning workflows (Nikto for runtime web scanning, Trivy for image scanning).
- **Current SDLC Phase:**
  - **Implementation + Integration + Stabilization** (core platform is implemented and integrated; active focus is feature hardening and operational stability).

## 2. Work Completed So Far

### 2.1 Modules Completed

- **Core orchestration backend (FastAPI):**
  - Image upload proxying
  - Service deployment/deletion
  - Service lifecycle controls (start/stop/redeploy/rename)
  - WAF/rate-limit/API-key config proxy endpoints
- **API Gateway module:**
  - Dynamic route registration/deregistration
  - Reverse proxy to internal services
  - WAF middleware (SQL Injection, XSS, Header sanitization)
  - API-key auth checks per route
  - Rate limiting (global + route-level)
- **Image Service module:**
  - Upload/load Docker image tar archives
  - Image metadata + exposed port detection
- **Nikto Scanner module:**
  - Async scan trigger and polling
  - Redis-backed result persistence
  - API discovery probing support
- **Trivy Scanner module:**
  - Async image vulnerability scanning
  - Redis-backed result persistence
  - Concurrency lock added for scan stability
- **Frontend module:**
  - Dashboard for upload/deploy/list/manage
  - Service details UI for scan, WAF, API-key, rate limit, lifecycle actions
- **Kubernetes & DevOps module:**
  - Namespace segregation (`deployer-system`, `user-services`)
  - RBAC for backend deployer
  - NodePort exposure for frontend and gateway only
  - Deployment scripts: build/deploy/start/stop/teardown/redeploy and one-command launcher (`run.sh`)

### 2.2 Milestones Reached (with dates)

- **2026-02-14:** WAF SQLi/XSS detection introduced (`feat: WAF - SQL Injection & XSS detection with per-service toggles`).
- **2026-02-17:** Nikto service fixes and scan UI improvements.
- **2026-02-20:** API-key protection feature added for individual services.
- **2026-03-01:** One-command run flow (`run.sh`) and architecture documentation updates.
- **2026-03-10:** Trivy scanning integration marked stable.
- **2026-03-16:** Trivy lock/concurrency issue fix.

### 2.3 Deviations from Initial Plan

- Security surface expanded beyond basic deployment to include:
  - WAF events/stats dashboards
  - Route-level API-key controls
  - Route-level rate limits
- Trivy integration required additional stabilization work (lock/contention fixes), extending hardening effort.
- Some UI-driven API calls are ahead of backend route support (functional gap to close):
  - `/api/scan-image` endpoints referenced in frontend but not implemented in deployer backend.
  - `/api/gracefull-stop` referenced in frontend but not implemented in deployer backend.

## 3. Work in Progress

### 3.1 Current Tasks

- Align frontend API calls with backend endpoint availability.
- Complete/validate Trivy flow wiring from frontend through backend to scanner service.
- Improve end-to-end integration testing for deploy -> secure -> scan -> manage lifecycle flow.
- Review and refine startup/recovery behavior and route persistence after restarts.

### 3.2 Expected Completion Timeline for Pending Modules

- **Frontend-backend API alignment:** by **2026-03-27**.
- **Trivy flow completion + validation:** by **2026-03-29**.
- **Integration/regression test pass for main workflows:** by **2026-04-02**.

## 4. Future Plan (Next Two Weeks)

### Week 1 (2026-03-23 to 2026-03-29)

- Close API contract gaps (`scan-image`, graceful-stop behavior/API).
- Add/execute integration tests for deploy, scan, WAF, API-key, and rate limiting paths.
- Improve error handling and user-facing messages for failed scan/deploy scenarios.

### Week 2 (2026-03-30 to 2026-04-05)

- Stabilization and bug-fix sprint from test findings.
- Documentation refresh (API contract, operational runbook, troubleshooting).
- Prepare demo-ready baseline with verified reproducible setup and cleanup flows.

## 5. Challenges and Issues Faced

### 5.1 Technical Difficulties

- Concurrency/cache contention in Trivy scanning flow (mitigated with lock-based scan control).
- Complexity of maintaining gateway security layers (WAF + API-key + rate limiting) without breaking proxy compatibility.
- Contract drift between frontend calls and backend endpoints during parallel feature development.

### 5.2 Team Coordination / Process Issues

- Parallel feature work created temporary mismatches between UI expectations and backend readiness.
- Need stricter API contract/versioning checkpoints before frontend integration.

### 5.3 Mitigation Steps

- Introduce a single source-of-truth API checklist before merging UI/backend changes.
- Add a lightweight pre-release integration checklist for critical user journeys.
- Maintain milestone tags tied to tested workflows, not only code merges.

---

**Report Date:** 2026-03-23
