# Professor Presentation Kit

## 1) One-line Project Statement

`Secure Microservice Deployer is a Kubernetes-based platform that deploys containerized services safely by forcing all traffic through a programmable API gateway with built-in WAF, rate limiting, API-key protection, and vulnerability scanning.`

## 2) Problem -> Gap -> Solution

### Problem
In student and small-team deployments, microservices are often exposed directly after deployment, with weak traffic controls and no integrated security verification.

### Gap
Most simple deployment dashboards focus on "running the app" but not on "controlling risk" after deployment.

### Solution
This project combines deployment + security controls in one workflow:

1. Upload image (`/upload-image`) and deploy service (`/deploy-service`) into Kubernetes (`user-services` namespace).
2. Keep user services internal (`ClusterIP`) and expose only the gateway (`NodePort 30080`).
3. Enforce protections at gateway level:
- SQLi/XSS/header WAF middleware
- per-service and per-route rate limiting
- route-level API key authentication
4. Add scanning evidence:
- image scan with Trivy
- live service scan with Nikto
5. Store configs/events in Redis for observability and replayable evidence.

## 3) What Makes This Project Strong

- Security by architecture, not only by app code.
- Single ingress pattern: one gateway controls all services.
- Practical controls that are demonstrable in minutes.
- Real + simulation mode for reliable presentations.
- Clear service lifecycle support: deploy, list, scan, start/stop, redeploy, rename, delete.

## 4) Architecture (Talk Track)

`The frontend calls the deployer backend. The backend creates Kubernetes Deployment and Service resources for user apps, then registers a route in the gateway. External traffic can only enter through the gateway, where WAF, rate limiting, and API-key rules are enforced. Redis stores route maps, security configs, and event logs. Trivy scans container images; Nikto scans running services. So we can prove both prevention and detection.`

## 5) 2-Minute Viva Script

`My project is a Secure Microservice Deployer for Kubernetes. The key idea is that deployment and security must happen together. A user uploads a Docker image and deploys it as a microservice, but the service remains internal as ClusterIP. The only public entry is the gateway on NodePort 30080.`

`At the gateway, I implemented three major protections: WAF checks for SQL injection and XSS patterns, header sanitization and content-type enforcement, and rate limiting by service/route. I also added route-level API-key auth for sensitive endpoints. So instead of trusting every service to implement defense correctly, the platform enforces controls centrally.`

`For verification, I integrated Trivy for image vulnerability scanning and Nikto for live endpoint scanning. Security events and configurations are persisted in Redis, so the dashboard can show real blocked traffic and stats. I also built simulation demos for SQLi, XSS, rate limiting, and API-key protection so the same security story is easy to explain even if live infrastructure is unstable.`

`In short, this is not just a deployment tool; it is a secure deployment workflow with measurable and demonstrable controls.`

## 6) 5-Minute Demo Flow

1. Show architecture slide/diagram.
2. Deploy one sample service from image.
3. Access through gateway URL (`/service-name/...`) and explain why direct service access is blocked.
4. Enable WAF config for service; send malicious SQLi/XSS request and show block response.
5. Show rate limit by sending repeated requests and receiving `429`.
6. Protect one route with API key; show `401` without key, success with key.
7. Trigger Trivy/Nikto and show findings summary.
8. End on WAF events/stats as proof.

## 7) Viva Questions You Will Likely Get

### Q1: Why gateway-centric security?
Because it scales better than expecting every microservice to implement identical protections. One control plane secures many services.

### Q2: Why both Trivy and Nikto?
Trivy scans container image content (dependency/package risk). Nikto scans running web behavior (runtime endpoint risk). They cover different stages.

### Q3: Is this zero-trust?
Partially. Internal service exposure is restricted, and external access is mediated by policy checks. Full zero-trust identity and mTLS are future work.

### Q4: How do you persist security state?
Redis stores route registrations, WAF configs, API-key configs, rate-limit configs, and WAF events/counters.

### Q5: What are limitations?
Regex-based WAF can produce false positives/negatives; no distributed rate-limit store beyond single Redis setup; not yet integrated with CI policy gates.

## 8) Innovation + Future Scope (Professor-Friendly)

- Add OPA/Kyverno admission policies before deployment.
- Add signed image verification (Cosign).
- Add mTLS between services (service mesh).
- Add CVSS-based policy gate (block deploy if critical findings exceed threshold).
- Add SIEM integration for long-term alerting.

## 9) Slide Deck Blueprint (8 Slides)

1. Title + objective
2. Problem statement + threat model
3. Architecture overview
4. Deployment workflow
5. Security controls (WAF, rate limit, API key)
6. Scanning pipeline (Trivy + Nikto)
7. Demo proof (blocked attacks + logs)
8. Limitations + future work + conclusion

## 10) Evaluation Metrics You Can Quote

- Time-to-deploy per service
- Number of blocked malicious requests (WAF stats)
- Rate-limit enforcement correctness (`429` after threshold)
- Scan completion and vulnerability counts
- Service exposure model (only gateway public)

## 11) Submission Appendix Lines

Use this compact line in report abstract/conclusion:

`This project demonstrates a practical secure-by-default microservice deployment model where all user services remain internal and security policies are enforced centrally at a programmable API gateway with integrated scanning and monitoring.`
