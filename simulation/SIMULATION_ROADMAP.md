# Simulation Roadmap

This roadmap turns the broad simulation plan into an ordered, practical build and presentation sequence.

Status legend:
- `pending`
- `in progress`
- `complete`

---

## Demo Inventory

| ID | Demo | Type | Priority | Status | Depends On | Notes |
|---|---|---|---|---|---|---|
| D1 | SQL injection login demo | Custom simulation | Very High | complete | shared design system | Built inside `simulation/demos/sql-injection` with local fallback and optional live gateway mode |
| D2 | XSS feedback wall demo | Custom simulation | Very High | complete | shared design system | Built as a self-contained static simulation inside `simulation/demos/xss-feedback-wall` |
| D3 | Rate limiting ticket-rush demo | Custom simulation | Very High | complete | shared design system | Built inside `simulation/demos/rate-limiting` with local fallback and optional live gateway mode |
| D4 | API key protected-route demo | Custom simulation | High | complete | shared design system | Built as a self-contained static simulation inside `simulation/demos/api-key-protection` |
| D5 | Trivy image scan comparison | Real-platform demo guide | High | complete | none | Spec and expo flow are documented |
| D6 | Deployment and gateway access flow | Real-platform demo guide | High | complete | none | Spec and expo flow are documented |
| D7 | Nikto live scan flow | Real-platform demo guide | High | complete | D6 | Spec and expo flow are documented |
| D8 | WAF logs and dashboard flow | Real-platform demo guide | Very High | complete | D1, D2 preferred | Spec and expo proof flow are documented |
| D9 | OpenAPI detection flow | Real-platform demo guide | Medium | pending | D6 | Useful but less exciting |
| D10 | Service lifecycle controls flow | Real-platform demo guide | Medium | pending | D6 | Optional support demo |
| D11 | Dangerous headers demo | Optional | Medium | pending | shared design system | Include only if time allows |
| D12 | Shared launcher / navigation | Shared utility | Medium | complete | D1-D4 specs recommended | Implemented at `simulation/index.html` |

---

## Build Order

### Phase 1: Foundation

1. Create continuity docs and shared structure
2. Create roadmap and task tracking
3. Define shared design language for custom simulations

### Phase 2: Core content

4. Complete the four custom simulation specs
5. Build the four custom simulations
6. Write the primary real-platform guides:
   - deployment/gateway
   - Trivy
   - Nikto
   - WAF proof

### Phase 3: Presentation layer

7. Create shared launcher
8. Write presenter playbook
9. Write expo setup and reset runbook
10. Apply light consistency polish across the built demos

### Phase 4: Remaining optional additions

11. OpenAPI demo guide
12. Service lifecycle demo guide
13. Dangerous headers decision/demo

---

## Parallelization Guidance

Best independent work streams:

- Stream A
  Foundation docs and roadmap

- Stream B
  SQL injection spec and build

- Stream C
  XSS spec and build

- Stream D
  Rate limiting spec and build

- Stream E
  API key spec and build

- Stream F
  Real-platform demo guides:
  - Trivy
  - deployment/gateway
  - Nikto
  - WAF dashboard

---

## Recommended First Four Deliverables

If time is limited, the first four finished outputs should be:

1. SQL injection demo
2. XSS demo
3. Rate limiting demo
4. Trivy real-platform demo guide

This set gives the strongest expo impact quickly.
