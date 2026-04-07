# Slide Deck Script (Professor Version)

## Slide 1 - Title and Objective

### Slide content
- Secure Microservice Deployer
- Deploy, Protect, Verify
- Kubernetes + Gateway + Security Controls

### What to say
`Good morning, Professor. This project is Secure Microservice Deployer. The objective is simple: deploy microservices quickly, but with security controls enforced by default, not added later.`

---

## Slide 2 - Problem Statement and Threat Model

### Slide content
- Problem: direct exposure of microservices
- Risks: SQL injection, XSS, abuse traffic, weak route access
- Need: centralized, enforceable controls

### What to say
`In many small deployments, each service gets exposed directly, and security depends on each team doing everything perfectly. That creates inconsistent controls. My threat model focuses on common web attacks and abusive traffic: SQL injection, XSS, request flooding, and unauthorized access to sensitive endpoints.`

---

## Slide 3 - Architecture Overview

### Slide content
- Frontend (NodePort 30000)
- Deployer backend (ClusterIP)
- User services (ClusterIP only)
- Gateway (NodePort 30080)
- Redis for config and logs

### What to say
`The key design decision is this: user services stay internal as ClusterIP. Only the gateway is public. The deployer backend creates Kubernetes deployment and service objects, registers routes in the gateway, and Redis stores route state, policy configs, and security events.`

---

## Slide 4 - Deployment Workflow

### Slide content
1. Upload image tar
2. Detect image metadata
3. Deploy service in user namespace
4. Register gateway route
5. Access service via gateway path

### What to say
`Operationally, a user uploads a Docker image, deploys it as a service, and receives a gateway URL. This gives one secure ingress path while preserving internal service isolation.`

---

## Slide 5 - Security Controls

### Slide content
- WAF: SQLi/XSS and header checks
- Rate limiting (global and route-level)
- API key auth (route-level)
- Per-service policy configuration

### What to say
`At the gateway layer, I enforce policy checks on inbound traffic. WAF blocks suspicious SQLi and XSS patterns. Header sanitization removes risky headers. Rate limiting prevents abuse. API-key rules protect selected sensitive routes without locking all public endpoints.`

---

## Slide 6 - Scanning Pipeline

### Slide content
- Trivy for image scan (dependency/package risk)
- Nikto for running service scan (runtime web exposure)
- Findings and status tracked in Redis-backed flow

### What to say
`I use two scanners because they answer different questions. Trivy checks what is inside the image before trust. Nikto checks what is exposed when the app is running. Together they provide stronger evidence than either alone.`

---

## Slide 7 - Demo Proof

### Slide content
- SQLi/XSS payload -> blocked (403)
- Flood requests -> throttled (429)
- Protected route without key -> unauthorized (401)
- WAF events/stats -> visible evidence

### What to say
`In the demo, I show the same malicious behavior and then the blocked outcomes. The important point is measurable proof: status codes and event logs show enforcement happened, not just configuration screens.`

---

## Slide 8 - Limitations and Future Work

### Slide content
- Regex-based WAF limitations
- Single Redis dependency
- Future: signed image policy, OPA/Kyverno, mTLS, SIEM integration

### What to say
`Current limitations include possible false positives in regex-based detection and operational dependency on Redis. Future extensions include policy-as-code admission gates, signed image verification, stronger service identity with mTLS, and deeper SOC/SIEM integration.`

---

## 90-Second Backup Version

`This project is a secure-by-default microservice deployment platform on Kubernetes. User services are never directly exposed; only the gateway is public. The gateway enforces WAF checks, rate limiting, and route-level API keys. Trivy scans container images and Nikto scans deployed services. Redis stores route and security state, including blocked event logs. So the platform provides both prevention and evidence.`
