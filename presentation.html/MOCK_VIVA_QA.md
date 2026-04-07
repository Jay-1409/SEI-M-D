# Mock Viva: Tough Questions and Strong Answers

## Q1. What is your core contribution beyond a normal deployer?
`My core contribution is secure-by-default orchestration. The platform does not stop at deployment; it enforces centralized gateway controls and provides measurable security evidence through logs and scan outputs.`

## Q2. Why did you keep user services as ClusterIP?
`That enforces network-level isolation. External users cannot directly hit service pods; all traffic must pass through one controlled gateway.`

## Q3. Why security at gateway instead of only app code?
`Gateway enforcement gives consistency across services. If each service handles security separately, controls become uneven and harder to audit.`

## Q4. How is SQLi/XSS detection implemented?
`The gateway middleware inspects path, query, body, and cookies using rule patterns. On detection it blocks the request and logs a structured event.`

## Q5. Could regex-based WAF generate false positives?
`Yes, that is a known tradeoff. This is why I expose per-service configuration and consider this a baseline protection layer, not a complete replacement for secure coding and deeper WAF engines.`

## Q6. Why both Trivy and Nikto?
`Trivy is image-focused and catches vulnerable packages. Nikto is runtime-focused and checks deployed web behavior. Combined, they cover different attack surfaces.`

## Q7. Where is state stored, and why?
`Redis stores route mappings, WAF/rate-limit/API-key configs, and event counters. This enables persistence, observability, and quick retrieval by dashboards and APIs.`

## Q8. How do you prove rate limiting works?
`By repeated requests that exceed configured thresholds and produce deterministic 429 responses with retry metadata.`

## Q9. How do you prevent unauthorized sensitive operations?
`Route-level API key enforcement at gateway verifies X-API-Key only on configured endpoints. Public endpoints can remain open while sensitive routes are protected.`

## Q10. What is one thing you would improve first?
`I would add policy gates before deployment, such as blocking releases if critical vulnerabilities exceed a threshold or image signature validation fails.`

## Q11. Is this production-ready?
`It is a strong prototype with practical controls and demonstrable behavior. For production, I would add hardened secrets management, HA Redis, stronger anomaly detection, and end-to-end policy governance.`

## Q12. What evaluation metrics did you use?
`Deploy success rate, scan completion status, vulnerability counts, number of blocked attacks, and correctness of 401/403/429 policy outcomes.`

## Q13. Why include simulation demos?
`Simulations ensure presentation reliability and teach security concepts clearly. Live mode demonstrates real platform integration when infrastructure is available.`

## Q14. What if Redis is down?
`Some policies and historical observability degrade. In this implementation, parts fail open for availability, which is practical for demos but should be hardened in production.`

## Q15. What is your final one-line conclusion?
`This project unifies deployment and runtime security into a single, explainable workflow with centralized enforcement and visible evidence.`
