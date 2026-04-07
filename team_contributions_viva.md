# Team Contributions (Detailed Viva Version)

Use this as a viva-ready, first-person explanation for each member. It is written in simple language while keeping full technical meaning.

## 1. Jay Shah (You) - Platform Backend + Kubernetes

- **What I did:** I built the core FastAPI deployer backend that handles image upload proxying, service deployment/deletion, service lifecycle actions (`start/stop/redeploy/rename`), and backend-Kubernetes integration. I also handled startup sync/recovery, API contract alignment, and platform stabilization work.
- **What it is:** This is the central control layer of the project. The frontend and other modules call this backend, and it performs real deployment actions in Kubernetes.
- **How I did it:** I created backend APIs that receive requests from UI/gateway, then trigger Kubernetes operations to create/delete `Deployment` and `Service` objects in `user-services` namespace. I added namespace/RBAC-aware behavior so backend actions stay inside allowed permissions. I also implemented startup route-sync logic so after restart, deployed services are restored and routes are re-registered.
- **Why it matters:** Without this module, the system cannot reliably deploy, manage, or recover microservices. It is the orchestration backbone.
- **Challenges I solved:** API contract drift between frontend and backend (`/api/scan-image`, `/api/graceful-stop` references), and restart consistency issues where routes/services needed reliable re-sync.
- **Testing/validation I handled:** Integration testing for deploy and rate-limit related flows, bug-fix stabilization from test findings, and operational troubleshooting support.

### Important questions (Jay)

- **Q: Why did you use FastAPI for deployer backend?**  
  **A:** FastAPI is fast for API development, async-friendly, and easy to structure for orchestration workflows.
- **Q: How does one deploy request become a running service?**  
  **A:** UI calls backend API -> backend validates input -> backend creates Kubernetes Deployment/Service in `user-services` namespace -> gateway route is registered.
- **Q: How did you keep deployments secure at platform level?**  
  **A:** By RBAC-aware backend behavior, namespace isolation, and limiting exposed components to gateway/frontend only.
- **Q: What is startup sync logic?**  
  **A:** On backend restart, it restores deployed service metadata and re-registers gateway routes so running services do not become unreachable.
- **Q: What was your biggest implementation issue?**  
  **A:** Keeping frontend API calls and backend route support perfectly aligned during parallel development.

## 2. Akshat Patel - API Gateway + Security Controls

- **What I did:** I built gateway route registration/deregistration and reverse proxy flow, WAF middleware (SQLi/XSS checks), header sanitization/content-type enforcement, Redis-based rate limiting, WAF events/stats endpoints, and API-key runtime enforcement.
- **What it is:** This is the security and traffic control layer between users and internal microservices.
- **How I did it:** I implemented dynamic gateway routing so when a service is deployed, route config is added automatically, and removed on deletion. I added middleware-based request inspection for SQL injection/XSS patterns, blocked malformed headers/content types, enforced API-key rules per route, and applied Redis counters/TTL for per-route/per-service rate limits.
- **Why it matters:** The gateway ensures internal services are not directly exposed and that every request is filtered and controlled before reaching services.
- **Challenges I solved:** Balancing strict security controls with proxy compatibility, and reducing false positives from WAF checks.
- **Testing/validation I handled:** WAF + API-key + rate-limit combined flow validation, hardening from test feedback, and security documentation refresh.

### Important questions (Akshat)

- **Q: What is dynamic route registration?**  
  **A:** Gateway routes are added/removed automatically as services are deployed/deleted, so manual route editing is not needed.
- **Q: What attacks does your WAF block?**  
  **A:** Primarily SQL injection and XSS-style malicious payload patterns, with header/content-type hygiene checks.
- **Q: Why Redis for rate limiting?**  
  **A:** Redis supports fast atomic counters with expiry, which is reliable for real-time limit enforcement.
- **Q: How is API-key enforced?**  
  **A:** Gateway checks configured keys at request time before proxying to backend services.
- **Q: How do you know security layers work together?**  
  **A:** We validated combined flows (WAF + API-key + rate-limit) with integration tests and false-positive review.

## 3. Arth Patel - Scanning Services + Vulnerability Workflow (+ Demo & Simulation)

- **What I did:** I built Nikto and Trivy scanning workflows, including scan trigger/retrieval APIs, Redis result persistence, OpenAPI discovery probing, Trivy integration, and concurrency-lock fixes for scan stability. I also handled scan reliability improvements and added demo/simulation creation.
- **What it is:** This is the vulnerability assessment layer. Nikto scans running web service surfaces; Trivy scans container image vulnerabilities.
- **How I did it:** I implemented async scanning endpoints so scan jobs can run in background and be polled. I stored scan status/results in Redis for quick retrieval. I integrated Trivy with controlled execution and added locking to prevent concurrency contention. I also connected end-to-end UI/backend/scanner wiring and improved error handling for failed scans.
- **Why it matters:** It gives security visibility before and after deployment and helps detect vulnerable images/services early.
- **Challenges I solved:** Trivy concurrency/cache contention and reliability issues in scan execution/report retrieval.
- **Testing/validation I handled:** Integration tests for scan paths, scanner reliability checks, and operational notes for scanning runbook.
- **Demo and simulation creation (added):** I prepared reproducible demo/simulation flows showing successful scan, vulnerable-case scan output, and failure-handling behavior (timeouts/errors), so evaluators can clearly see scanner behavior in realistic scenarios.

### Important questions (Arth)

- **Q: Why both Nikto and Trivy?**  
  **A:** They cover different layers: Trivy for image/package CVEs, Nikto for runtime web-surface security issues.
- **Q: Why async scan architecture?**  
  **A:** Scans are long-running, so async jobs + polling avoid blocking UI/API requests.
- **Q: Why store scan results in Redis?**  
  **A:** Fast access for status/result polling and lightweight persistence for scan workflows.
- **Q: What was the Trivy lock fix?**  
  **A:** Added concurrency control to prevent overlapping scans from causing instability/contention.
- **Q: What did you include in demo/simulation?**  
  **A:** Repeatable scenarios for normal scan, vulnerable output case, and failure/error handling to show practical reliability.

## 4. Jainik Patel - Frontend, UX + Integration

- **What I did:** I built dashboard and service-details UI, integrated frontend with backend via Nginx `/api` proxy, added security/workflow visualizations, resolved frontend API mismatches, and improved error-state UX/messages for deploy/scan flows.
- **What it is:** This is the user interaction layer where deployment, security control, and scan workflows are operated visually.
- **How I did it:** I developed UI flows for image upload, deploy/list/manage, scan actions/results, WAF settings/events, API-key/rate-limit controls, and service lifecycle actions. I connected frontend API calls through Nginx proxy path for consistent backend access and cleaner environment behavior.
- **Why it matters:** Without this layer, system capabilities remain backend-only and hard to use; frontend makes all core functions operable and demonstrable.
- **Challenges I solved:** Endpoint mismatch issues (`scan-image`, `graceful-stop`) and clear failure messaging for real-world usability.
- **Testing/validation I handled:** UI journey integration checks, UX refinements, and final demo-ready baseline support.

### Important questions (Jainik)

- **Q: Why Nginx `/api` proxy integration?**  
  **A:** It standardizes frontend-backend communication and helps avoid direct cross-origin complexity.
- **Q: What major UI modules did you build?**  
  **A:** Dashboard (upload/deploy/list) and service-details panel (scan/WAF/API-key/rate-limit/lifecycle).
- **Q: How did you handle backend mismatches in UI?**  
  **A:** By updating frontend calls to active API contracts and improving fallback/error states.
- **Q: What UX improvements were most important?**  
  **A:** Better user-facing messages for failed deploy/scan actions and clearer workflow visuals.
- **Q: How did frontend work support final evaluation?**  
  **A:** It enabled complete end-to-end demos and reproducible user journeys.
